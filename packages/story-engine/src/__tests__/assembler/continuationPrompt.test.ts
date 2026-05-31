import { describe, it, expect } from 'vitest';
import { assembleContinuationPrompt } from '../../assembler/continuationPrompt.js';
import type { ArcContext, ContinuationInput } from '../../types/index.js';

// ============================================================
// SHARED MOCK DATA (mirrors systemPrompt.test.ts)
// ============================================================

const mockContext: ArcContext = {
  arc: {
    id: 'arc-1',
    userId: 'user-1',
    title: 'Test Arc',
    creatureType: 'vampire',
    arcType: 'single_couple',
    themes: ['forbidden love', 'dark redemption'],
    defaultSpiceLevel: 2,
    povMode: 'third_limited',
    tense: 'past',
    narrativeDistance: 'close',
    readingLevel: 'elevated',
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
  characters: [
    {
      id: 'char-1',
      arcId: 'arc-1',
      slug: 'ELENA',
      displayName: 'Elena',
      species: 'human',
      apparentAge: 25,
      trueAge: 25,
      isProtagonist: true,
      accent: { id: 'american_midwest', region: 'American Midwest' },
      emotionStates: [],
      vocabRegister: 'neutral',
      speech: { vocabRegister: 'neutral', avgSentenceLength: 'medium' },
      bio: 'A librarian with a secret.',
      appearance: 'Tall, auburn hair.',
      createdAt: new Date().toISOString(),
    },
  ],
  relationships: [],
  creatureLore: {
    arcId: 'arc-1',
    creatureType: 'vampire',
    rules: ['Cannot enter uninvited', 'Weakened by sunlight'],
    weaknesses: ['Silver', 'Running water'],
    abilities: ['Mind control', 'Super speed'],
    societyNotes: 'Ancient covens govern feeding territories.',
    customFields: {},
  },
  worldNotes: [],
  plotThreads: [],
};

const baseContinuationInput: ContinuationInput = {
  arcId: 'arc-1',
  chapterNumber: 2,
  priorChapterId: 'chapter-1',
  priorChapterEngineVersion: '1.0.0',
  priorSystemPrompt: 'This is the prior chapter system prompt.',
};

// ============================================================
// TESTS
// ============================================================

describe('assembleContinuationPrompt', () => {
  it('without priorSystemPrompt: output does NOT contain "PRIOR CHAPTER CONTEXT"', () => {
    const inputNoPrior: ContinuationInput = {
      ...baseContinuationInput,
      priorSystemPrompt: '',
    };
    const result = assembleContinuationPrompt(inputNoPrior, mockContext);
    expect(result.prompt).not.toContain('PRIOR CHAPTER CONTEXT');
  });

  it('with priorSystemPrompt: output DOES contain "PRIOR CHAPTER CONTEXT"', () => {
    const result = assembleContinuationPrompt(baseContinuationInput, mockContext);
    expect(result.prompt).toContain('PRIOR CHAPTER CONTEXT');
  });

  it('with priorSystemPrompt: priorChapterEngineVersion appears in the block', () => {
    const inputWithVersion: ContinuationInput = {
      ...baseContinuationInput,
      priorChapterEngineVersion: '2.3.1',
      priorSystemPrompt: 'Some prior prompt text.',
    };
    const result = assembleContinuationPrompt(inputWithVersion, mockContext);
    expect(result.prompt).toContain('2.3.1');
  });

  it('priorSystemPrompt longer than 2000 chars is truncated to 2000 chars', () => {
    const longPrompt = 'X'.repeat(3000);
    const inputLong: ContinuationInput = {
      ...baseContinuationInput,
      priorSystemPrompt: longPrompt,
    };
    const result = assembleContinuationPrompt(inputLong, mockContext);
    // The appended block should contain only the first 2000 chars, not the full 3000
    expect(result.prompt).toContain('X'.repeat(2000));
    expect(result.prompt).not.toContain('X'.repeat(2001));
  });

  it('priorSystemPrompt exactly 2000 chars is NOT truncated', () => {
    const exactPrompt = 'Y'.repeat(2000);
    const inputExact: ContinuationInput = {
      ...baseContinuationInput,
      priorSystemPrompt: exactPrompt,
    };
    const result = assembleContinuationPrompt(inputExact, mockContext);
    expect(result.prompt).toContain('Y'.repeat(2000));
  });

  it('return value contains beatUsed as a non-empty string', () => {
    const result = assembleContinuationPrompt(baseContinuationInput, mockContext);
    expect(typeof result.beatUsed).toBe('string');
    expect(result.beatUsed.length).toBeGreaterThan(0);
  });

  it('return value contains engineVersion matching semver pattern', () => {
    const result = assembleContinuationPrompt(baseContinuationInput, mockContext);
    expect(result.engineVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('does not throw for a minimal Quick Start arc context', () => {
    const quickStartContext: ArcContext = {
      ...mockContext,
      arc: { ...mockContext.arc, isQuickStart: true },
      characters: [],
      relationships: [],
      worldNotes: [],
      plotThreads: [],
      creatureLore: {
        arcId: 'arc-1',
        creatureType: 'vampire',
        rules: [],
        weaknesses: [],
        abilities: [],
        societyNotes: '',
        customFields: {},
      },
    };
    expect(() =>
      assembleContinuationPrompt(baseContinuationInput, quickStartContext)
    ).not.toThrow();
  });
});
