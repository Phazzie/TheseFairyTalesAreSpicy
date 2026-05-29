import type { ChapterMetadata } from '@story/engine';
import { adminClient } from './supabase.js';
import type { Database } from './database.types.js';

type ChapterDbRow = Database['public']['Tables']['chapters']['Row'];

// ============================================================
// TYPES
// ============================================================

// ChapterRow extends the raw DB row with parsed camelCase metadata
export type ChapterRow = {
  id: string;
  arcId: string;
  chapterNumber: number;
  title: string | null;
  content: string;
  wordCount: number;
  beatUsed: string;
  emotionalArc: string;
  dialogueRatioPct: number;
  chekhovSeeded: string[];
  cliffhangerType: string;
  spiceLevelUsed: number;
  engineVersion: string;
  status: 'published' | 'draft' | 'archived';
  generationAttempt: number;
  parentChapterId: string | null;
  droppedModules: string[];
  systemPromptUsed: string | null;
  archivedAt: string | null;
  generatedAt: string;
};

export type SaveChapterInput = {
  arcId: string;
  chapterNumber: number;
  title?: string;
  content: string;
  wordCount: number;
  beatUsed: string;
  emotionalArc: string;
  dialogueRatioPct: number;
  chekhovSeeded: string[];
  cliffhangerType: string;
  spiceLevelUsed: number;
  engineVersion: string;
  status?: 'published' | 'draft' | 'archived';
  generationAttempt?: number;
  parentChapterId?: string;
  droppedModules?: string[];
  systemPromptUsed?: string;
};

// ============================================================
// MAPPERS
// ============================================================

function dbRowToChapterRow(row: ChapterDbRow): ChapterRow {
  return {
    id: row.id,
    arcId: row.arc_id,
    chapterNumber: row.chapter_number,
    title: row.title,
    content: row.content,
    wordCount: row.word_count,
    beatUsed: row.beat_used,
    emotionalArc: row.emotional_arc,
    dialogueRatioPct: row.dialogue_ratio_pct,
    chekhovSeeded: row.chekhov_seeded ?? [],
    cliffhangerType: row.cliffhanger_type,
    spiceLevelUsed: row.spice_level_used,
    engineVersion: row.engine_version,
    status: row.status,
    generationAttempt: row.generation_attempt,
    parentChapterId: row.parent_chapter_id,
    droppedModules: row.dropped_modules ?? [],
    systemPromptUsed: row.system_prompt_used,
    archivedAt: row.archived_at,
    generatedAt: row.generated_at,
  };
}

export function chapterRowToMetadata(row: ChapterRow): ChapterMetadata {
  return {
    arcId: row.arcId,
    chapterNumber: row.chapterNumber,
    beatUsed: row.beatUsed,
    emotionalArc: row.emotionalArc as ChapterMetadata['emotionalArc'],
    dialogueRatioPct: row.dialogueRatioPct,
    chekhovSeeded: row.chekhovSeeded,
    cliffhangerType: row.cliffhangerType as ChapterMetadata['cliffhangerType'],
    wordCount: row.wordCount,
    spiceLevelUsed: row.spiceLevelUsed as ChapterMetadata['spiceLevelUsed'],
    generatedAt: row.generatedAt,
    engineVersion: row.engineVersion,
    status: row.status,
    generationAttempt: row.generationAttempt,
    parentChapterId: row.parentChapterId ?? undefined,
    droppedModules: row.droppedModules,
    systemPromptUsed: row.systemPromptUsed ?? undefined,
  };
}

// ============================================================
// QUERIES
// ============================================================

export async function saveChapter(data: SaveChapterInput): Promise<{ id: string }> {
  const insert: Database['public']['Tables']['chapters']['Insert'] = {
    arc_id: data.arcId,
    chapter_number: data.chapterNumber,
    title: data.title ?? null,
    content: data.content,
    word_count: data.wordCount,
    beat_used: data.beatUsed,
    emotional_arc: data.emotionalArc,
    dialogue_ratio_pct: data.dialogueRatioPct,
    chekhov_seeded: data.chekhovSeeded,
    cliffhanger_type: data.cliffhangerType,
    spice_level_used: data.spiceLevelUsed,
    engine_version: data.engineVersion,
    status: data.status ?? 'published',
    generation_attempt: data.generationAttempt ?? 1,
    parent_chapter_id: data.parentChapterId ?? null,
    dropped_modules: data.droppedModules ?? [],
    system_prompt_used: data.systemPromptUsed ?? null,
  };

  const { data: created, error } = await adminClient
    .from('chapters')
    .insert(insert)
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to save chapter: ${error.message}`);
  }
  if (!created) {
    throw new Error('Chapter save returned no data');
  }

  return { id: created.id };
}

export async function getChaptersByArc(
  arcId: string,
  includeNonPublished = false,
): Promise<ChapterRow[]> {
  let query = adminClient
    .from('chapters')
    .select('*')
    .eq('arc_id', arcId)
    .order('chapter_number', { ascending: true });

  if (!includeNonPublished) {
    query = query.eq('status', 'published');
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch chapters for arc ${arcId}: ${error.message}`);
  }

  return (data ?? []).map(dbRowToChapterRow);
}

export async function getChapter(chapterId: string): Promise<ChapterRow> {
  const { data, error } = await adminClient
    .from('chapters')
    .select('*')
    .eq('id', chapterId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch chapter ${chapterId}: ${error.message}`);
  }
  if (!data) {
    throw new Error(`Chapter ${chapterId} not found`);
  }

  return dbRowToChapterRow(data);
}

export async function getLatestPublishedChapter(arcId: string): Promise<ChapterRow | null> {
  const { data, error } = await adminClient
    .from('chapters')
    .select('*')
    .eq('arc_id', arcId)
    .eq('status', 'published')
    .order('chapter_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch latest published chapter for arc ${arcId}: ${error.message}`);
  }

  return data ? dbRowToChapterRow(data) : null;
}

export async function archiveChapter(chapterId: string): Promise<void> {
  const { error } = await adminClient
    .from('chapters')
    .update({
      status: 'archived',
      archived_at: new Date().toISOString(),
    })
    .eq('id', chapterId);

  if (error) {
    throw new Error(`Failed to archive chapter ${chapterId}: ${error.message}`);
  }
}

export async function publishChapter(chapterId: string): Promise<void> {
  // First, fetch the chapter to get its arc_id and chapter_number
  const chapter = await getChapter(chapterId);

  // Archive any existing published chapters at the same chapter_number in this arc
  const { data: existingPublished, error: fetchError } = await adminClient
    .from('chapters')
    .select('id')
    .eq('arc_id', chapter.arcId)
    .eq('chapter_number', chapter.chapterNumber)
    .eq('status', 'published')
    .neq('id', chapterId);

  if (fetchError) {
    throw new Error(
      `Failed to look up existing published chapters for arc ${chapter.arcId}, chapter ${chapter.chapterNumber}: ${fetchError.message}`,
    );
  }

  // Archive all prior published chapters at this number
  if (existingPublished && existingPublished.length > 0) {
    const idsToArchive = existingPublished.map((r) => r.id);
    const { error: archiveError } = await adminClient
      .from('chapters')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString(),
      })
      .in('id', idsToArchive);

    if (archiveError) {
      throw new Error(
        `Failed to archive prior published chapters: ${archiveError.message}`,
      );
    }
  }

  // Now publish the target chapter
  const { error: publishError } = await adminClient
    .from('chapters')
    .update({ status: 'published' })
    .eq('id', chapterId);

  if (publishError) {
    throw new Error(`Failed to publish chapter ${chapterId}: ${publishError.message}`);
  }
}
