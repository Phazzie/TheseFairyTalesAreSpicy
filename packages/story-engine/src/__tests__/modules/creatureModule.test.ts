import { describe, it, expect } from 'vitest';
import { creatureModule } from '../../modules/creatureModule.js';
import type { ArcContext, GenerationInput } from '../../types/index.js';

// ============================================================
// HELPERS
// ============================================================

function makeMockContext(creatureType: string): ArcContext {
  return {
    arc: {
      id: 'arc-test',
      userId: 'user-test',
      title: 'Test Arc',
      creatureType: creatureType as ArcContext['arc']['creatureType'],
      arcType: 'single_couple',
      themes: ['forbidden love'],
      defaultSpiceLevel: 2,
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
      arcId: 'arc-test',
      creatureType: creatureType as ArcContext['arc']['creatureType'],
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

const mockInput: GenerationInput = {
  arcId: 'arc-test',
  chapterNumber: 1,
};

// ============================================================
// TESTS
// ============================================================

describe('creatureModule', () => {
  it('returns a non-empty string for "vampire"', () => {
    const result = creatureModule(mockInput, makeMockContext('vampire'));
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns a non-empty string for "werewolf"', () => {
    const result = creatureModule(mockInput, makeMockContext('werewolf'));
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns a non-empty string for "fairy"', () => {
    const result = creatureModule(mockInput, makeMockContext('fairy'));
    expect(result.length).toBeGreaterThan(0);
  });

  it('output for "vampire" contains description of creature nature', () => {
    const result = creatureModule(mockInput, makeMockContext('vampire'));
    // The vampire description references "apex predator" or "centuries"
    const lower = result.toLowerCase();
    expect(lower).toMatch(/apex predator|centuries|hunger|authority/);
  });

  it('output for "werewolf" contains description of creature duality', () => {
    const result = creatureModule(mockInput, makeMockContext('werewolf'));
    const lower = result.toLowerCase();
    expect(lower).toMatch(/duality|human|animal|shift|dominance/);
  });

  it('output for "fairy" contains description of creature nature', () => {
    const result = creatureModule(mockInput, makeMockContext('fairy'));
    const lower = result.toLowerCase();
    expect(lower).toMatch(/ancient|contract|oath|capricious|beautiful/);
  });

  it('output includes the CREATURE TYPE header', () => {
    const result = creatureModule(mockInput, makeMockContext('vampire'));
    expect(result).toContain('CREATURE TYPE:');
  });

  it('returns a string (not throw) for an unknown creature type', () => {
    // Unknown types get a fallback: "CREATURE TYPE:\n{creatureType}"
    const unknownContext = makeMockContext('dragon' as any);
    let result: string | undefined;
    expect(() => {
      result = creatureModule(mockInput, unknownContext);
    }).not.toThrow();
    expect(typeof result).toBe('string');
    // Fallback should at least mention the creature type
    expect(result).toContain('dragon');
  });

  it('never returns undefined or null', () => {
    for (const ct of ['vampire', 'werewolf', 'fairy'] as const) {
      const result = creatureModule(mockInput, makeMockContext(ct));
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    }
  });
});
