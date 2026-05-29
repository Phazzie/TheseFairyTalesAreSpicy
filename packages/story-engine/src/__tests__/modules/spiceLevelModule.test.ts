import { describe, it, expect } from 'vitest';
import { spiceLevelModule } from '../../modules/spiceLevelModule.js';
import type { ArcContext, GenerationInput, SpiceLevel } from '../../types/index.js';

// ============================================================
// HELPERS
// ============================================================

function makeMockContext(defaultSpiceLevel: SpiceLevel = 2): ArcContext {
  return {
    arc: {
      id: 'arc-spice',
      userId: 'user-1',
      title: 'Spice Test Arc',
      creatureType: 'vampire',
      arcType: 'single_couple',
      themes: ['dark desire'],
      defaultSpiceLevel,
      povMode: 'third_limited',
      tense: 'past',
      narrativeDistance: 'close',
      readingLevel: 'commercial',
      dialogueRatioPct: 40,
      hookDensity: 'medium',
      pacingRhythm: 'propulsive',
      sceneCountDefault: 1,
      atmosphereArchetype: 'gothic_estate',
      defaultSensoryPrimary: 'visual',
      defaultSensorySecondary: 'tactile',
      genreBlendPrimary: 'romance',
      genreBlendRatio: 80,
      toneAllowance: 'locked',
      isQuickStart: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    characters: [],
    relationships: [],
    creatureLore: {
      arcId: 'arc-spice',
      creatureType: 'vampire',
      rules: [],
      weaknesses: [],
      abilities: [],
      societyNotes: '',
      customFields: {},
    },
    worldNotes: [],
    plotThreads: [],
  };
}

function makeInput(overrides: Partial<GenerationInput> = {}): GenerationInput {
  return {
    arcId: 'arc-spice',
    chapterNumber: 1,
    ...overrides,
  };
}

// ============================================================
// TESTS
// ============================================================

describe('spiceLevelModule', () => {
  it('returns a non-empty string for spice level 1', () => {
    const result = spiceLevelModule(makeInput(), makeMockContext(1));
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns a non-empty string for spice level 2', () => {
    const result = spiceLevelModule(makeInput(), makeMockContext(2));
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns a non-empty string for spice level 3', () => {
    const result = spiceLevelModule(makeInput(), makeMockContext(3));
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns a non-empty string for spice level 4', () => {
    const result = spiceLevelModule(makeInput(), makeMockContext(4));
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns a non-empty string for spice level 5', () => {
    const result = spiceLevelModule(makeInput(), makeMockContext(5));
    expect(result.length).toBeGreaterThan(0);
  });

  it('output includes SPICE LEVEL header', () => {
    const result = spiceLevelModule(makeInput(), makeMockContext(2));
    expect(result).toContain('SPICE LEVEL:');
  });

  it('output includes label/description for the selected level', () => {
    // Level 1 is labeled "Slow Burn" in spiceLevels.json
    const result = spiceLevelModule(makeInput(), makeMockContext(1));
    expect(result.toLowerCase()).toContain('slow burn');
  });

  it('output includes Allowed Acts section', () => {
    const result = spiceLevelModule(makeInput(), makeMockContext(2));
    expect(result).toContain('Allowed Acts:');
  });

  it('output includes Forbidden Language section', () => {
    const result = spiceLevelModule(makeInput(), makeMockContext(2));
    expect(result).toContain('Forbidden Language:');
  });

  it('pilotMode: true caps spice level 5 request to level 3', () => {
    const input = makeInput({ spiceLevelOverride: 5, pilotMode: true });
    const result = spiceLevelModule(input, makeMockContext(2));
    // Output should mention "Level 3" and include pilot mode cap notice
    expect(result).toContain('Level 3');
    expect(result).toContain('Pilot mode active');
  });

  it('pilotMode: true caps spice level 4 request to level 3', () => {
    const input = makeInput({ spiceLevelOverride: 4, pilotMode: true });
    const result = spiceLevelModule(input, makeMockContext(2));
    expect(result).toContain('Level 3');
    expect(result).toContain('Pilot mode active');
  });

  it('pilotMode: true does NOT cap level 2 (below cap)', () => {
    const input = makeInput({ spiceLevelOverride: 2, pilotMode: true });
    const result = spiceLevelModule(input, makeMockContext(2));
    expect(result).toContain('Level 2');
    // Pilot cap notice should NOT appear when level is already at or below cap
    expect(result).not.toContain('Pilot mode active');
  });

  it('spiceLevelOverride takes precedence over context default', () => {
    // Context says level 1, but override says 4
    const input = makeInput({ spiceLevelOverride: 4 });
    const result = spiceLevelModule(input, makeMockContext(1));
    expect(result).toContain('Level 4');
  });

  it('uses context defaultSpiceLevel when no override provided', () => {
    const input = makeInput(); // no spiceLevelOverride
    const result = spiceLevelModule(input, makeMockContext(3));
    expect(result).toContain('Level 3');
  });

  it('does not throw for any valid spice level', () => {
    for (const level of [1, 2, 3, 4, 5] as SpiceLevel[]) {
      expect(() => spiceLevelModule(makeInput(), makeMockContext(level))).not.toThrow();
    }
  });
});
