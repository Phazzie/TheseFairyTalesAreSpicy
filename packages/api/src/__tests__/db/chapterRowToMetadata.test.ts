import { describe, it, expect, vi } from 'vitest';

// Mock supabase before importing chapters.ts so the env-var check doesn't fire.
// chapterRowToMetadata is a pure function and never calls adminClient directly.
vi.mock('../../db/supabase.js', () => ({
  adminClient: {},
}));

import { chapterRowToMetadata } from '../../db/chapters.js';
import type { ChapterRow } from '../../db/chapters.js';

// ============================================================
// FIXTURES
// ============================================================

function makeChapterRow(overrides: Partial<ChapterRow> = {}): ChapterRow {
  return {
    id: 'ch-1',
    arcId: 'arc-1',
    chapterNumber: 3,
    title: 'The Forbidden Kiss',
    content: 'Long prose text goes here.',
    wordCount: 2100,
    beatUsed: 'forbidden_threshold',
    emotionalArc: 'hope_to_despair',
    dialogueRatioPct: 38,
    chekhovSeeded: ['the locked east wing', 'the silver locket'],
    cliffhangerType: 'interrupted_kiss',
    spiceLevelUsed: 3,
    engineVersion: '2.0.0',
    status: 'published',
    generationAttempt: 2,
    parentChapterId: 'ch-0',
    droppedModules: ['sensory_module'],
    systemPromptUsed: 'You are a gothic romance author...',
    archivedAt: null,
    generatedAt: '2026-01-15T10:00:00.000Z',
    ...overrides,
  };
}

// ============================================================
// TESTS
// ============================================================

describe('chapterRowToMetadata', () => {
  it('maps all required fields from a ChapterRow to ChapterMetadata', () => {
    const row = makeChapterRow();
    const meta = chapterRowToMetadata(row);

    expect(meta.arcId).toBe('arc-1');
    expect(meta.chapterNumber).toBe(3);
    expect(meta.beatUsed).toBe('forbidden_threshold');
    expect(meta.emotionalArc).toBe('hope_to_despair');
    expect(meta.dialogueRatioPct).toBe(38);
    expect(meta.chekhovSeeded).toEqual(['the locked east wing', 'the silver locket']);
    expect(meta.cliffhangerType).toBe('interrupted_kiss');
    expect(meta.wordCount).toBe(2100);
    expect(meta.spiceLevelUsed).toBe(3);
    expect(meta.generatedAt).toBe('2026-01-15T10:00:00.000Z');
    expect(meta.engineVersion).toBe('2.0.0');
    expect(meta.status).toBe('published');
    expect(meta.generationAttempt).toBe(2);
    expect(meta.droppedModules).toEqual(['sensory_module']);
    expect(meta.parentChapterId).toBe('ch-0');
    expect(meta.systemPromptUsed).toBe('You are a gothic romance author...');
  });

  it('converts null parentChapterId to undefined', () => {
    const row = makeChapterRow({ parentChapterId: null });
    const meta = chapterRowToMetadata(row);

    expect(meta.parentChapterId).toBeUndefined();
  });

  it('converts null systemPromptUsed to undefined', () => {
    const row = makeChapterRow({ systemPromptUsed: null });
    const meta = chapterRowToMetadata(row);

    expect(meta.systemPromptUsed).toBeUndefined();
  });

  it('preserves droppedModules array including empty array', () => {
    const rowWithModules = makeChapterRow({ droppedModules: ['beat_module', 'pacing_module'] });
    const metaWithModules = chapterRowToMetadata(rowWithModules);
    expect(metaWithModules.droppedModules).toEqual(['beat_module', 'pacing_module']);

    const rowEmpty = makeChapterRow({ droppedModules: [] });
    const metaEmpty = chapterRowToMetadata(rowEmpty);
    expect(metaEmpty.droppedModules).toEqual([]);
  });

  it('preserves chekhovSeeded including empty array', () => {
    const rowWithSeeds = makeChapterRow({ chekhovSeeded: ['the hidden key'] });
    const metaWithSeeds = chapterRowToMetadata(rowWithSeeds);
    expect(metaWithSeeds.chekhovSeeded).toEqual(['the hidden key']);

    const rowEmpty = makeChapterRow({ chekhovSeeded: [] });
    const metaEmpty = chapterRowToMetadata(rowEmpty);
    expect(metaEmpty.chekhovSeeded).toEqual([]);
  });
});
