import { Hono } from 'hono';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { authMiddleware, type Variables } from '../middleware/auth.js';
import {
  getCharacters,
  getCharacter,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  type CreateCharacterInput,
} from '../db/characters.js';
import { getArc } from '../db/arcs.js';

// ============================================================
// SCHEMAS
// ============================================================

const accentSchema = z.object({
  id: z.string(),
  region: z.string(),
});

const createCharacterSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9_-]+$/),
  displayName: z.string().min(1).max(200),
  species: z.string(),
  apparentAge: z.number().int().min(0).optional(),
  trueAge: z.number().int().min(0).optional(),
  isProtagonist: z.boolean().optional(),
  accent: accentSchema.optional(),
  emotionStateIds: z.array(z.string()).optional(),
  vocabRegister: z.string(),
  speechAvgSentenceLength: z.enum(['short', 'medium', 'long']).optional(),
  speechVerbalTic: z.string().max(200).optional(),
  speechSignaturePhrase: z.string().max(200).optional(),
  statedDesire: z.string().max(500).optional(),
  hiddenNeed: z.string().max(500).optional(),
  wound: z.string().max(500).optional(),
  flaw: z.string().max(500).optional(),
  lie: z.string().max(500).optional(),
  bio: z.string().min(1),
  appearance: z.string().min(1),
});

const updateCharacterSchema = createCharacterSchema.partial();

// ============================================================
// APP
// ============================================================

export const charactersApp = new Hono<{ Variables: Variables }>();

// Helper: verify arc ownership and return arcId
async function verifyArcOwnership(arcId: string, userId: string): Promise<boolean> {
  try {
    await getArc(arcId, userId);
    return true;
  } catch {
    return false;
  }
}

// GET /arcs/:arcId/characters
charactersApp.get('/:arcId/characters', authMiddleware, async (c) => {
  const user = c.get('user');
  const arcId = c.req.param('arcId');

  const owned = await verifyArcOwnership(arcId, user.id);
  if (!owned) {
    return c.json({ error: 'not_found', message: 'Arc not found' }, 404);
  }

  try {
    const characters = await getCharacters(arcId);
    return c.json({ characters });
  } catch (err) {
    console.error('[characters] GET list error:', err);
    return c.json({ error: 'internal_error', message: 'Failed to fetch characters' }, 500);
  }
});

// POST /arcs/:arcId/characters
charactersApp.post(
  '/:arcId/characters',
  authMiddleware,
  validate(createCharacterSchema),
  async (c) => {
    const user = c.get('user');
    const arcId = c.req.param('arcId');
    const body = c.req.valid('json');

    const owned = await verifyArcOwnership(arcId, user.id);
    if (!owned) {
      return c.json({ error: 'not_found', message: 'Arc not found' }, 404);
    }

    try {
      const input: CreateCharacterInput = {
        arcId,
        slug: body.slug,
        displayName: body.displayName,
        species: body.species as CreateCharacterInput['species'],
        apparentAge: body.apparentAge,
        trueAge: body.trueAge,
        isProtagonist: body.isProtagonist,
        accent: body.accent,
        emotionStateIds: body.emotionStateIds,
        vocabRegister: body.vocabRegister as CreateCharacterInput['vocabRegister'],
        speechAvgSentenceLength: body.speechAvgSentenceLength,
        speechVerbalTic: body.speechVerbalTic,
        speechSignaturePhrase: body.speechSignaturePhrase,
        statedDesire: body.statedDesire,
        hiddenNeed: body.hiddenNeed,
        wound: body.wound,
        flaw: body.flaw,
        lie: body.lie,
        bio: body.bio,
        appearance: body.appearance,
      };

      const character = await createCharacter(input);
      return c.json({ character }, 201);
    } catch (err) {
      console.error('[characters] POST error:', err);
      return c.json({ error: 'internal_error', message: 'Failed to create character' }, 500);
    }
  },
);

// GET /arcs/:arcId/characters/:id
charactersApp.get('/:arcId/characters/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const arcId = c.req.param('arcId');
  const characterId = c.req.param('id');

  const owned = await verifyArcOwnership(arcId, user.id);
  if (!owned) {
    return c.json({ error: 'not_found', message: 'Arc not found' }, 404);
  }

  try {
    const character = await getCharacter(characterId);
    if (character.arcId !== arcId) {
      return c.json({ error: 'not_found', message: 'Character not found' }, 404);
    }
    return c.json({ character });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Character not found';
    return c.json({ error: 'not_found', message }, 404);
  }
});

// PATCH /arcs/:arcId/characters/:id
charactersApp.patch(
  '/:arcId/characters/:id',
  authMiddleware,
  validate(updateCharacterSchema),
  async (c) => {
    const user = c.get('user');
    const arcId = c.req.param('arcId');
    const characterId = c.req.param('id');
    const body = c.req.valid('json');

    const owned = await verifyArcOwnership(arcId, user.id);
    if (!owned) {
      return c.json({ error: 'not_found', message: 'Arc not found' }, 404);
    }

    // Confirm character belongs to arc before patching
    try {
      const existing = await getCharacter(characterId);
      if (existing.arcId !== arcId) {
        return c.json({ error: 'not_found', message: 'Character not found' }, 404);
      }
    } catch {
      return c.json({ error: 'not_found', message: 'Character not found' }, 404);
    }

    try {
      const patch: Partial<CreateCharacterInput> = {
        slug: body.slug,
        displayName: body.displayName,
        species: body.species as CreateCharacterInput['species'],
        apparentAge: body.apparentAge,
        trueAge: body.trueAge,
        isProtagonist: body.isProtagonist,
        accent: body.accent,
        emotionStateIds: body.emotionStateIds,
        vocabRegister: body.vocabRegister as CreateCharacterInput['vocabRegister'],
        speechAvgSentenceLength: body.speechAvgSentenceLength,
        speechVerbalTic: body.speechVerbalTic,
        speechSignaturePhrase: body.speechSignaturePhrase,
        statedDesire: body.statedDesire,
        hiddenNeed: body.hiddenNeed,
        wound: body.wound,
        flaw: body.flaw,
        lie: body.lie,
        bio: body.bio,
        appearance: body.appearance,
      };

      // Strip undefined values so updateCharacter only applies set fields
      const cleanedPatch = Object.fromEntries(
        Object.entries(patch).filter(([, v]) => v !== undefined),
      ) as Partial<CreateCharacterInput>;

      const character = await updateCharacter(characterId, cleanedPatch);
      return c.json({ character });
    } catch (err) {
      console.error('[characters] PATCH error:', err);
      return c.json({ error: 'internal_error', message: 'Failed to update character' }, 500);
    }
  },
);

// DELETE /arcs/:arcId/characters/:id
charactersApp.delete('/:arcId/characters/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const arcId = c.req.param('arcId');
  const characterId = c.req.param('id');

  const owned = await verifyArcOwnership(arcId, user.id);
  if (!owned) {
    return c.json({ error: 'not_found', message: 'Arc not found' }, 404);
  }

  // Confirm character belongs to arc
  try {
    const existing = await getCharacter(characterId);
    if (existing.arcId !== arcId) {
      return c.json({ error: 'not_found', message: 'Character not found' }, 404);
    }
  } catch {
    return c.json({ error: 'not_found', message: 'Character not found' }, 404);
  }

  try {
    await deleteCharacter(characterId);
    return c.json({ deleted: true });
  } catch (err) {
    console.error('[characters] DELETE error:', err);
    return c.json({ error: 'internal_error', message: 'Failed to delete character' }, 500);
  }
});
