import type {
  ArcType,
  AtmosphereArchetype,
  BeatStructureCode,
  ChapterStatus,
  CliffhangerType,
  CreatureType,
  EmotionalArcType,
  GenreBlendPrimary,
  HookDensity,
  NarrativeDistance,
  OpeningType,
  PacingRhythm,
  POVMode,
  PowerHolder,
  RelationshipTensionType,
  SceneCount,
  SensoryPalette,
  SpiceLevel,
  SubscriptionTier,
  Tense,
  ThreadStatus,
  ThreadType,
  TitleStyle,
  ToneAllowance,
  VocabRegister,
  WorldNoteCategory,
  ReadingLevel,
} from './characteristics.js';

export type {
  ArcType, AtmosphereArchetype, BeatStructureCode, ChapterStatus, CliffhangerType,
  CreatureType, EmotionalArcType, GenreBlendPrimary, HookDensity, NarrativeDistance,
  OpeningType, PacingRhythm, POVMode, PowerHolder, RelationshipTensionType, SceneCount,
  SensoryPalette, SpiceLevel, SubscriptionTier, Tense, ThreadStatus, ThreadType,
  TitleStyle, ToneAllowance, VocabRegister, WorldNoteCategory, ReadingLevel,
} from './characteristics.js';

// ============================================================
// CHARACTER
// ============================================================

export interface Accent {
  id: string;
  region: string;
}

export interface EmotionState {
  id: string;
  label: string;
  prosodyNote: string;
}

export interface SpeechPattern {
  vocabRegister: VocabRegister;
  avgSentenceLength: 'short' | 'medium' | 'long';
  verbalTic?: string;
  signaturePhrase?: string;
}

export interface ContradictionModel {
  statedDesire: string;
  hiddenNeed: string;
}

export interface CharacterProfile {
  id: string;
  arcId: string;
  slug: string;
  displayName: string;
  species: 'human' | CreatureType;
  apparentAge: number;
  trueAge: number;
  isProtagonist: boolean;
  accent: Accent;
  emotionStates: EmotionState[];
  vocabRegister: VocabRegister;
  speech: SpeechPattern;
  contradiction?: ContradictionModel;
  wound?: string;
  flaw?: string;
  lie?: string;
  bio: string;
  appearance: string;
  createdAt: string;
}

// ============================================================
// RELATIONSHIPS + WORLD
// ============================================================

export interface RelationshipPair {
  id: string;
  arcId: string;
  characterAId: string;
  characterBId: string;
  powerHolder: PowerHolder;
  tensionType: RelationshipTensionType;
  history: string;
  currentDynamic: string;
}

export interface PlotThread {
  id: string;
  arcId: string;
  threadType: ThreadType;
  description: string;
  plantedInChapter: number;
  expectedPayoffChapter?: number;
  status: ThreadStatus;
  resolvedInChapter?: number;
  resolutionNote?: string;
  createdAt: string;
}

export interface WorldNote {
  id: string;
  arcId: string;
  category: WorldNoteCategory;
  content: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreatureLore {
  arcId: string;
  creatureType: CreatureType;
  rules: string[];
  weaknesses: string[];
  abilities: string[];
  societyNotes: string;
  customFields: Record<string, string>;
}

// ============================================================
// ARC
// ============================================================

export interface ArcSettings {
  id: string;
  userId: string;
  title: string;
  creatureType: CreatureType;
  arcType: ArcType;
  themes: string[];
  defaultSpiceLevel: SpiceLevel;
  povMode: POVMode;
  tense: Tense;
  narrativeDistance: NarrativeDistance;
  readingLevel: ReadingLevel;
  dialogueRatioPct: number;
  hookDensity: HookDensity;
  pacingRhythm: PacingRhythm;
  sceneCountDefault: SceneCount;
  atmosphereArchetype: AtmosphereArchetype;
  defaultSensoryPrimary: SensoryPalette;
  defaultSensorySecondary: SensoryPalette;
  recurringMotif?: string;
  genreBlendPrimary: GenreBlendPrimary;
  genreBlendSecondary?: GenreBlendPrimary;
  genreBlendRatio: number;
  toneAllowance: ToneAllowance;
  isQuickStart: boolean;
  coverImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArcSummary {
  id: string;
  arcId: string;
  chapterMilestone: number;
  summaryText: string;
  createdAt: string;
}

// ============================================================
// CHAPTER
// ============================================================

export interface ChapterMetadata {
  arcId: string;
  chapterNumber: number;
  beatUsed: BeatStructureCode;
  emotionalArc: EmotionalArcType;
  dialogueRatioPct: number;
  chekhovSeeded: string[];
  cliffhangerType: CliffhangerType;
  wordCount: number;
  spiceLevelUsed: SpiceLevel;
  generatedAt: string;
  engineVersion: string;
  status: ChapterStatus;
  generationAttempt: number;
  parentChapterId?: string;
  droppedModules: string[];
  systemPromptUsed?: string;
}

// ============================================================
// GENERATION INPUT / OUTPUT
// ============================================================

export interface GenerationInput {
  arcId: string;
  chapterNumber: number;
  spiceLevelOverride?: SpiceLevel;
  emotionalArcOverride?: EmotionalArcType;
  cliffhangerTypeOverride?: CliffhangerType;
  wordCountOverride?: number;
  userCreativeDirection?: string;
  pilotMode?: boolean;
  maxTokenBudget?: number;
  titleStyle?: TitleStyle;
}

export interface ContinuationInput extends GenerationInput {
  priorChapterId: string;
  priorChapterEngineVersion: string;
  priorSystemPrompt: string;
}

export interface GenerationOutput {
  chapterText: string;
  title: string;
  metadata: ChapterMetadata;
  engineVersion: string;
}

// ============================================================
// ARC CONTEXT
// ============================================================

export interface ArcContext {
  arc: ArcSettings;
  characters: CharacterProfile[];
  relationships: RelationshipPair[];
  creatureLore: CreatureLore;
  worldNotes: WorldNote[];
  plotThreads: PlotThread[];
  rollingSummary?: ArcSummary;
  recentChapterMetadata?: ChapterMetadata[];
}

// ============================================================
// USER
// ============================================================

export interface UserProfile {
  id: string;
  subscriptionTier: SubscriptionTier;
  monthlyGenerationCount: number;
  monthlyResetDate: string;
}

// ============================================================
// ERRORS
// ============================================================

export class ContextOverflowError extends Error {
  public readonly droppedModules: string[];
  constructor(message: string, droppedModules: string[]) {
    super(message);
    this.name = 'ContextOverflowError';
    this.droppedModules = droppedModules;
  }
}

// ============================================================
// ASSEMBLER RETURN TYPES
// ============================================================

export interface AssembledPrompt {
  prompt: string;
  engineVersion: string;
  droppedModules: string[];
}
