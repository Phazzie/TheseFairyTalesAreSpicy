import { create } from 'zustand';
import type { ArcSettings } from '@story/engine';

interface ArcState {
  currentArcId: string | null;
  currentArc: ArcSettings | null;
  streamingParagraphs: string[];  // completed paragraphs
  streamingTail: string;          // current incomplete paragraph
  isGenerating: boolean;
  setCurrentArcId: (arcId: string | null) => void;
  setCurrentArc: (arc: ArcSettings | null) => void;
  appendStreamingText: (chunk: string) => void;
  clearStreamingText: () => void;
  setIsGenerating: (generating: boolean) => void;
}

export const useArcStore = create<ArcState>((set) => ({
  currentArcId: null,
  currentArc: null,
  streamingParagraphs: [],
  streamingTail: '',
  isGenerating: false,
  setCurrentArcId: (currentArcId) => set({ currentArcId }),
  setCurrentArc: (currentArc) => set({ currentArc }),
  appendStreamingText: (chunk: string) => set((state) => {
    const combined = state.streamingTail + chunk;
    const parts = combined.split('\n\n');
    if (parts.length === 1) {
      return { streamingTail: combined };
    }
    const completedParagraphs = parts.slice(0, -1);
    const newTail = parts[parts.length - 1] ?? '';
    return {
      streamingParagraphs: [...state.streamingParagraphs, ...completedParagraphs],
      streamingTail: newTail,
    };
  }),
  clearStreamingText: () => set({ streamingParagraphs: [], streamingTail: '' }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
}));
