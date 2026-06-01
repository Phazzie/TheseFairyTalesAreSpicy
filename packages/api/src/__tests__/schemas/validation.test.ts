import { describe, it, expect } from 'vitest';
import { generateSchema, createArcSchema } from '../../schemas.js';

// ============================================================
// generateSchema
// ============================================================

describe('generateSchema validation', () => {
  const validBase = {
    arcId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    chapterNumber: 1,
  };

  it('accepts a minimal valid payload', () => {
    expect(() => generateSchema.parse(validBase)).not.toThrow();
  });

  it('rejects a missing arcId', () => {
    const result = generateSchema.safeParse({ chapterNumber: 1 });
    expect(result.success).toBe(false);
  });

  it('rejects a non-UUID arcId', () => {
    const result = generateSchema.safeParse({ ...validBase, arcId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects chapterNumber = 0 (must be positive)', () => {
    const result = generateSchema.safeParse({ ...validBase, chapterNumber: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects chapterNumber as a negative integer', () => {
    const result = generateSchema.safeParse({ ...validBase, chapterNumber: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects spiceLevelOverride = 6 (max is 5)', () => {
    const result = generateSchema.safeParse({ ...validBase, spiceLevelOverride: 6 });
    expect(result.success).toBe(false);
  });

  it('accepts spiceLevelOverride = 5', () => {
    const result = generateSchema.safeParse({ ...validBase, spiceLevelOverride: 5 });
    expect(result.success).toBe(true);
  });

  it('rejects spiceLevelOverride = 0 (min is 1)', () => {
    const result = generateSchema.safeParse({ ...validBase, spiceLevelOverride: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects unknown extra keys (strict mode)', () => {
    const result = generateSchema.safeParse({ ...validBase, unknownKey: 'surprise' });
    expect(result.success).toBe(false);
  });

  it('accepts a fully-populated valid payload', () => {
    const result = generateSchema.safeParse({
      ...validBase,
      spiceLevelOverride: 3,
      emotionalArcOverride: 'desire_to_denial',
      cliffhangerTypeOverride: 'revelation',
      wordCountOverride: 1000,
      userCreativeDirection: 'Make it spookier',
      pilotMode: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid emotionalArcOverride value', () => {
    const result = generateSchema.safeParse({ ...validBase, emotionalArcOverride: 'sadness_to_joy' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid cliffhangerTypeOverride value', () => {
    const result = generateSchema.safeParse({ ...validBase, cliffhangerTypeOverride: 'big_explosion' });
    expect(result.success).toBe(false);
  });

  it('rejects wordCountOverride below 200', () => {
    const result = generateSchema.safeParse({ ...validBase, wordCountOverride: 50 });
    expect(result.success).toBe(false);
  });

  it('rejects wordCountOverride above 5000', () => {
    const result = generateSchema.safeParse({ ...validBase, wordCountOverride: 9999 });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// createArcSchema
// ============================================================

describe('createArcSchema validation', () => {
  const validBase = {
    creatureType: 'vampire' as const,
    arcType: 'single_couple',
    themes: ['forbidden love'],
    defaultSpiceLevel: 3,
    povMode: 'first_person' as const,
    tense: 'past' as const,
    narrativeDistance: 'close',
    readingLevel: 'commercial',
    dialogueRatioPct: 40,
    hookDensity: 'medium',
    pacingRhythm: 'slow_burn',
    sceneCountDefault: 1,
    atmosphereArchetype: 'gothic_estate',
    defaultSensePrimary: 'visual',
    defaultSenseSecondary: 'tactile',
    genreBlendPrimary: 'romance',
    toneAllowance: 'locked',
  };

  it('accepts a minimal valid payload', () => {
    expect(() => createArcSchema.parse(validBase)).not.toThrow();
  });

  it('rejects genreBlendRatio < 50', () => {
    const result = createArcSchema.safeParse({ ...validBase, genreBlendRatio: 49 });
    expect(result.success).toBe(false);
  });

  it('rejects genreBlendRatio > 100', () => {
    const result = createArcSchema.safeParse({ ...validBase, genreBlendRatio: 101 });
    expect(result.success).toBe(false);
  });

  it('accepts genreBlendRatio at the boundary values (50 and 100)', () => {
    expect(createArcSchema.safeParse({ ...validBase, genreBlendRatio: 50 }).success).toBe(true);
    expect(createArcSchema.safeParse({ ...validBase, genreBlendRatio: 100 }).success).toBe(true);
  });

  it('rejects an invalid creatureType', () => {
    const result = createArcSchema.safeParse({ ...validBase, creatureType: 'dragon' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid creatureType values', () => {
    for (const ct of ['vampire', 'werewolf', 'fairy'] as const) {
      expect(createArcSchema.safeParse({ ...validBase, creatureType: ct }).success).toBe(true);
    }
  });

  it('rejects themes array with 0 items', () => {
    const result = createArcSchema.safeParse({ ...validBase, themes: [] });
    expect(result.success).toBe(false);
  });

  it('rejects themes array with more than 10 items', () => {
    const result = createArcSchema.safeParse({
      ...validBase,
      themes: Array.from({ length: 11 }, (_, i) => `theme${i}`),
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown extra keys (strict mode)', () => {
    const result = createArcSchema.safeParse({ ...validBase, secretField: 'oops' });
    expect(result.success).toBe(false);
  });

  it('rejects defaultSpiceLevel outside 1-5', () => {
    expect(createArcSchema.safeParse({ ...validBase, defaultSpiceLevel: 0 }).success).toBe(false);
    expect(createArcSchema.safeParse({ ...validBase, defaultSpiceLevel: 6 }).success).toBe(false);
  });

  it('accepts optional protagonist and loveInterest', () => {
    const result = createArcSchema.safeParse({
      ...validBase,
      protagonist: { displayName: 'Elena' },
      loveInterest: { displayName: 'Damon', species: 'vampire' },
    });
    expect(result.success).toBe(true);
  });
});
