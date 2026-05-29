import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

export function useArcs() {
  return useQuery({
    queryKey: ['arcs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('arcs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export function useArc(arcId: string | null) {
  return useQuery({
    queryKey: ['arcs', arcId],
    enabled: !!arcId,
    queryFn: async () => {
      if (!arcId) return null;
      const { data, error } = await supabase
        .from('arcs')
        .select('*')
        .eq('id', arcId)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export function useCreateArc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data, error } = await supabase.from('arcs').insert(input).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['arcs'] }),
  });
}
