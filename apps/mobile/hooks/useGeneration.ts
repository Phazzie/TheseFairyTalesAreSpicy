import { useCallback, useRef } from 'react';
import { useArcStore } from '../stores/arcStore.js';
import { generateChapter, continueChapter } from '../lib/api.js';
import { useQueryClient } from '@tanstack/react-query';

export function useGeneration() {
  const { setIsGenerating, clearStreamingText, appendStreamingText } = useArcStore();
  const queryClient = useQueryClient();
  const bufferRef = useRef('');
  const abortControllerRef = useRef<AbortController | null>(null);

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
            // Flush to Zustand every 50 chars to avoid excessive re-renders
            if (bufferRef.current.length >= 50) {
              appendStreamingText(bufferRef.current);
              bufferRef.current = '';
            }
          } else if (event.type === 'complete') {
            // Flush remaining buffer
            if (bufferRef.current.length > 0) {
              appendStreamingText(bufferRef.current);
              bufferRef.current = '';
            }
            // Invalidate chapters cache
            await queryClient.invalidateQueries({ queryKey: ['chapters', params.arcId] });
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
