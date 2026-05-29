import { useCallback, useRef } from 'react';
import { useArcStore } from '../stores/arcStore.js';
import { generateChapter } from '../lib/api.js';
import { useQueryClient } from '@tanstack/react-query';

export function useGeneration() {
  const { setIsGenerating, clearStreamingText, appendStreamingText } = useArcStore();
  const queryClient = useQueryClient();
  const bufferRef = useRef('');

  const generate = useCallback(
    async (params: {
      arcId: string;
      chapterNumber: number;
      spiceLevelOverride?: number;
      userCreativeDirection?: string;
    }) => {
      setIsGenerating(true);
      clearStreamingText();
      bufferRef.current = '';

      try {
        for await (const event of generateChapter(params)) {
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
          }
        }
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

  return { generate };
}
