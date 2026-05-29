import { Hono } from 'hono';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { authMiddleware, type Variables } from '../middleware/auth.js';
import {
  getAllThreads,
  getOpenThreads,
  createThread,
  resolveThread,
  abandonThread,
  type CreateThreadInput,
} from '../db/plotThreads.js';
import { getArc } from '../db/arcs.js';

// ============================================================
// SCHEMAS
// ============================================================

const createThreadSchema = z.object({
  threadType: z.string(),
  description: z.string().min(1).max(1000),
  plantedInChapter: z.number().int().positive(),
  expectedPayoffChapter: z.number().int().positive().optional(),
});

const resolveThreadSchema = z.object({
  resolvedInChapter: z.number().int().positive(),
  resolutionNote: z.string().max(500).optional(),
});

// ============================================================
// APP
// ============================================================

export const plotThreadsApp = new Hono<{ Variables: Variables }>();

// Helper: verify arc ownership
async function verifyArcOwnership(arcId: string, userId: string): Promise<boolean> {
  try {
    await getArc(arcId, userId);
    return true;
  } catch {
    return false;
  }
}

// GET /arcs/:arcId/threads — all threads (query param ?status=open)
plotThreadsApp.get('/:arcId/threads', authMiddleware, async (c) => {
  const user = c.get('user');
  const arcId = c.req.param('arcId');
  const statusFilter = c.req.query('status');

  const owned = await verifyArcOwnership(arcId, user.id);
  if (!owned) {
    return c.json({ error: 'not_found', message: 'Arc not found' }, 404);
  }

  try {
    const threads =
      statusFilter === 'open' ? await getOpenThreads(arcId) : await getAllThreads(arcId);
    return c.json({ threads });
  } catch (err) {
    console.error('[plotThreads] GET list error:', err);
    return c.json({ error: 'internal_error', message: 'Failed to fetch plot threads' }, 500);
  }
});

// POST /arcs/:arcId/threads — create thread
plotThreadsApp.post(
  '/:arcId/threads',
  authMiddleware,
  validate(createThreadSchema),
  async (c) => {
    const user = c.get('user');
    const arcId = c.req.param('arcId');
    const body = c.req.valid('json');

    const owned = await verifyArcOwnership(arcId, user.id);
    if (!owned) {
      return c.json({ error: 'not_found', message: 'Arc not found' }, 404);
    }

    try {
      const input: CreateThreadInput = {
        arcId,
        threadType: body.threadType as CreateThreadInput['threadType'],
        description: body.description,
        plantedInChapter: body.plantedInChapter,
        expectedPayoffChapter: body.expectedPayoffChapter,
      };

      const thread = await createThread(input);
      return c.json({ thread }, 201);
    } catch (err) {
      console.error('[plotThreads] POST error:', err);
      return c.json({ error: 'internal_error', message: 'Failed to create plot thread' }, 500);
    }
  },
);

// PATCH /arcs/:arcId/threads/:id/resolve — resolve thread
plotThreadsApp.patch(
  '/:arcId/threads/:id/resolve',
  authMiddleware,
  validate(resolveThreadSchema),
  async (c) => {
    const user = c.get('user');
    const arcId = c.req.param('arcId');
    const threadId = c.req.param('id');
    const body = c.req.valid('json');

    const owned = await verifyArcOwnership(arcId, user.id);
    if (!owned) {
      return c.json({ error: 'not_found', message: 'Arc not found' }, 404);
    }

    try {
      await resolveThread(threadId, body.resolvedInChapter, body.resolutionNote);
      return c.json({ resolved: true });
    } catch (err) {
      console.error('[plotThreads] PATCH resolve error:', err);
      return c.json(
        { error: 'internal_error', message: 'Failed to resolve plot thread' },
        500,
      );
    }
  },
);

// PATCH /arcs/:arcId/threads/:id/abandon — abandon thread
plotThreadsApp.patch('/:arcId/threads/:id/abandon', authMiddleware, async (c) => {
  const user = c.get('user');
  const arcId = c.req.param('arcId');
  const threadId = c.req.param('id');

  const owned = await verifyArcOwnership(arcId, user.id);
  if (!owned) {
    return c.json({ error: 'not_found', message: 'Arc not found' }, 404);
  }

  try {
    await abandonThread(threadId);
    return c.json({ abandoned: true });
  } catch (err) {
    console.error('[plotThreads] PATCH abandon error:', err);
    return c.json(
      { error: 'internal_error', message: 'Failed to abandon plot thread' },
      500,
    );
  }
});
