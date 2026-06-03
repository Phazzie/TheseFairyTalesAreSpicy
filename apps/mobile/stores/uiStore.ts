import { create } from 'zustand';
import { WIZARD_TOTAL_STEPS } from '../lib/constants.js';

interface UIState {
  activeTab: 'write' | 'bible' | 'threads' | 'library';
  wizardStep: number;
  showUpgradeSheet: boolean;
  setActiveTab: (tab: UIState['activeTab']) => void;
  setWizardStep: (step: number) => void;
  nextWizardStep: () => void;
  prevWizardStep: () => void;
  openUpgradeSheet: () => void;
  closeUpgradeSheet: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'write',
  wizardStep: 1,
  showUpgradeSheet: false,
  setActiveTab: (activeTab) => set({ activeTab }),
  setWizardStep: (wizardStep) => set({ wizardStep }),
  nextWizardStep: () => set((state) => ({ wizardStep: Math.min(state.wizardStep + 1, WIZARD_TOTAL_STEPS) })),
  prevWizardStep: () => set((state) => ({ wizardStep: Math.max(1, state.wizardStep - 1) })),
  openUpgradeSheet: () => set({ showUpgradeSheet: true }),
  closeUpgradeSheet: () => set({ showUpgradeSheet: false }),
}));
