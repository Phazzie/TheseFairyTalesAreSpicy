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
    // Strip internal engine fields before sending to client (M3 — IP leak prevention)
    const { systemPromptUsed: _, droppedModules: __, ...publicChapter } = chapter;
    return c.json({ chapter: publicChapter });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Chapter not found';
    return c.json({ error: 'not_found', message }, 404);
  }
});

// POST /arcs/:arcId/chapters/:id/regenerate — returns generation params for the client to call /api/generate
chaptersApp.post('/:arcId/chapters/:id/regenerate', authMiddleware, async (c) => {
  const user = c.get('user');
  const arcId = c.req.param('arcId');
  const chapterId = c.req.param('id');

  // Verify arc ownership
  const arc = await getArc(arcId, user.id).catch(() => null);
  if (!arc) {
    return c.json({ error: 'not_found', message: 'Arc not found' }, 404);
  }

  let chapter;
  try {
    chapter = await getChapter(chapterId);
  } catch {
    return c.json({ error: 'not_found', message: 'Chapter not found' }, 404);
  }

  if (chapter.arcId !== arc.id) {
    return c.json({ error: 'not_found', message: 'Chapter not found' }, 404);
  }

  // Check tier limit: free = 3 attempts per chapter, pro = unlimited
  const profile = await getProfile(user.id);
  const maxAttempts = profile.subscriptionTier === 'pro' ? 99 : 3;
  if (chapter.generationAttempt >= maxAttempts) {
    return c.json(
      {
        error: 'regen_limit_reached',
        message: 'Regeneration limit reached. Upgrade to Pro for more.',
      },
      429,
    );
  }

  // Return the chapter params so the client can call /api/generate or /api/continue
  return c.json({
    arcId,
    chapterNumber: chapter.chapterNumber,
    priorChapterId: chapter.parentChapterId ?? undefined,
    message: 'Ready to regenerate. Call /api/generate or /api/continue with these params.',
  });
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
