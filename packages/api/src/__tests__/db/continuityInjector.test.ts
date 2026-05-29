import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ArcSettings, ArcSummary, CharacterProfile, PlotThread } from '@story/engine';

// ============================================================
// MOCKS — must be at top level before any imports of the module under test
// ============================================================

vi.mock('../../db/arcs.js', () => ({
  getArc: vi.fn(),
}));

vi.mock('../../db/characters.js', () => ({
  getCharacters: vi.fn(),
}));

vi.mock('../../db/chapters.js', () => ({
  getRecentChapterMetadata: vi.fn(), // replaces getChaptersByArc in continuityInjector
  chapterRowToMetadata: vi.fn(),
}));

vi.mock('../../db/plotThreads.js', () => ({
  getOpenThreads: vi.fn(),
}));

vi.mock('../../db/arcSummaries.js', () => ({
  getLatestSummary: vi.fn(),
}));

// Mock the Supabase adminClient for the inline fetchRelationships / fetchCreatureLore / fetchActiveWorldNotes
// These are called directly inside continuityInjector.ts using adminClient.from(...)
// We need a chainable mock builder.
const buildSupabaseChain = (resolvedValue: { data: unknown; error: null | { message: string } }) => {
  const chain = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(resolvedValue),
    // For cases that don't end in maybeSingle — resolve directly
    then: undefined as unknown,
  };
  // Make the chain itself thenable for .from().select().eq() without terminal call
  // We override maybeSingle per test to return appropriate values
  return chain;
};

// vi.hoisted() runs before vi.mock hoisting — makes the variable available in the factory
const mockSupabaseFrom = vi.hoisted(() => vi.fn());

vi.mock('../../db/supabase.js', () => ({
  adminClient: {
    from: mockSupabaseFrom,
  },
}));

// ============================================================
// IMPORT AFTER MOCKS
// ============================================================

import { assembleArcContext } from '../../db/continuityInjector.js';
import { getArc } from '../../db/arcs.js';
import { getCharacters } from '../../db/characters.js';
import { getRecentChapterMetadata, chapterRowToMetadata } from '../../db/chapters.js';
import { getOpenThreads } from '../../db/plotThreads.js';
import { getLatestSummary } from '../../db/arcSummaries.js';

// ============================================================
// SHARED FIXTURES
// ============================================================

const mockArc: ArcSettings = {
  id: 'arc-1',
  userId: 'user-1',
  title: 'Test Arc',
  creatureType: 'vampire',
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
};

const mockCharacter: CharacterProfile = {
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
};

// A chainable Supabase mock builder for adminClient.from(table) calls
// continuityInjector calls:
//   adminClient.from('relationship_map').select('*').eq(...) → returns {data, error}
//   adminClient.from('creature_lore').select('*').eq(...).maybeSingle() → returns {data, error}
//   adminClient.from('world_notes').select('*').eq(...).eq(...).order(...) → returns {data, error}
function makeChainableQuery(result: { data: unknown; error: null }) {
  const q: Record<string, unknown> = {};
  const returnSelf = () => q;
  q['select'] = vi.fn(returnSelf);
  q['eq'] = vi.fn(returnSelf);
  q['order'] = vi.fn(returnSelf);
  q['maybeSingle'] = vi.fn(() => Promise.resolve(result));
  // Make it a Promise for cases without terminal .maybeSingle() (relationship_map, world_notes)
  // by making it thenable — those paths await the chain directly
  q['then'] = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve);
  q['catch'] = (reject: (e: unknown) => unknown) => Promise.resolve(result).catch(reject);
  return q;
}

// ============================================================
// TESTS
// ============================================================

describe('assembleArcContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: adminClient.from() returns a chain that resolves to empty data
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'creature_lore') {
        return makeChainableQuery({ data: null, error: null });
      }
      // relationship_map and world_notes return empty arrays
      return makeChainableQuery({ data: [], error: null });
    });
  });

  it('assembles a complete ArcContext from mocked DB responses', async () => {
    vi.mocked(getArc).mockResolvedValue(mockArc);
    vi.mocked(getCharacters).mockResolvedValue([mockCharacter]);
    vi.mocked(getOpenThreads).mockResolvedValue([]);
    vi.mocked(getLatestSummary).mockResolvedValue(null);
    vi.mocked(getRecentChapterMetadata).mockResolvedValue([]);
    vi.mocked(chapterRowToMetadata).mockReturnValue({} as any);

    const result = await assembleArcContext('arc-1', 'user-1');

    expect(result.arc.id).toBe('arc-1');
    expect(result.arc.userId).toBe('user-1');
    expect(result.characters).toBeInstanceOf(Array);
    expect(result.characters).toHaveLength(1);
    expect(result.characters[0]!.displayName).toBe('Elena');
    expect(result.relationships).toBeInstanceOf(Array);
    expect(result.worldNotes).toBeInstanceOf(Array);
    expect(result.plotThreads).toBeInstanceOf(Array);
    expect(result.creatureLore).toBeDefined();
    expect(result.creatureLore.creatureType).toBe('vampire');
  });

  it('throws if arc is not found', async () => {
    vi.mocked(getArc).mockRejectedValue(new Error('Arc not found'));

    await expect(assembleArcContext('bad-id', 'user-1')).rejects.toThrow('Arc not found');
  });

  it('throws if arc belongs to different user', async () => {
    vi.mocked(getArc).mockRejectedValue(
      new Error('Arc arc-1 not found or does not belong to user wrong-user'),
    );

    await expect(assembleArcContext('arc-1', 'wrong-user')).rejects.toThrow(
      /not found|does not belong/,
    );
  });

  it('provides fallback creature lore when none is stored in DB', async () => {
    vi.mocked(getArc).mockResolvedValue(mockArc);
    vi.mocked(getCharacters).mockResolvedValue([]);
    vi.mocked(getOpenThreads).mockResolvedValue([]);
    vi.mocked(getLatestSummary).mockResolvedValue(null);
    vi.mocked(getRecentChapterMetadata).mockResolvedValue([]);

    // creature_lore query returns null (no lore stored)
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'creature_lore') {
        return makeChainableQuery({ data: null, error: null });
      }
      return makeChainableQuery({ data: [], error: null });
    });

    const result = await assembleArcContext('arc-1', 'user-1');

    // Should use fallback lore derived from arc.creatureType
    expect(result.creatureLore.creatureType).toBe('vampire');
    expect(result.creatureLore.rules).toEqual([]);
    expect(result.creatureLore.weaknesses).toEqual([]);
    expect(result.creatureLore.abilities).toEqual([]);
    expect(result.creatureLore.societyNotes).toBe('');
  });

  it('includes rollingSummary when one exists', async () => {
    const mockSummary: ArcSummary = {
      id: 'summary-1',
      arcId: 'arc-1',
      chapterMilestone: 5,
      summaryText: 'Elena discovered the vampire\'s true name.',
      createdAt: new Date().toISOString(),
    };

    vi.mocked(getArc).mockResolvedValue(mockArc);
    vi.mocked(getCharacters).mockResolvedValue([]);
    vi.mocked(getOpenThreads).mockResolvedValue([]);
    vi.mocked(getLatestSummary).mockResolvedValue(mockSummary);
    vi.mocked(getRecentChapterMetadata).mockResolvedValue([]);

    const result = await assembleArcContext('arc-1', 'user-1');

    expect(result.rollingSummary).toBeDefined();
    expect(result.rollingSummary!.summaryText).toBe('Elena discovered the vampire\'s true name.');
    expect(result.rollingSummary!.chapterMilestone).toBe(5);
  });

  it('sets rollingSummary to undefined when getLatestSummary returns null', async () => {
    vi.mocked(getArc).mockResolvedValue(mockArc);
    vi.mocked(getCharacters).mockResolvedValue([]);
    vi.mocked(getOpenThreads).mockResolvedValue([]);
    vi.mocked(getLatestSummary).mockResolvedValue(null);
    vi.mocked(getRecentChapterMetadata).mockResolvedValue([]);

    const result = await assembleArcContext('arc-1', 'user-1');

    expect(result.rollingSummary).toBeUndefined();
  });

  it('includes recentChapterMetadata when published chapters exist', async () => {
    const mockChapterRow = {
      id: 'ch-1',
      arcId: 'arc-1',
      chapterNumber: 1,
      title: 'Chapter One',
      content: 'Text...',
      wordCount: 2000,
      beatUsed: 'forbidden_threshold',
      emotionalArc: 'hope_to_despair',
      dialogueRatioPct: 40,
      chekhovSeeded: [],
      cliffhangerType: 'none',
      spiceLevelUsed: 2,
      engineVersion: '1.0.0',
      status: 'published' as const,
      generationAttempt: 1,
      parentChapterId: null,
      droppedModules: [],
      systemPromptUsed: null,
      archivedAt: null,
      generatedAt: new Date().toISOString(),
    };

    const mockMetadata = {
      arcId: 'arc-1',
      chapterNumber: 1,
      beatUsed: 'forbidden_threshold',
      emotionalArc: 'hope_to_despair' as const,
      dialogueRatioPct: 40,
      chekhovSeeded: [],
      cliffhangerType: 'none' as const,
      wordCount: 2000,
      spiceLevelUsed: 2 as const,
      generatedAt: new Date().toISOString(),
      engineVersion: '1.0.0',
      status: 'published' as const,
      generationAttempt: 1,
      droppedModules: [],
    };

    vi.mocked(getArc).mockResolvedValue(mockArc);
    vi.mocked(getCharacters).mockResolvedValue([]);
    vi.mocked(getOpenThreads).mockResolvedValue([]);
    vi.mocked(getLatestSummary).mockResolvedValue(null);
    vi.mocked(getRecentChapterMetadata).mockResolvedValue([mockChapterRow as any]);
    vi.mocked(chapterRowToMetadata).mockReturnValue(mockMetadata);

    const result = await assembleArcContext('arc-1', 'user-1');

    expect(result.recentChapterMetadata).toBeDefined();
    expect(result.recentChapterMetadata).toHaveLength(1);
    expect(result.recentChapterMetadata![0]!.beatUsed).toBe('forbidden_threshold');
  });

  it('sets recentChapterMetadata to undefined when no published chapters', async () => {
    vi.mocked(getArc).mockResolvedValue(mockArc);
    vi.mocked(getCharacters).mockResolvedValue([]);
    vi.mocked(getOpenThreads).mockResolvedValue([]);
    vi.mocked(getLatestSummary).mockResolvedValue(null);
    vi.mocked(getRecentChapterMetadata).mockResolvedValue([]);

    const result = await assembleArcContext('arc-1', 'user-1');

    expect(result.recentChapterMetadata).toBeUndefined();
  });

  it('includes plot threads returned by getOpenThreads', async () => {
    const mockThread: PlotThread = {
      id: 'thread-1',
      arcId: 'arc-1',
      threadType: 'chekhov',
      description: 'The locked room in the east wing.',
      plantedInChapter: 1,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    vi.mocked(getArc).mockResolvedValue(mockArc);
    vi.mocked(getCharacters).mockResolvedValue([]);
    vi.mocked(getOpenThreads).mockResolvedValue([mockThread]);
    vi.mocked(getLatestSummary).mockResolvedValue(null);
    vi.mocked(getRecentChapterMetadata).mockResolvedValue([]);

    const result = await assembleArcContext('arc-1', 'user-1');

    expect(result.plotThreads).toHaveLength(1);
    expect(result.plotThreads[0]!.description).toBe('The locked room in the east wing.');
  });

  it('limits recentChapterMetadata to last 3 chapters when more are available', async () => {
    const threeChapterRows = Array.from({ length: 3 }, (_, i) => ({
      id: `ch-${i + 1}`,
      arcId: 'arc-1',
      chapterNumber: i + 1,
      beatUsed: `beat_${i}`,
      status: 'published' as const,
    }));

    vi.mocked(getArc).mockResolvedValue(mockArc);
    vi.mocked(getCharacters).mockResolvedValue([]);
    vi.mocked(getOpenThreads).mockResolvedValue([]);
    vi.mocked(getLatestSummary).mockResolvedValue(null);
    vi.mocked(getRecentChapterMetadata).mockResolvedValue(threeChapterRows as any);
    vi.mocked(chapterRowToMetadata).mockImplementation((row: any) => ({
      arcId: row.arcId ?? 'arc-1',
      chapterNumber: row.chapterNumber,
      beatUsed: row.beatUsed,
      emotionalArc: 'hope_to_despair' as const,
      dialogueRatioPct: 40,
      chekhovSeeded: [],
      cliffhangerType: 'none' as const,
      wordCount: 2000,
      spiceLevelUsed: 2 as const,
      generatedAt: new Date().toISOString(),
      engineVersion: '1.0.0',
      status: 'published' as const,
      generationAttempt: 1,
      droppedModules: [],
    }));

    const result = await assembleArcContext('arc-1', 'user-1');

    // getRecentChapterMetadata is called with limit=3, so DB returns exactly 3
    expect(result.recentChapterMetadata).toHaveLength(3);
  });

  it('propagates errors from getCharacters', async () => {
    vi.mocked(getArc).mockResolvedValue(mockArc);
    vi.mocked(getCharacters).mockRejectedValue(new Error('DB connection lost'));
    vi.mocked(getOpenThreads).mockResolvedValue([]);
    vi.mocked(getLatestSummary).mockResolvedValue(null);
    vi.mocked(getRecentChapterMetadata).mockResolvedValue([]);

    await expect(assembleArcContext('arc-1', 'user-1')).rejects.toThrow('DB connection lost');
  });

  it('propagates errors from relationship query (adminClient)', async () => {
    vi.mocked(getArc).mockResolvedValue(mockArc);
    vi.mocked(getCharacters).mockResolvedValue([]);
    vi.mocked(getOpenThreads).mockResolvedValue([]);
    vi.mocked(getLatestSummary).mockResolvedValue(null);
    vi.mocked(getRecentChapterMetadata).mockResolvedValue([]);

    // Make the relationship_map query return an error
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'relationship_map') {
        return makeChainableQuery({ data: null, error: { message: 'relationship query failed' } } as any);
      }
      if (table === 'creature_lore') {
        return makeChainableQuery({ data: null, error: null });
      }
      return makeChainableQuery({ data: [], error: null });
    });

    await expect(assembleArcContext('arc-1', 'user-1')).rejects.toThrow(
      /Failed to fetch relationships|relationship query failed/,
    );
  });

  it('getArc is called with correct arcId and userId', async () => {
    vi.mocked(getArc).mockResolvedValue(mockArc);
    vi.mocked(getCharacters).mockResolvedValue([]);
    vi.mocked(getOpenThreads).mockResolvedValue([]);
    vi.mocked(getLatestSummary).mockResolvedValue(null);
    vi.mocked(getRecentChapterMetadata).mockResolvedValue([]);

    await assembleArcContext('arc-1', 'user-1');

    expect(vi.mocked(getArc)).toHaveBeenCalledWith('arc-1', 'user-1');
    expect(vi.mocked(getArc)).toHaveBeenCalledTimes(1);
  });

  it('getRecentChapterMetadata is called with arcId and limit 3', async () => {
    vi.mocked(getArc).mockResolvedValue(mockArc);
    vi.mocked(getCharacters).mockResolvedValue([]);
    vi.mocked(getOpenThreads).mockResolvedValue([]);
    vi.mocked(getLatestSummary).mockResolvedValue(null);
    vi.mocked(getRecentChapterMetadata).mockResolvedValue([]);

    await assembleArcContext('arc-1', 'user-1');

    // continuityInjector calls getChaptersByArc(arcId, false) — false = published only
    expect(vi.mocked(getRecentChapterMetadata)).toHaveBeenCalledWith('arc-1', 3);
  });

  it('returns ArcContext with all required top-level keys', async () => {
    vi.mocked(getArc).mockResolvedValue(mockArc);
    vi.mocked(getCharacters).mockResolvedValue([]);
    vi.mocked(getOpenThreads).mockResolvedValue([]);
    vi.mocked(getLatestSummary).mockResolvedValue(null);
    vi.mocked(getRecentChapterMetadata).mockResolvedValue([]);

    const result = await assembleArcContext('arc-1', 'user-1');

    expect(result).toHaveProperty('arc');
    expect(result).toHaveProperty('characters');
    expect(result).toHaveProperty('relationships');
    expect(result).toHaveProperty('creatureLore');
    expect(result).toHaveProperty('worldNotes');
    expect(result).toHaveProperty('plotThreads');
  });
});
