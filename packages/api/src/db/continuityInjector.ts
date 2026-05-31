import type {
  ArcContext,
  ArcSettings,
  CharacterProfile,
  RelationshipPair,
  CreatureLore,
  WorldNote,
  PlotThread,
  ArcSummary,
  ChapterMetadata,
} from '@story/engine';
import { getArc } from './arcs.js';
import { getCharacters } from './characters.js';
import { getRecentChapterMetadata, chapterRowToMetadata } from './chapters.js';
import { getOpenThreads } from './plotThreads.js';
import { getLatestSummary } from './arcSummaries.js';
import { adminClient, createUserClient } from './supabase.js';
import type { Database } from './database.types.js';
import type { SupabaseClient } from '@supabase/supabase-js';

type RelationshipRow = Database['public']['Tables']['relationship_map']['Row'];
type CreatureLoreRow = Database['public']['Tables']['creature_lore']['Row'];
type WorldNoteRow = Database['public']['Tables']['world_notes']['Row'];

// ============================================================
// INTERNAL MAPPERS
// ============================================================

function dbRowToRelationshipPair(row: RelationshipRow): RelationshipPair {
  return {
    id: row.id,
    arcId: row.arc_id,
    characterAId: row.character_a_id,
    characterBId: row.character_b_id,
    powerHolder: row.power_holder,
    tensionType: row.tension_type,
    history: row.history,
    currentDynamic: row.current_dynamic,
  };
}

function dbRowToCreatureLore(row: CreatureLoreRow): CreatureLore {
  // custom_fields is Json from DB — cast to Record<string, string> for domain type
  const customFields: Record<string, string> = {};
  if (row.custom_fields && typeof row.custom_fields === 'object' && !Array.isArray(row.custom_fields)) {
    for (const [key, value] of Object.entries(row.custom_fields)) {
      if (typeof value === 'string') {
        customFields[key] = value;
      } else if (value !== null && value !== undefined) {
        customFields[key] = String(value);
      }
    }
  }

  return {
    arcId: row.arc_id,
    creatureType: row.creature_type,
    rules: row.rules ?? [],
    weaknesses: row.weaknesses ?? [],
    abilities: row.abilities ?? [],
    societyNotes: row.society_notes ?? '',
    customFields,
  };
}

function dbRowToWorldNote(row: WorldNoteRow): WorldNote {
  return {
    id: row.id,
    arcId: row.arc_id,
    category: row.category,
    content: row.content,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

// ============================================================
// PARALLEL FETCHERS (internal helpers)
// ============================================================

async function fetchRelationships(arcId: string): Promise<RelationshipPair[]> {
  const { data, error } = await adminClient
    .from('relationship_map')
    .select('*')
    .eq('arc_id', arcId);

  if (error) {
    throw new Error(`Failed to fetch relationships for arc ${arcId}: ${error.message}`);
  }

  return (data ?? []).map(dbRowToRelationshipPair);
}

async function fetchCreatureLore(arcId: string): Promise<CreatureLore | null> {
  const { data, error } = await adminClient
    .from('creature_lore')
    .select('*')
    .eq('arc_id', arcId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch creature lore for arc ${arcId}: ${error.message}`);
  }

  return data ? dbRowToCreatureLore(data) : null;
}

async function fetchActiveWorldNotes(arcId: string): Promise<WorldNote[]> {
  const { data, error } = await adminClient
    .from('world_notes')
    .select('*')
    .eq('arc_id', arcId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch world notes for arc ${arcId}: ${error.message}`);
  }

  return (data ?? []).map(dbRowToWorldNote);
}

// Client-parameterised variants for user-scoped queries (RLS defense in depth)
async function fetchRelationshipsWithClient(client: SupabaseClient<Database>, arcId: string): Promise<RelationshipPair[]> {
  const { data, error } = await client
    .from('relationship_map')
    .select('*')
    .eq('arc_id', arcId);

  if (error) {
    throw new Error(`Failed to fetch relationships for arc ${arcId}: ${error.message}`);
  }

  return (data ?? []).map(dbRowToRelationshipPair);
}

async function fetchCreatureLoreWithClient(client: SupabaseClient<Database>, arcId: string): Promise<CreatureLore | null> {
  const { data, error } = await client
    .from('creature_lore')
    .select('*')
    .eq('arc_id', arcId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch creature lore for arc ${arcId}: ${error.message}`);
  }

  return data ? dbRowToCreatureLore(data) : null;
}

async function fetchActiveWorldNotesWithClient(client: SupabaseClient<Database>, arcId: string): Promise<WorldNote[]> {
  const { data, error } = await client
    .from('world_notes')
    .select('*')
    .eq('arc_id', arcId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch world notes for arc ${arcId}: ${error.message}`);
  }

  return (data ?? []).map(dbRowToWorldNote);
}

// ============================================================
// TIMEOUT HELPER
// ============================================================

const CONTEXT_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`assembleArcContext timed out after ${ms}ms (${label})`)), ms)
    ),
  ]);
}

// ============================================================
// MAIN ASSEMBLER — called before every generation
// ============================================================

/**
 * assembleArcContext — fetches all data needed for a generation call.
 *
 * 1. Verifies the user owns the arc (throws if not).
 * 2. Fires all remaining queries in parallel for maximum speed.
 * 3. Returns a fully typed ArcContext.
 */
export async function assembleArcContext(arcId: string, userId: string, userJwt?: string): Promise<ArcContext> {
  const supabase = userJwt ? createUserClient(userJwt) : adminClient;

  // Step 1: Verify ownership — getArc throws if arc not found or user doesn't own it
  const arc: ArcSettings = await getArc(arcId, userId);

  // Step 2: Fetch everything else in parallel with a timeout
  const [
    characters,
    relationships,
    creatureLoreOrNull,
    worldNotes,
    plotThreads,
    rollingSummary,
    recentChapterRows,
  ] = await withTimeout(
    Promise.all([
      getCharacters(arcId),
      fetchRelationshipsWithClient(supabase, arcId),
      fetchCreatureLoreWithClient(supabase, arcId),
      fetchActiveWorldNotesWithClient(supabase, arcId),
      getOpenThreads(arcId),
      getLatestSummary(arcId),
      getRecentChapterMetadata(arcId, 3), // published only, metadata columns only
    ]),
    CONTEXT_TIMEOUT_MS,
    'parallel context fetch'
  );

  // Step 3: Build the last 3 chapters metadata for recent context
  const recentChapterMetadata: ChapterMetadata[] = recentChapterRows
    .map(chapterRowToMetadata);

  // Step 4: Provide a fallback creature lore if none stored yet
  const creatureLore: CreatureLore = creatureLoreOrNull ?? {
    arcId,
    creatureType: arc.creatureType,
    rules: [],
    weaknesses: [],
    abilities: [],
    societyNotes: '',
    customFields: {},
  };

  // Step 5: Assemble the complete context object
  const context: ArcContext = {
    arc,
    characters,
    relationships,
    creatureLore,
    worldNotes,
    plotThreads,
    rollingSummary: rollingSummary ?? undefined,
    recentChapterMetadata: recentChapterMetadata.length > 0 ? recentChapterMetadata : undefined,
  };

  return context;
}
