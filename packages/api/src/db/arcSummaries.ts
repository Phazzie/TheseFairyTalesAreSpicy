import type { ArcSummary } from '@story/engine';
import { adminClient } from './supabase.js';
import type { Database } from './database.types.js';

type ArcSummaryRow = Database['public']['Tables']['arc_summaries']['Row'];

// ============================================================
// MAPPERS
// ============================================================

function dbRowToArcSummary(row: ArcSummaryRow): ArcSummary {
  return {
    id: row.id,
    arcId: row.arc_id,
    chapterMilestone: row.chapter_milestone,
    summaryText: row.summary_text,
    createdAt: row.created_at,
  };
}

// ============================================================
// QUERIES
// ============================================================

export async function getLatestSummary(arcId: string): Promise<ArcSummary | null> {
  const { data, error } = await adminClient
    .from('arc_summaries')
    .select('*')
    .eq('arc_id', arcId)
    .order('chapter_milestone', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch latest summary for arc ${arcId}: ${error.message}`);
  }

  return data ? dbRowToArcSummary(data) : null;
}

export async function saveSummary(
  arcId: string,
  chapterMilestone: number,
  summaryText: string,
): Promise<void> {
  // Upsert: unique constraint on (arc_id, chapter_milestone)
  const upsert: Database['public']['Tables']['arc_summaries']['Insert'] = {
    arc_id: arcId,
    chapter_milestone: chapterMilestone,
    summary_text: summaryText,
  };

  const { error } = await adminClient
    .from('arc_summaries')
    .upsert(upsert, { onConflict: 'arc_id,chapter_milestone' });

  if (error) {
    throw new Error(
      `Failed to save summary for arc ${arcId} at milestone ${chapterMilestone}: ${error.message}`,
    );
  }
}
