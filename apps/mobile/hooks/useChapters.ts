import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

export function useChapters(arcId: string | null) {
  return useQuery({
    queryKey: ['chapters', arcId],
    enabled: !!arcId,
    staleTime: 60 * 1000, // 1 minute
    queryFn: async () => {
      if (!arcId) return [];
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('arc_id', arcId)
        .order('chapter_number', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export function useChapter(chapterId: string | null) {
  return useQuery({
    queryKey: ['chapter', chapterId],
    enabled: !!chapterId,
    staleTime: 60 * 1000, // 1 minute
    queryFn: async () => {
      if (!chapterId) return null;
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', chapterId)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export function useDeleteChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ chapterId, arcId }: { chapterId: string; arcId: string }) => {
      const { error } = await supabase.from('chapters').delete().eq('id', chapterId);
      if (error) throw new Error(error.message);
      return { chapterId, arcId };
    },
    onSuccess: ({ arcId }) => {
      queryClient.invalidateQueries({ queryKey: ['chapters', arcId] });
    },
  });
}
