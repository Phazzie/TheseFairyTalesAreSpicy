import { z } from 'zod';

export const EMOTIONAL_ARC_VALUES = [
  'hope_to_despair', 'despair_to_resolve', 'defiance_to_surrender',
  'desire_to_denial', 'chaos_to_false_calm', 'revelation_to_confusion',
  'tension_to_release', 'yearning_to_touch', 'trust_to_betrayal',
] as const;

export const CLIFFHANGER_TYPE_VALUES = [
  'revelation', 'interruption', 'physical_peril', 'emotional_severance',
  'temptation_offered', 'identity_destabilized', 'time_bomb', 'mirror_reveal', 'none',
] as const;

export const generateSchema = z.object({
  arcId: z.string().uuid(),
  chapterNumber: z.number().int().positive(),
  spiceLevelOverride: z.number().min(1).max(5).optional(),
  emotionalArcOverride: z.enum(EMOTIONAL_ARC_VALUES).optional(),
  cliffhangerTypeOverride: z.enum(CLIFFHANGER_TYPE_VALUES).optional(),
  wordCountOverride: z.number().min(200).max(5000).optional(),
  userCreativeDirection: z.string().max(200).optional(),
  pilotMode: z.boolean().optional(),
}).strict();

const characterSchema = z.object({
  displayName: z.string(),
  species: z.enum(['human', 'vampire', 'werewolf', 'fairy']).default('human'),
  statedDesire: z.string().optional(),
  hiddenNeed: z.string().optional(),
  wound: z.string().optional(),
  flaw: z.string().optional(),
  lie: z.string().optional(),
}).strict();

const creatureLoreSchema = z.object({
  rules: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
  abilities: z.array(z.string()).optional(),
  societyNotes: z.string().optional(),
}).strict();

const arcBaseSchema = z.object({
  title: z.string().max(200).optional(),
  creatureType: z.enum(['vampire', 'werewolf', 'fairy']),
  arcType: z.string(),
  themes: z.array(z.string()).min(1).max(10),
  defaultSpiceLevel: z.number().int().min(1).max(5),
  povMode: z.enum(['first_person', 'third_limited', 'third_omniscient', 'rotating']),
  tense: z.enum(['past', 'present']),
  narrativeDistance: z.string(),
  readingLevel: z.string(),
  dialogueRatioPct: z.number().min(0).max(100),
  hookDensity: z.string(),
  pacingRhythm: z.string(),
  sceneCountDefault: z.number().int().min(1).max(10),
  atmosphereArchetype: z.string(),
  defaultSensePrimary: z.string(),
  defaultSenseSecondary: z.string(),
  recurringMotif: z.string().max(200).optional(),
  genreBlendPrimary: z.string(),
  genreBlendSecondary: z.string().optional(),
  genreBlendRatio: z.number().int().min(50).max(100).optional().default(80),
  toneAllowance: z.string(),
  isQuickStart: z.boolean().optional(),
  coverImageUrl: z.string().url().startsWith('https://').optional(),
});

export const createArcSchema = arcBaseSchema.extend({
  protagonist: characterSchema.optional(),
  loveInterest: characterSchema.optional(),
  creatureLore: creatureLoreSchema.optional(),
}).strict();

export const updateArcSchema = arcBaseSchema.partial().strict();
