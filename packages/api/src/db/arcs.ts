import type { ArcSettings } from '@story/engine';
import { adminClient } from './supabase.js';
import type { Database } from './database.types.js';

type ArcRow = Database['public']['Tables']['arcs']['Row'];
type ArcInsert = Database['public']['Tables']['arcs']['Insert'];
type ArcUpdate = Database['public']['Tables']['arcs']['Update'];

// ============================================================
// INPUT TYPES
// ============================================================

export type CreateArcInput = {
  userId: string;
  title?: string;
  creatureType: ArcRow['creature_type'];
  arcType: ArcRow['arc_type'];
  themes: string[];
  defaultSpiceLevel: number;
  povMode: ArcRow['pov_mode'];
  tense: ArcRow['tense'];
  narrativeDistance: ArcRow['narrative_distance'];
  readingLevel: ArcRow['reading_level'];
  dialogueRatioPct: number;
  hookDensity: ArcRow['hook_density'];
  pacingRhythm: ArcRow['pacing_rhythm'];
  sceneCountDefault: number;
  atmosphereArchetype: string;
  defaultSensePrimary: ArcRow['default_sense_primary'];
  defaultSenseSecondary: ArcRow['default_sense_secondary'];
  recurringMotif?: string;
  genreBlendPrimary: ArcRow['genre_blend_primary'];
  genreBlendSecondary?: ArcRow['genre_blend_secondary'];
  genreBlendRatio: number;
  toneAllowance: ArcRow['tone_allowance'];
  isQuickStart?: boolean;
  coverImageUrl?: string;
};

export type UpdateArcInput = Partial<Omit<CreateArcInput, 'userId'>>;

// ============================================================
// MAPPERS
// ============================================================

function dbRowToArcSettings(row: ArcRow): ArcSettings {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title ?? '',
    creatureType: row.creature_type,
    arcType: row.arc_type,
    themes: row.themes,
    defaultSpiceLevel: row.default_spice_level as ArcSettings['defaultSpiceLevel'],
    povMode: row.pov_mode,
    tense: row.tense,
    narrativeDistance: row.narrative_distance,
    readingLevel: row.reading_level,
    dialogueRatioPct: row.dialogue_ratio_pct,
    hookDensity: row.hook_density,
    pacingRhythm: row.pacing_rhythm,
    sceneCountDefault: row.scene_count_default as ArcSettings['sceneCountDefault'],
    atmosphereArchetype: row.atmosphere_archetype as ArcSettings['atmosphereArchetype'],
    defaultSensoryPrimary: row.default_sense_primary,
    defaultSensorySecondary: row.default_sense_secondary,
    recurringMotif: row.recurring_motif ?? undefined,
    genreBlendPrimary: row.genre_blend_primary,
    genreBlendSecondary: row.genre_blend_secondary ?? undefined,
    genreBlendRatio: row.genre_blend_ratio,
    toneAllowance: row.tone_allowance,
    isQuickStart: row.is_quick_start,
    coverImageUrl: row.cover_image_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function createInputToDbInsert(data: CreateArcInput): ArcInsert {
  return {
    user_id: data.userId,
    title: data.title ?? null,
    creature_type: data.creatureType,
    arc_type: data.arcType,
    themes: data.themes,
    default_spice_level: data.defaultSpiceLevel,
    pov_mode: data.povMode,
    tense: data.tense,
    narrative_distance: data.narrativeDistance,
    reading_level: data.readingLevel,
    dialogue_ratio_pct: data.dialogueRatioPct,
    hook_density: data.hookDensity,
    pacing_rhythm: data.pacingRhythm,
    scene_count_default: data.sceneCountDefault,
    atmosphere_archetype: data.atmosphereArchetype,
    default_sense_primary: data.defaultSensePrimary,
    default_sense_secondary: data.defaultSenseSecondary,
    recurring_motif: data.recurringMotif ?? null,
    genre_blend_primary: data.genreBlendPrimary,
    genre_blend_secondary: data.genreBlendSecondary ?? null,
    genre_blend_ratio: data.genreBlendRatio,
    tone_allowance: data.toneAllowance,
    is_quick_start: data.isQuickStart ?? false,
    cover_image_url: data.coverImageUrl ?? null,
  };
}

function updateInputToDbUpdate(patch: UpdateArcInput): ArcUpdate {
  const update: ArcUpdate = {};
  if (patch.title !== undefined) update.title = patch.title ?? null;
  if (patch.creatureType !== undefined) update.creature_type = patch.creatureType;
  if (patch.arcType !== undefined) update.arc_type = patch.arcType;
  if (patch.themes !== undefined) update.themes = patch.themes;
  if (patch.defaultSpiceLevel !== undefined) update.default_spice_level = patch.defaultSpiceLevel;
  if (patch.povMode !== undefined) update.pov_mode = patch.povMode;
  if (patch.tense !== undefined) update.tense = patch.tense;
  if (patch.narrativeDistance !== undefined) update.narrative_distance = patch.narrativeDistance;
  if (patch.readingLevel !== undefined) update.reading_level = patch.readingLevel;
  if (patch.dialogueRatioPct !== undefined) update.dialogue_ratio_pct = patch.dialogueRatioPct;
  if (patch.hookDensity !== undefined) update.hook_density = patch.hookDensity;
  if (patch.pacingRhythm !== undefined) update.pacing_rhythm = patch.pacingRhythm;
  if (patch.sceneCountDefault !== undefined) update.scene_count_default = patch.sceneCountDefault;
  if (patch.atmosphereArchetype !== undefined) update.atmosphere_archetype = patch.atmosphereArchetype;
  if (patch.defaultSensePrimary !== undefined) update.default_sense_primary = patch.defaultSensePrimary;
  if (patch.defaultSenseSecondary !== undefined) update.default_sense_secondary = patch.defaultSenseSecondary;
  if (patch.recurringMotif !== undefined) update.recurring_motif = patch.recurringMotif ?? null;
  if (patch.genreBlendPrimary !== undefined) update.genre_blend_primary = patch.genreBlendPrimary;
  if (patch.genreBlendSecondary !== undefined) update.genre_blend_secondary = patch.genreBlendSecondary ?? null;
  if (patch.genreBlendRatio !== undefined) update.genre_blend_ratio = patch.genreBlendRatio;
  if (patch.toneAllowance !== undefined) update.tone_allowance = patch.toneAllowance;
  if (patch.isQuickStart !== undefined) update.is_quick_start = patch.isQuickStart;
  if (patch.coverImageUrl !== undefined) update.cover_image_url = patch.coverImageUrl ?? null;
  return update;
}

// ============================================================
// QUERIES
// ============================================================

export async function getArc(arcId: string, userId: string): Promise<ArcSettings> {
  const { data, error } = await adminClient
    .from('arcs')
    .select('*')
    .eq('id', arcId)
    .eq('user_id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch arc ${arcId}: ${error.message}`);
  }
  if (!data) {
    throw new Error(`Arc ${arcId} not found or does not belong to user ${userId}`);
  }

  return dbRowToArcSettings(data);
}

export async function getArcs(userId: string): Promise<ArcSettings[]> {
  const { data, error } = await adminClient
    .from('arcs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch arcs for user ${userId}: ${error.message}`);
  }

  return (data ?? []).map(dbRowToArcSettings);
}

export async function getArcCount(userId: string): Promise<number> {
  const { count, error } = await adminClient
    .from('arcs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to count arcs for user ${userId}: ${error.message}`);
  }

  return count ?? 0;
}

export async function createArc(data: CreateArcInput, userId: string): Promise<ArcSettings> {
  const insert = createInputToDbInsert({ ...data, userId });

  const { data: created, error } = await adminClient
    .from('arcs')
    .insert(insert)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create arc: ${error.message}`);
  }
  if (!created) {
    throw new Error('Arc creation returned no data');
  }

  return dbRowToArcSettings(created);
}

export async function updateArc(
  arcId: string,
  patch: UpdateArcInput,
  userId: string,
): Promise<ArcSettings> {
  const update = updateInputToDbUpdate(patch);

  const { data: updated, error } = await adminClient
    .from('arcs')
    .update(update)
    .eq('id', arcId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update arc ${arcId}: ${error.message}`);
  }
  if (!updated) {
    throw new Error(`Arc ${arcId} not found or does not belong to user ${userId}`);
  }

  return dbRowToArcSettings(updated);
}

export async function deleteArc(arcId: string, userId: string): Promise<void> {
  const { error } = await adminClient
    .from('arcs')
    .delete()
    .eq('id', arcId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete arc ${arcId}: ${error.message}`);
  }
}
