import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type CreatureType = 'vampire' | 'werewolf' | 'fairy';
type SpiceLevel = 1 | 2 | 3 | 4 | 5;
type AtmosphereArchetype =
  | 'gothic_estate'
  | 'contemporary_urban'
  | 'dark_academia'
  | 'historical'
  | 'high_fantasy_court'
  | 'small_town_secret'
  | 'coastal_isolation';

interface WizardState {
  // Step 1
  creatureType: CreatureType | null;
  // Step 2
  themes: string[];
  // Step 3
  spiceLevel: SpiceLevel;
  readingLevel: 'accessible' | 'commercial' | 'elevated' | 'archaic';
  genreBlendPrimary: string;
  genreBlendSecondary: string;
  genreBlendRatio: number;
  // Step 4
  povMode: string;
  tense: 'past' | 'present';
  narrativeDistance: 'close' | 'cinematic';
  pacingRhythm: 'slow_burn' | 'propulsive' | 'variable';
  // Step 5
  atmosphereArchetype: AtmosphereArchetype | null;
  sensoryPrimary: 'visual' | 'tactile' | 'auditory' | 'olfactory';
  recurringMotif: string;
  // Step 6 protagonist
  protagonistName: string;
  protagonistSpecies: string;
  protagonistDesire: string;
  protagonistNeed: string;
  protagonistWound: string;
  protagonistFlaw: string;
  protagonistLie: string;
  // Step 7 love interest
  loveInterestName: string;
  loveInterestSpecies: string;
  loveInterestDesire: string;
  loveInterestNeed: string;
  loveInterestWound: string;
  loveInterestFlaw: string;
  loveInterestLie: string;
  // Step 8 creature lore
  creatureRules: string;
  creatureWeaknesses: string;
  creatureAbilities: string;
  // Actions
  setField: <K extends keyof Omit<WizardState, 'setField' | 'addTheme' | 'removeTheme' | 'reset' | 'toArcInsert'>>(
    key: K,
    value: WizardState[K],
  ) => void;
  addTheme: (theme: string) => void;
  removeTheme: (theme: string) => void;
  reset: () => void;
  toArcInsert: () => Record<string, unknown>;
}

const DEFAULT_STATE = {
  creatureType: null as CreatureType | null,
  themes: [] as string[],
  spiceLevel: 3 as SpiceLevel,
  readingLevel: 'commercial' as const,
  genreBlendPrimary: 'romance',
  genreBlendSecondary: '',
  genreBlendRatio: 70,
  povMode: 'first_person',
  tense: 'past' as const,
  narrativeDistance: 'close' as const,
  pacingRhythm: 'slow_burn' as const,
  atmosphereArchetype: null as AtmosphereArchetype | null,
  sensoryPrimary: 'visual' as const,
  recurringMotif: '',
  protagonistName: '',
  protagonistSpecies: 'human',
  protagonistDesire: '',
  protagonistNeed: '',
  protagonistWound: '',
  protagonistFlaw: '',
  protagonistLie: '',
  loveInterestName: '',
  loveInterestSpecies: 'vampire',
  loveInterestDesire: '',
  loveInterestNeed: '',
  loveInterestWound: '',
  loveInterestFlaw: '',
  loveInterestLie: '',
  creatureRules: '',
  creatureWeaknesses: '',
  creatureAbilities: '',
};

export const useWizardStore = create<WizardState>()(
  persist(
    (set, get) => ({
  ...DEFAULT_STATE,

  setField: (key, value) => set({ [key]: value } as Partial<WizardState>),

  addTheme: (theme) =>
    set((state) => ({
      themes: state.themes.includes(theme) ? state.themes : [...state.themes, theme],
    })),

  removeTheme: (theme) =>
    set((state) => ({
      themes: state.themes.filter((t) => t !== theme),
    })),

  reset: () => set({ ...DEFAULT_STATE }),

  toArcInsert: () => {
    const s = get();
    return {
      creatureType: s.creatureType ?? 'vampire',
      arcType: 'single_couple' as const,
      themes: s.themes.length > 0 ? s.themes : ['forbidden love'],
      defaultSpiceLevel: s.spiceLevel,
      readingLevel: s.readingLevel,
      genreBlendPrimary: s.genreBlendPrimary || 'romance',
      genreBlendRatio: s.genreBlendRatio, // 50-100 range
      povMode: s.povMode || 'third_limited',
      tense: s.tense,
      narrativeDistance: s.narrativeDistance,
      pacingRhythm: s.pacingRhythm,
      atmosphereArchetype: s.atmosphereArchetype ?? 'contemporary_urban',
      defaultSensePrimary: s.sensoryPrimary,
      defaultSenseSecondary: s.sensoryPrimary === 'visual' ? 'tactile' : 'visual',
      dialogueRatioPct: 40, // default
      hookDensity: 'medium' as const, // default
      sceneCountDefault: 1 as const, // default
      toneAllowance: 'locked' as const, // default
      recurringMotif: s.recurringMotif || undefined,
      isQuickStart: false,
      protagonist: s.protagonistName ? {
        displayName: s.protagonistName,
        species: (s.protagonistSpecies || 'human') as 'human' | 'vampire' | 'werewolf' | 'fairy',
        statedDesire: s.protagonistDesire || undefined,
        hiddenNeed: s.protagonistNeed || undefined,
        wound: s.protagonistWound || undefined,
        flaw: s.protagonistFlaw || undefined,
        lie: s.protagonistLie || undefined,
      } : undefined,
      loveInterest: s.loveInterestName ? {
        displayName: s.loveInterestName,
        species: (s.loveInterestSpecies || 'human') as 'human' | 'vampire' | 'werewolf' | 'fairy',
        statedDesire: s.loveInterestDesire || undefined,
        hiddenNeed: s.loveInterestNeed || undefined,
        wound: s.loveInterestWound || undefined,
        flaw: s.loveInterestFlaw || undefined,
        lie: s.loveInterestLie || undefined,
      } : undefined,
      creatureLore: (s.creatureRules || s.creatureWeaknesses || s.creatureAbilities) ? {
        rules: s.creatureRules ? s.creatureRules.split('\n').filter(Boolean) : [],
        weaknesses: s.creatureWeaknesses ? s.creatureWeaknesses.split('\n').filter(Boolean) : [],
        abilities: s.creatureAbilities ? s.creatureAbilities.split('\n').filter(Boolean) : [],
      } : undefined,
    };
  },
    }),
    {
      name: 'wizard-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
