import { useCallback, useEffect, useRef } from 'react';
import { useArcStore } from '../stores/arcStore.js';
import { generateChapter, continueChapter } from '../lib/api.js';
import { useQueryClient } from '@tanstack/react-query';

export function useGeneration() {
  const setIsGenerating = useArcStore((s) => s.setIsGenerating);
  const clearStreamingText = useArcStore((s) => s.clearStreamingText);
  const appendStreamingText = useArcStore((s) => s.appendStreamingText);
  const queryClient = useQueryClient();
  const bufferRef = useRef('');
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      // Abort any in-flight generation when component unmounts
      abortControllerRef.current?.abort();
    };
  }, []); // empty deps — runs cleanup only on unmount

  const generate = useCallback(
    async (params: {
      arcId: string;
      chapterNumber: number;
      priorChapterId?: string;
      spiceLevelOverride?: number;
      userCreativeDirection?: string;
    }) => {
      // Cancel any in-flight generation
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setIsGenerating(true);
      clearStreamingText();
      bufferRef.current = '';

      const iterator = params.priorChapterId
        ? continueChapter({ ...params, priorChapterId: params.priorChapterId }, signal)
        : generateChapter(params, signal);

      try {
        for await (const event of iterator) {
          if (signal.aborted) break;
          if (event.type === 'token') {
            bufferRef.current += event.content;
            // Flush to Zustand every 200 chars to avoid excessive re-renders
            if (bufferRef.current.length >= 200) {
              appendStreamingText(bufferRef.current);
              bufferRef.current = '';
            }
          } else if (event.type === 'complete') {
            // Flush remaining buffer
            if (bufferRef.current.length > 0) {
              appendStreamingText(bufferRef.current);
              bufferRef.current = '';
            }
            // Optimistically push new chapter into cache immediately
            const completeEvent = event as {
              type: 'complete';
              chapterId?: string;
              title?: string;
              cliffhangerType?: string;
              wordCount?: number;
            };
            queryClient.setQueryData(
              ['chapters', params.arcId],
              (old: Record<string, unknown>[] | undefined) => {
                const newChapter: Record<string, unknown> = {
                  id: completeEvent.chapterId,
                  arc_id: params.arcId,
                  chapter_number: Number(params.chapterNumber ?? 1),
                  title: completeEvent.title ?? 'Untitled Chapter',
                  status: 'published',
                  cliffhanger_type: completeEvent.cliffhangerType ?? 'none',
                  word_count: completeEvent.wordCount ?? 0,
                  spice_level_used: 2,
                  generation_attempt: 1,
                  generated_at: new Date().toISOString(),
                  content: '',
                };
                return old ? [...old, newChapter] : [newChapter];
              },
            );
            // Non-urgent full refetch to get complete row data
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['chapters', params.arcId] });
            }, 2000);
            return event;
          } else if (event.type === 'error') {
            throw new Error(event.message ?? 'Generation failed');
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return; // clean cancel
        throw err;
      } finally {
        // Flush any remaining buffer on exit
        if (bufferRef.current.length > 0) {
          appendStreamingText(bufferRef.current);
          bufferRef.current = '';
        }
        setIsGenerating(false);
      }
    },
    [setIsGenerating, clearStreamingText, appendStreamingText, queryClient],
  );

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return { generate, cancel };
}
