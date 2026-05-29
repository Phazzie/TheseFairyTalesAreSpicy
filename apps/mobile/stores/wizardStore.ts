import { create } from 'zustand';

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

export const useWizardStore = create<WizardState>((set, get) => ({
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
      creature_type: s.creatureType,
      themes: s.themes,
      spice_level: s.spiceLevel,
      reading_level: s.readingLevel,
      genre_blend_primary: s.genreBlendPrimary,
      genre_blend_secondary: s.genreBlendSecondary || null,
      genre_blend_ratio: s.genreBlendSecondary ? s.genreBlendRatio : null,
      pov_mode: s.povMode,
      tense: s.tense,
      narrative_distance: s.narrativeDistance,
      pacing_rhythm: s.pacingRhythm,
      atmosphere_archetype: s.atmosphereArchetype,
      sensory_primary: s.sensoryPrimary,
      recurring_motif: s.recurringMotif || null,
      protagonist: {
        name: s.protagonistName,
        species: s.protagonistSpecies,
        stated_desire: s.protagonistDesire,
        hidden_need: s.protagonistNeed,
        wound: s.protagonistWound,
        flaw: s.protagonistFlaw,
        lie: s.protagonistLie,
      },
      love_interest: {
        name: s.loveInterestName,
        species: s.loveInterestSpecies,
        stated_desire: s.loveInterestDesire,
        hidden_need: s.loveInterestNeed,
        wound: s.loveInterestWound,
        flaw: s.loveInterestFlaw,
        lie: s.loveInterestLie,
      },
      creature_lore: {
        rules: s.creatureRules
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean),
        weaknesses: s.creatureWeaknesses
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean),
        abilities: s.creatureAbilities
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean),
      },
      is_quick_start: false,
    };
  },
}));
