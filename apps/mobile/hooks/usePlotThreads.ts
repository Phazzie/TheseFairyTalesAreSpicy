import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

/** Matches the actual plot_threads DB columns. */
export interface PlotThreadRecord {
  id: string;
  arc_id: string;
  /** Primary text for the thread — there is no 'title' column. */
  description: string;
  status: 'open' | 'resolved' | 'abandoned';
  planted_in_chapter: number | null;
  resolved_in_chapter: number | null;
  expected_payoff_chapter: string | null;
  thread_type?: string;
  created_at: string;
}

interface CreatePlotThreadInput {
  arc_id: string;
  description: string;
  planted_in_chapter?: number;
}

interface ResolveThreadInput {
  threadId: string;
  arcId: string;
  resolvedChapter?: number;
}

export function useOpenThreads(arcId: string | null) {
  return useQuery({
    queryKey: ['plot-threads', arcId, 'open'],
    enabled: !!arcId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    queryFn: async () => {
      if (!arcId) return [];
      const { data, error } = await supabase
        .from('plot_threads')
        .select('*')
        .eq('arc_id', arcId)
        .eq('status', 'open')
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return data as PlotThreadRecord[];
    },
  });
}

export function useCreateThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePlotThreadInput) => {
      const { data, error } = await supabase
        .from('plot_threads')
        .insert({ ...input, status: 'open' })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as PlotThreadRecord;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['plot-threads', data.arc_id] });
    },
  });
}

export function useResolveThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ threadId, arcId, resolvedChapter }: ResolveThreadInput) => {
      const updatePayload: Partial<PlotThreadRecord> = { status: 'resolved' };
      if (resolvedChapter !== undefined) {
        updatePayload.resolved_in_chapter = resolvedChapter;
      }
      const { data, error } = await supabase
        .from('plot_threads')
        .update(updatePayload)
        .eq('id', threadId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { data: data as PlotThreadRecord, arcId };
    },
    onSuccess: ({ arcId }) => {
      queryClient.invalidateQueries({ queryKey: ['plot-threads', arcId] });
    },
  });
}

interface AbandonThreadInput {
  threadId: string;
  arcId: string;
}

export function useAbandonThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ threadId, arcId }: AbandonThreadInput) => {
      const { data, error } = await supabase
        .from('plot_threads')
        .update({ status: 'abandoned' })
        .eq('id', threadId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { data: data as PlotThreadRecord, arcId };
    },
    onSuccess: ({ arcId }) => {
      queryClient.invalidateQueries({ queryKey: ['plot-threads', arcId] });
    },
  });
}
