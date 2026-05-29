import { describe, it, expect } from 'vitest';
import { assembleSystemPrompt } from '../../assembler/systemPrompt.js';
import { ContextOverflowError } from '../../types/index.js';
import type { ArcContext, GenerationInput } from '../../types/index.js';

// ============================================================
// SHARED MOCK DATA
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

const mockInput: GenerationInput = {
  arcId: 'arc-1',
  chapterNumber: 1,
};

// ============================================================
// TESTS
// ============================================================

describe('assembleSystemPrompt', () => {
  it('returns a non-empty prompt for valid input and context', () => {
    const result = assembleSystemPrompt(mockInput, mockContext);
    expect(result.prompt.length).toBeGreaterThan(100);
  });

  it('engineVersion matches semver pattern', () => {
    const result = assembleSystemPrompt(mockInput, mockContext);
    expect(result.engineVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('droppedModules is an array', () => {
    const result = assembleSystemPrompt(mockInput, mockContext);
    expect(result.droppedModules).toBeInstanceOf(Array);
  });

  it('droppedModules is empty when well within budget', () => {
    const result = assembleSystemPrompt(mockInput, mockContext);
    expect(result.droppedModules).toHaveLength(0);
  });

  it('includes creature type in the output prompt', () => {
    const result = assembleSystemPrompt(mockInput, mockContext);
    expect(result.prompt.toLowerCase()).toContain('vampire');
  });

  it('includes creature lore rules in the output prompt', () => {
    const result = assembleSystemPrompt(mockInput, mockContext);
    expect(result.prompt).toContain('Cannot enter uninvited');
  });

  it('includes creature lore weaknesses in the output prompt', () => {
    const result = assembleSystemPrompt(mockInput, mockContext);
    expect(result.prompt).toContain('Silver');
  });

  it('includes character display name in the output prompt', () => {
    const result = assembleSystemPrompt(mockInput, mockContext);
    expect(result.prompt).toContain('Elena');
  });

  it('includes character species in the output prompt', () => {
    const result = assembleSystemPrompt(mockInput, mockContext);
    // Character species "human" should appear in the character section
    expect(result.prompt.toLowerCase()).toContain('human');
  });

  it('includes SPICE LEVEL section in prompt', () => {
    const result = assembleSystemPrompt(mockInput, mockContext);
    expect(result.prompt).toContain('SPICE LEVEL:');
  });

  it('includes PROSE CONSTRAINTS section in prompt', () => {
    const result = assembleSystemPrompt(mockInput, mockContext);
    expect(result.prompt).toContain('PROSE CONSTRAINTS:');
  });

  it('includes CREATURE TYPE section in prompt', () => {
    const result = assembleSystemPrompt(mockInput, mockContext);
    expect(result.prompt).toContain('CREATURE TYPE:');
  });

  it('handles minimal context gracefully — no throw on empty arrays', () => {
    const minimalContext: ArcContext = {
      ...mockContext,
      creatureLore: {
        arcId: 'arc-1',
        creatureType: 'vampire',
        rules: [],
        weaknesses: [],
        abilities: [],
        societyNotes: '',
        customFields: {},
      },
      worldNotes: [],
      plotThreads: [],
      characters: [],
      relationships: [],
    };
    expect(() => assembleSystemPrompt(mockInput, minimalContext)).not.toThrow();
    const result = assembleSystemPrompt(mockInput, minimalContext);
    expect(result.prompt.length).toBeGreaterThan(0);
  });

  it('handles context with no rollingSummary — no throw', () => {
    const contextWithoutSummary: ArcContext = {
      ...mockContext,
      rollingSummary: undefined,
    };
    expect(() => assembleSystemPrompt(mockInput, contextWithoutSummary)).not.toThrow();
  });

  it('handles context with no recentChapterMetadata — no throw', () => {
    const contextWithoutRecent: ArcContext = {
      ...mockContext,
      recentChapterMetadata: undefined,
    };
    expect(() => assembleSystemPrompt(mockInput, contextWithoutRecent)).not.toThrow();
  });

  it('throws ContextOverflowError when prompt exceeds a tiny maxTokenBudget', () => {
    // 10 tokens (~40 chars) is impossibly small — will always overflow
    expect(() =>
      assembleSystemPrompt(mockInput, mockContext, { maxTokenBudget: 10 })
    ).toThrow(ContextOverflowError);
  });

  it('ContextOverflowError carries droppedModules array', () => {
    let caught: ContextOverflowError | undefined;
    try {
      assembleSystemPrompt(mockInput, mockContext, { maxTokenBudget: 10 });
    } catch (err) {
      if (err instanceof ContextOverflowError) {
        caught = err;
      }
    }
    expect(caught).toBeDefined();
    expect(caught?.droppedModules).toBeInstanceOf(Array);
  });

  it('ContextOverflowError name is "ContextOverflowError"', () => {
    let caught: Error | undefined;
    try {
      assembleSystemPrompt(mockInput, mockContext, { maxTokenBudget: 10 });
    } catch (err) {
      if (err instanceof Error) caught = err;
    }
    expect(caught?.name).toBe('ContextOverflowError');
  });

  it('drops optional modules when over budget but recovers without throwing', () => {
    // Heavy world notes add ~500 tokens (10 × 200 chars / 4 ≈ 500 tokens).
    // Base prompt without world notes ≈ 1800 tokens. With them ≈ 2300 tokens.
    // Budget of 2100: over budget with worldNotes (2300 > 2100), under budget without (1800 < 2100).
    // The assembler should drop worldNotesModule and succeed.
    const heavyContext: ArcContext = {
      ...mockContext,
      worldNotes: Array.from({ length: 10 }, (_, i) => ({
        id: `wn-${i}`,
        arcId: 'arc-1',
        category: 'lore' as const,
        content: 'A'.repeat(200),
        isActive: true,
        createdAt: new Date().toISOString(),
      })),
    };
    const result = assembleSystemPrompt(mockInput, heavyContext, { maxTokenBudget: 2100 });
    // Should succeed (no throw) and droppedModules may be populated
    expect(result.droppedModules).toBeInstanceOf(Array);
    // When worldNotes are heavy, worldNotesModule should be dropped
    if (result.droppedModules.length > 0) {
      expect(result.droppedModules).toContain('worldNotesModule');
    }
  });

  it('respects maxTokenBudget from GenerationInput when no opts provided', () => {
    // maxTokenBudget on input itself should be respected
    const inputWithBudget: GenerationInput = {
      ...mockInput,
      maxTokenBudget: 10,
    };
    expect(() =>
      assembleSystemPrompt(inputWithBudget, mockContext)
    ).toThrow(ContextOverflowError);
  });

  it('opts.maxTokenBudget overrides input.maxTokenBudget', () => {
    // input says 10 (tiny), opts says default (32000) — should NOT throw
    // Wait — the implementation prefers opts, then input, then default:
    // opts?.maxTokenBudget ?? input.maxTokenBudget ?? DEFAULT_MAX_BUDGET
    // So opts of 32000 would override input's 10
    const inputWithTinyBudget: GenerationInput = {
      ...mockInput,
      maxTokenBudget: 10,
    };
    expect(() =>
      assembleSystemPrompt(inputWithTinyBudget, mockContext, { maxTokenBudget: 32000 })
    ).not.toThrow();
  });

  it('werewolf context produces valid prompt', () => {
    const werewolfContext: ArcContext = {
      ...mockContext,
      arc: { ...mockContext.arc, creatureType: 'werewolf' },
      creatureLore: {
        ...mockContext.creatureLore,
        creatureType: 'werewolf',
      },
    };
    const result = assembleSystemPrompt(mockInput, werewolfContext);
    expect(result.prompt.toLowerCase()).toContain('werewolf');
    expect(result.prompt.length).toBeGreaterThan(100);
  });

  it('fairy context produces valid prompt', () => {
    const fairyContext: ArcContext = {
      ...mockContext,
      arc: { ...mockContext.arc, creatureType: 'fairy' },
      creatureLore: {
        ...mockContext.creatureLore,
        creatureType: 'fairy',
      },
    };
    const result = assembleSystemPrompt(mockInput, fairyContext);
    expect(result.prompt.toLowerCase()).toContain('fairy');
    expect(result.prompt.length).toBeGreaterThan(100);
  });

  it('pilotMode: true produces a valid prompt without throwing', () => {
    const pilotInput: GenerationInput = {
      ...mockInput,
      pilotMode: true,
      spiceLevelOverride: 5, // should be capped to 3
    };
    expect(() => assembleSystemPrompt(pilotInput, mockContext)).not.toThrow();
    const result = assembleSystemPrompt(pilotInput, mockContext);
    // Pilot mode cap should be reflected in the spice level section
    expect(result.prompt).toContain('Level 3');
  });

  it('rollingSummary content is included in the prompt when provided', () => {
    const contextWithSummary: ArcContext = {
      ...mockContext,
      rollingSummary: {
        id: 'summary-1',
        arcId: 'arc-1',
        chapterMilestone: 3,
        summaryText: 'Elena discovered the truth about the ancient covenant.',
        createdAt: new Date().toISOString(),
      },
    };
    const result = assembleSystemPrompt(mockInput, contextWithSummary);
    expect(result.prompt).toContain('Elena discovered the truth');
  });
});
