import type { PlotThread } from '@story/engine';
import { adminClient } from './supabase.js';
import type { Database } from './database.types.js';

type PlotThreadRow = Database['public']['Tables']['plot_threads']['Row'];

// ============================================================
// INPUT TYPES
// ============================================================

export type CreateThreadInput = {
  arcId: string;
  threadType: PlotThreadRow['thread_type'];
  description: string;
  plantedInChapter: number;
  expectedPayoffChapter?: number;
};

// ============================================================
// MAPPERS
// ============================================================

function dbRowToPlotThread(row: PlotThreadRow): PlotThread {
  return {
    id: row.id,
    arcId: row.arc_id,
    threadType: row.thread_type,
    description: row.description,
    plantedInChapter: row.planted_in_chapter,
    expectedPayoffChapter: row.expected_payoff_chapter ?? undefined,
    status: row.status,
    resolvedInChapter: row.resolved_in_chapter ?? undefined,
    resolutionNote: row.resolution_note ?? undefined,
    createdAt: row.created_at,
  };
}

// ============================================================
// QUERIES
// ============================================================

export async function getOpenThreads(arcId: string): Promise<PlotThread[]> {
  const { data, error } = await adminClient
    .from('plot_threads')
    .select('*')
    .eq('arc_id', arcId)
    .eq('status', 'open')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch open plot threads for arc ${arcId}: ${error.message}`);
  }

  return (data ?? []).map(dbRowToPlotThread);
}

export async function getAllThreads(arcId: string): Promise<PlotThread[]> {
  const { data, error } = await adminClient
    .from('plot_threads')
    .select('*')
    .eq('arc_id', arcId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch all plot threads for arc ${arcId}: ${error.message}`);
  }

  return (data ?? []).map(dbRowToPlotThread);
}

export async function createThread(data: CreateThreadInput): Promise<PlotThread> {
  const insert: Database['public']['Tables']['plot_threads']['Insert'] = {
    arc_id: data.arcId,
    thread_type: data.threadType,
    description: data.description,
    planted_in_chapter: data.plantedInChapter,
    expected_payoff_chapter: data.expectedPayoffChapter ?? null,
    status: 'open',
  };

  const { data: created, error } = await adminClient
    .from('plot_threads')
    .insert(insert)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create plot thread: ${error.message}`);
  }
  if (!created) {
    throw new Error('Plot thread creation returned no data');
  }

  return dbRowToPlotThread(created);
}

export async function resolveThread(
  threadId: string,
  resolvedInChapter: number,
  resolutionNote?: string,
): Promise<void> {
  const { error } = await adminClient
    .from('plot_threads')
    .update({
      status: 'resolved',
      resolved_in_chapter: resolvedInChapter,
      resolution_note: resolutionNote ?? null,
    })
    .eq('id', threadId);

  if (error) {
    throw new Error(`Failed to resolve plot thread ${threadId}: ${error.message}`);
  }
}

export async function abandonThread(threadId: string): Promise<void> {
  const { error } = await adminClient
    .from('plot_threads')
    .update({ status: 'abandoned' })
    .eq('id', threadId);

  if (error) {
    throw new Error(`Failed to abandon plot thread ${threadId}: ${error.message}`);
  }
}
