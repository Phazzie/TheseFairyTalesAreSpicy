import { create } from 'zustand';
import type { ArcSettings } from '@story/engine';

interface ArcState {
  currentArcId: string | null;
  currentArc: ArcSettings | null;
  streamingText: string;
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
  streamingText: '',
  isGenerating: false,
  setCurrentArcId: (currentArcId) => set({ currentArcId }),
  setCurrentArc: (currentArc) => set({ currentArc }),
  appendStreamingText: (chunk) => set((state) => ({ streamingText: state.streamingText + chunk })),
  clearStreamingText: () => set({ streamingText: '' }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
}));
