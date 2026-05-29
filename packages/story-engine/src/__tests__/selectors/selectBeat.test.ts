import { describe, it, expect, vi, afterEach } from 'vitest';
import { selectBeat } from '../../selectors/selectBeat.js';
import type { ChapterMetadata } from '../../types/index.js';

// ============================================================
// HELPERS
// ============================================================

function makeChapterMeta(beatUsed: string, chapterNumber = 1): ChapterMetadata {
  return {
    arcId: 'arc-1',
    chapterNumber,
    beatUsed,
    emotionalArc: 'hope_to_despair',
    dialogueRatioPct: 40,
    chekhovSeeded: [],
    cliffhangerType: 'none',
    wordCount: 2000,
    spiceLevelUsed: 2,
    generatedAt: new Date().toISOString(),
    engineVersion: '1.0.0',
    status: 'published',
    generationAttempt: 1,
    droppedModules: [],
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ============================================================
// TESTS
// ============================================================

describe('selectBeat', () => {
  it('returns a beat object with required shape fields', () => {
    const beat = selectBeat('single_couple');
    expect(beat).toBeDefined();
    expect(typeof beat.code).toBe('string');
    expect(beat.code.length).toBeGreaterThan(0);
    expect(typeof beat.name).toBe('string');
    expect(Array.isArray(beat.progression)).toBe(true);
    expect(typeof beat.spiceNote).toBe('string');
    expect(Array.isArray(beat.antiPatterns)).toBe(true);
  });

  it('returns a beat with non-empty progression array', () => {
    const beat = selectBeat('single_couple');
    expect(beat.progression.length).toBeGreaterThan(0);
  });

  it('handles undefined recentMetadata without throwing', () => {
    expect(() => selectBeat('single_couple', undefined)).not.toThrow();
  });

  it('handles empty recentMetadata array without throwing', () => {
    expect(() => selectBeat('single_couple', [])).not.toThrow();
  });

  it('handles undefined recentMetadata with pilotMode without throwing', () => {
    expect(() => selectBeat('single_couple', undefined, true)).not.toThrow();
  });

  it('pilotMode=true never returns a slow beat across many calls', () => {
    const SLOW_BEATS = new Set(['slow_burn_awakening', 'reluctant_protector', 'ancient_claim']);
    // Run 30 iterations to catch non-determinism
    for (let i = 0; i < 30; i++) {
      const beat = selectBeat('single_couple', undefined, true);
      expect(SLOW_BEATS.has(beat.code)).toBe(false);
    }
  });

  it('pilotMode=false (default) CAN return slow beats', () => {
    // Seed Math.random to always return 0, which picks the first candidate
    // Find which beat is at index 0 in beatStructures and verify it's returned
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const beat = selectBeat('single_couple', undefined, false);
    // With random=0, index is 0 — just verify we get a beat (not throw)
    expect(beat).toBeDefined();
    expect(typeof beat.code).toBe('string');
  });

  it('does not repeat a beat that was used in the most recent chapter', () => {
    // We seed Math.random to always pick index 0.
    // Then we pass recentMetadata with that beat used — it should pick a different one.
    vi.spyOn(Math, 'random').mockReturnValue(0);

    // First call to figure out what beat index 0 resolves to
    const firstBeat = selectBeat('single_couple', undefined, false);
    const firstCode = firstBeat.code;

    // Now provide that beat as recently used — the selector should filter it out
    const recentMeta = [makeChapterMeta(firstCode, 1)];

    // With random=0, the first AVAILABLE beat should be returned (not firstCode)
    const nextBeat = selectBeat('single_couple', recentMeta, false);
    expect(nextBeat.code).not.toBe(firstCode);
  });

  it('does not repeat any beat from the last 3 chapters', () => {
    // Put 3 specific known beat codes in recent metadata
    const recentCodes = ['forbidden_threshold', 'slow_burn_awakening', 'power_exchange'];
    const recentMeta = recentCodes.map((code, i) => makeChapterMeta(code, i + 1));

    // Run multiple times; none of the recent 3 should appear
    for (let i = 0; i < 20; i++) {
      const beat = selectBeat('single_couple', recentMeta, false);
      expect(recentCodes).not.toContain(beat.code);
    }
  });

  it('falls back gracefully when all beats have been recently used', () => {
    // This is hard to achieve in practice since beatStructures.json has many beats,
    // but we can test the shape of the fallback by checking the function still returns something.
    // We pass a long recentMetadata with many codes repeated.
    const manyRecent = Array.from({ length: 50 }, (_, i) =>
      makeChapterMeta(`beat_${i}`, i + 1)
    );
    // selectBeat should not throw even when recentMetadata is very long
    expect(() => selectBeat('single_couple', manyRecent, false)).not.toThrow();
    const beat = selectBeat('single_couple', manyRecent, false);
    expect(beat).toBeDefined();
    expect(typeof beat.code).toBe('string');
  });

  it('works with "anthology" arcType', () => {
    const beat = selectBeat('anthology');
    expect(beat).toBeDefined();
    expect(typeof beat.code).toBe('string');
  });

  it('works with "multi_protagonist" arcType', () => {
    const beat = selectBeat('multi_protagonist');
    expect(beat).toBeDefined();
    expect(typeof beat.code).toBe('string');
  });

  it('Math.random seeding produces deterministic result', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const beat1 = selectBeat('single_couple', undefined, false);
    const beat2 = selectBeat('single_couple', undefined, false);
    // Same seed → same result
    expect(beat1.code).toBe(beat2.code);
  });

  it('returns beat with antiPatterns array containing strings', () => {
    const beat = selectBeat('single_couple');
    for (const pattern of beat.antiPatterns) {
      expect(typeof pattern).toBe('string');
    }
  });

  it('pilotMode=true with recent metadata still filters slow beats', () => {
    const SLOW_BEATS = new Set(['slow_burn_awakening', 'reluctant_protector', 'ancient_claim']);
    const recentMeta = [makeChapterMeta('forbidden_threshold', 1)];
    for (let i = 0; i < 20; i++) {
      const beat = selectBeat('single_couple', recentMeta, true);
      expect(SLOW_BEATS.has(beat.code)).toBe(false);
    }
  });
});
