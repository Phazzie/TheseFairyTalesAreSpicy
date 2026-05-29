// All primitive union types for the story engine
// This file contains no interfaces — only union types and enums

export type CreatureType = 'vampire' | 'werewolf' | 'fairy';

export type SpiceLevel = 1 | 2 | 3 | 4 | 5;

export type POVMode = 'first_person' | 'third_limited' | 'third_omniscient' | 'rotating';

export type Tense = 'past' | 'present';

export type NarrativeDistance = 'close' | 'cinematic';

export type ReadingLevel = 'accessible' | 'commercial' | 'elevated' | 'archaic';

export type ArcType = 'single_couple' | 'anthology' | 'multi_protagonist';

export type AtmosphereArchetype =
  | 'gothic_estate'
  | 'contemporary_urban'
  | 'dark_academia'
  | 'historical'
  | 'high_fantasy_court'
  | 'small_town_secret'
  | 'coastal_isolation';

export type SensoryPalette = 'visual' | 'tactile' | 'auditory' | 'olfactory';

export type OpeningType =
  | 'in_medias_res'
  | 'scene_setting'
  | 'cold_dialogue'
  | 'internal_monologue';

export type EmotionalArcType =
  | 'hope_to_despair'
  | 'despair_to_resolve'
  | 'defiance_to_surrender'
  | 'desire_to_denial'
  | 'chaos_to_false_calm'
  | 'revelation_to_confusion'
  | 'tension_to_release'
  | 'yearning_to_touch'
  | 'trust_to_betrayal';

export type CliffhangerType =
  | 'revelation'
  | 'interruption'
  | 'physical_peril'
  | 'emotional_severance'
  | 'temptation_offered'
  | 'identity_destabilized'
  | 'time_bomb'
  | 'mirror_reveal'
  | 'none';

export type BeatStructureCode = string; // e.g. 'forbidden_threshold' — from beatStructures.json

export type PacingRhythm = 'slow_burn' | 'propulsive' | 'variable';

export type HookDensity = 'low' | 'medium' | 'high';

export type ToneAllowance = 'locked' | 'drifting';

export type GenreBlendPrimary = 'romance' | 'horror' | 'mystery' | 'thriller' | 'fantasy';

export type VocabRegister = 'archaic' | 'formal' | 'neutral' | 'colloquial' | 'vulgar';

export type ChapterStatus = 'published' | 'draft' | 'archived';

export type SubscriptionTier = 'free' | 'pro';

export type ThreadType = 'chekhov' | 'callback' | 'dramatic_irony';

export type ThreadStatus = 'open' | 'resolved' | 'abandoned';

export type WorldNoteCategory =
  | 'lore'
  | 'setting'
  | 'rule'
  | 'foreshadowing'
  | 'character_detail';

export type PowerHolder = 'a' | 'b' | 'equal';

export type RelationshipTensionType =
  | 'romantic'
  | 'adversarial'
  | 'mentor'
  | 'rival'
  | 'ambiguous';

export type TitleStyle = 'literary' | 'commercial' | 'teaser';

export type SceneCount = 1 | 2 | 3;
