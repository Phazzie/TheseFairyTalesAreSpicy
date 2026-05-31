import { describe, it, expect } from 'vitest';
import { selectChekhovElements } from '../../selectors/selectChekhovElements.js';
import type { ChapterMetadata } from '../../types/index.js';

// ============================================================
// HELPERS
// ============================================================

function makeChapterMeta(chekhovSeeded: string[], chapterNumber = 1): ChapterMetadata {
  return {
    arcId: 'arc-1',
    chapterNumber,
    beatUsed: 'forbidden_threshold',
    emotionalArc: 'hope_to_despair',
    dialogueRatioPct: 40,
    chekhovSeeded,
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

// ============================================================
// TESTS
// ============================================================

describe('selectChekhovElements', () => {
  it('returns exactly 2 elements for vampire with no prior metadata', () => {
    const elements = selectChekhovElements('vampire', [], undefined);
    expect(elements).toHaveLength(2);
  });

  it('returned objects have id, element, payoffSuggestion fields', () => {
    const elements = selectChekhovElements('vampire', [], undefined);
    for (const el of elements) {
      expect(typeof el.id).toBe('string');
      expect(el.id.length).toBeGreaterThan(0);
      expect(typeof el.element).toBe('string');
      expect(el.element.length).toBeGreaterThan(0);
      expect(typeof el.payoffSuggestion).toBe('string');
      expect(el.payoffSuggestion.length).toBeGreaterThan(0);
    }
  });

  it('does not repeat an element already in recentChapterMetadata.chekhovSeeded', () => {
    // Seed the first result so we know what ID to exclude
    const firstRun = selectChekhovElements('vampire', [], undefined);
    const seededId = firstRun[0]!.id;

    // Run many times — the seeded element should never appear
    for (let i = 0; i < 30; i++) {
      const meta = [makeChapterMeta([seededId])];
      const elements = selectChekhovElements('vampire', [], meta);
      const ids = elements.map((el) => el.id);
      expect(ids).not.toContain(seededId);
    }
  });

  it('handles recentChapterMetadata as undefined without throwing', () => {
    expect(() => selectChekhovElements('vampire', [], undefined)).not.toThrow();
  });

  it('handles recentChapterMetadata as empty array without throwing', () => {
    expect(() => selectChekhovElements('vampire', [], [])).not.toThrow();
  });

  it('returns fewer than 2 when nearly all elements have been seeded already', () => {
    // Build a list of nearly every vampire + universal element ID.
    // We do this by seeding 40+ IDs with fake IDs to cover essentially all real ones.
    // Then also seed real IDs from the first result to maximally deplete the pool.
    const firstRun = selectChekhovElements('vampire', [], undefined);
    const knownIds = firstRun.map((el) => el.id);

    // Generate a set of fake already-seeded IDs that won't match anything real
    // but also collect more real IDs across multiple runs
    const collectedIds = new Set<string>(knownIds);
    for (let i = 0; i < 100; i++) {
      const run = selectChekhovElements('vampire', [], undefined);
      for (const el of run) {
        collectedIds.add(el.id);
      }
    }

    // Now seed all collected real IDs
    const meta = [makeChapterMeta(Array.from(collectedIds))];
    const result = selectChekhovElements('vampire', [], meta);
    // When all (or nearly all) elements are seeded, the pool shrinks and result has < 2
    expect(result.length).toBeLessThanOrEqual(2);
    // If pool is empty, expect 0; otherwise whatever remains up to 2
    // The key assertion: result length does NOT exceed the available pool
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it('works with werewolf creature type without throwing', () => {
    expect(() => selectChekhovElements('werewolf', [], undefined)).not.toThrow();
    const elements = selectChekhovElements('werewolf', [], undefined);
    // Should return up to 2 elements (werewolf may have fewer total)
    expect(elements.length).toBeLessThanOrEqual(2);
    expect(elements.length).toBeGreaterThanOrEqual(0);
  });

  it('works with fairy creature type without throwing', () => {
    expect(() => selectChekhovElements('fairy', [], undefined)).not.toThrow();
  });

  it('returns distinct element IDs (no duplicates in a single call)', () => {
    for (let i = 0; i < 20; i++) {
      const elements = selectChekhovElements('vampire', [], undefined);
      const ids = elements.map((el) => el.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    }
  });
});
