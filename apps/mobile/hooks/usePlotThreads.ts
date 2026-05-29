import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

interface PlotThread {
  id: string;
  arc_id: string;
  title: string;
  description: string | null;
  status: 'open' | 'resolved';
  introduced_chapter: number | null;
  resolved_chapter: number | null;
  created_at: string;
}

interface CreatePlotThreadInput {
  arc_id: string;
  title: string;
  description?: string;
  introduced_chapter?: number;
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
    queryFn: async () => {
      if (!arcId) return [];
      const { data, error } = await supabase
        .from('plot_threads')
        .select('*')
        .eq('arc_id', arcId)
        .eq('status', 'open')
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return data as PlotThread[];
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
      return data as PlotThread;
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
      const updatePayload: Partial<PlotThread> = { status: 'resolved' };
      if (resolvedChapter !== undefined) {
        updatePayload.resolved_chapter = resolvedChapter;
      }
      const { data, error } = await supabase
        .from('plot_threads')
        .update(updatePayload)
        .eq('id', threadId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { data: data as PlotThread, arcId };
    },
    onSuccess: ({ arcId }) => {
      queryClient.invalidateQueries({ queryKey: ['plot-threads', arcId] });
    },
  });
}
