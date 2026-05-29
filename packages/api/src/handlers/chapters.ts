import { Hono } from 'hono';
import { getArc } from '../db/arcs.js';
import { authMiddleware, type Variables } from '../middleware/auth.js';
import {
  getChaptersByArc,
  getChapter,
  saveChapter,
  publishChapter,
} from '../db/chapters.js';
import { getProfile } from '../db/profiles.js';

// ============================================================
// APP
// ============================================================

export const chaptersApp = new Hono<{ Variables: Variables }>();

// Helper: verify arc ownership
async function verifyArcOwnership(arcId: string, userId: string): Promise<boolean> {
  try {
    await getArc(arcId, userId);
    return true;
  } catch {
    return false;
  }
}

// GET /arcs/:arcId/chapters — list published chapters
chaptersApp.get('/:arcId/chapters', authMiddleware, async (c) => {
  const user = c.get('user');
  const arcId = c.req.param('arcId');

  const owned = await verifyArcOwnership(arcId, user.id);
  if (!owned) {
    return c.json({ error: 'not_found', message: 'Arc not found' }, 404);
  }

  try {
    const chapters = await getChaptersByArc(arcId, false); // published only
    // Return metadata list (exclude full content for list view)
    const list = chapters.map((ch) => ({
      id: ch.id,
      arcId: ch.arcId,
      chapterNumber: ch.chapterNumber,
      title: ch.title,
      wordCount: ch.wordCount,
      cliffhangerType: ch.cliffhangerType,
      spiceLevelUsed: ch.spiceLevelUsed,
      emotionalArc: ch.emotionalArc,
      status: ch.status,
      generatedAt: ch.generatedAt,
    }));
    return c.json({ chapters: list });
  } catch (err) {
    console.error('[chapters] GET list error:', err);
    return c.json({ error: 'internal_error', message: 'Failed to fetch chapters' }, 500);
  }
});

// GET /arcs/:arcId/chapters/:id — single chapter with full content
chaptersApp.get('/:arcId/chapters/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const arcId = c.req.param('arcId');
  const chapterId = c.req.param('id');

  const owned = await verifyArcOwnership(arcId, user.id);
  if (!owned) {
    return c.json({ error: 'not_found', message: 'Arc not found' }, 404);
  }

  try {
    const chapter = await getChapter(chapterId);
    if (chapter.arcId !== arcId) {
      return c.json({ error: 'not_found', message: 'Chapter not found' }, 404);
    }
    return c.json({ chapter });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Chapter not found';
    return c.json({ error: 'not_found', message }, 404);
  }
});

// POST /arcs/:arcId/chapters/:id/regenerate — creates draft (checks regen limit by tier)
chaptersApp.post('/:arcId/chapters/:id/regenerate', authMiddleware, async (c) => {
  const user = c.get('user');
  const arcId = c.req.param('arcId');
  const chapterId = c.req.param('id');

  const owned = await verifyArcOwnership(arcId, user.id);
  if (!owned) {
    return c.json({ error: 'not_found', message: 'Arc not found' }, 404);
  }

  // Check subscription tier for regen limits
  // Pro: unlimited regenerations, Free: 3 per chapter
  const profile = await getProfile(user.id);

  let existingChapter;
  try {
    existingChapter = await getChapter(chapterId);
  } catch {
    return c.json({ error: 'not_found', message: 'Chapter not found' }, 404);
  }

  if (existingChapter.arcId !== arcId) {
    return c.json({ error: 'not_found', message: 'Chapter not found' }, 404);
  }

  // Free tier: cap at 3 generation attempts per chapter
  const REGEN_LIMIT_FREE = 3;
  if (
    profile.subscriptionTier !== 'pro' &&
    existingChapter.generationAttempt >= REGEN_LIMIT_FREE
  ) {
    return c.json(
      {
        error: 'regen_limit_reached',
        message: `Free accounts can regenerate a chapter up to ${REGEN_LIMIT_FREE} times. Upgrade to Pro for unlimited regenerations.`,
      },
      429,
    );
  }

  try {
    // Save a draft copy of the same chapter (new generation attempt)
    const { id: draftId } = await saveChapter({
      arcId,
      chapterNumber: existingChapter.chapterNumber,
      title: existingChapter.title ?? undefined,
      content: existingChapter.content,
      wordCount: existingChapter.wordCount,
      beatUsed: existingChapter.beatUsed,
      emotionalArc: existingChapter.emotionalArc,
      dialogueRatioPct: existingChapter.dialogueRatioPct,
      chekhovSeeded: existingChapter.chekhovSeeded,
      cliffhangerType: existingChapter.cliffhangerType,
      spiceLevelUsed: existingChapter.spiceLevelUsed,
      engineVersion: existingChapter.engineVersion,
      status: 'draft',
      generationAttempt: existingChapter.generationAttempt + 1,
      parentChapterId: chapterId,
      droppedModules: existingChapter.droppedModules,
      systemPromptUsed: existingChapter.systemPromptUsed ?? undefined,
    });

    return c.json({ draftId, message: 'Draft created. Publish when ready.' }, 201);
  } catch (err) {
    console.error('[chapters] POST regenerate error:', err);
    return c.json({ error: 'internal_error', message: 'Failed to create draft' }, 500);
  }
});

// PATCH /arcs/:arcId/chapters/:id/publish — publishes a draft
chaptersApp.patch('/:arcId/chapters/:id/publish', authMiddleware, async (c) => {
  const user = c.get('user');
  const arcId = c.req.param('arcId');
  const chapterId = c.req.param('id');

  const owned = await verifyArcOwnership(arcId, user.id);
  if (!owned) {
    return c.json({ error: 'not_found', message: 'Arc not found' }, 404);
  }

  let chapter;
  try {
    chapter = await getChapter(chapterId);
  } catch {
    return c.json({ error: 'not_found', message: 'Chapter not found' }, 404);
  }

  if (chapter.arcId !== arcId) {
    return c.json({ error: 'not_found', message: 'Chapter not found' }, 404);
  }

  if (chapter.status !== 'draft') {
    return c.json(
      { error: 'invalid_state', message: 'Only draft chapters can be published' },
      409,
    );
  }

  try {
    await publishChapter(chapterId);
    return c.json({ published: true });
  } catch (err) {
    console.error('[chapters] PATCH publish error:', err);
    return c.json({ error: 'internal_error', message: 'Failed to publish chapter' }, 500);
  }
});
