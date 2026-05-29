import { Hono } from 'hono';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { authMiddleware, type Variables } from '../middleware/auth.js';
import {
  getArc,
  getArcs,
  getArcCount,
  createArc,
  updateArc,
  deleteArc,
  type CreateArcInput,
  type UpdateArcInput,
} from '../db/arcs.js';
import { getProfile } from '../db/profiles.js';
import { createCharacter } from '../db/characters.js';
import { adminClient } from '../db/supabase.js';

// ============================================================
// SCHEMAS
// ============================================================

const characterSchema = z.object({
  displayName: z.string(),
  species: z.enum(['human', 'vampire', 'werewolf', 'fairy']).default('human'),
  statedDesire: z.string().optional(),
  hiddenNeed: z.string().optional(),
  wound: z.string().optional(),
  flaw: z.string().optional(),
  lie: z.string().optional(),
});

const creatureLoreSchema = z.object({
  rules: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
  abilities: z.array(z.string()).optional(),
  societyNotes: z.string().optional(),
});

const arcBaseSchema = z.object({
  title: z.string().max(200).optional(),
  creatureType: z.enum(['vampire', 'werewolf', 'fairy']),
  arcType: z.string(),
  themes: z.array(z.string()).min(1).max(10),
  defaultSpiceLevel: z.number().int().min(1).max(5),
  povMode: z.enum(['first_person', 'third_limited', 'third_omniscient', 'rotating']),
  tense: z.enum(['past', 'present']),
  narrativeDistance: z.string(),
  readingLevel: z.string(),
  dialogueRatioPct: z.number().min(0).max(100),
  hookDensity: z.string(),
  pacingRhythm: z.string(),
  sceneCountDefault: z.number().int().min(1).max(10),
  atmosphereArchetype: z.string(),
  defaultSensePrimary: z.string(),
  defaultSenseSecondary: z.string(),
  recurringMotif: z.string().max(200).optional(),
  genreBlendPrimary: z.string(),
  genreBlendSecondary: z.string().optional(),
  genreBlendRatio: z.number().int().min(50).max(100).optional().default(80),
  toneAllowance: z.string(),
  isQuickStart: z.boolean().optional(),
  coverImageUrl: z.string().url().optional(),
});

const createArcSchema = arcBaseSchema.extend({
  protagonist: characterSchema.optional(),
  loveInterest: characterSchema.optional(),
  creatureLore: creatureLoreSchema.optional(),
});

const updateArcSchema = arcBaseSchema.partial().strict();

// ============================================================
// CONSTANTS
// ============================================================

const FREE_TIER_ARC_LIMIT = 3;

// ============================================================
// APP
// ============================================================

export const arcsApp = new Hono<{ Variables: Variables }>();

// GET /arcs — list user's arcs
arcsApp.get('/', authMiddleware, async (c) => {
  const user = c.get('user');
  try {
    const arcs = await getArcs(user.id);
    return c.json({ arcs });
  } catch (err) {
    console.error('[arcs] GET / error:', err);
    return c.json(
      { error: 'internal_error', message: 'Failed to fetch arcs' },
      500,
    );
  }
});

// POST /arcs — create arc (check arc limit: free=3, pro=unlimited)
arcsApp.post('/', authMiddleware, validate(createArcSchema), async (c) => {
  const user = c.get('user');
  const body = c.req.valid('json');

  try {
    const profile = await getProfile(user.id);
    if (profile.subscriptionTier !== 'pro') {
      const count = await getArcCount(user.id);
      if (count >= FREE_TIER_ARC_LIMIT) {
        return c.json(
          {
            error: 'arc_limit_reached',
            message: 'Free accounts can have up to 3 arcs. Upgrade to Pro for unlimited arcs.',
          },
          429,
        );
      }
    }

    const input: CreateArcInput = {
      userId: user.id,
      title: body.title,
      creatureType: body.creatureType as CreateArcInput['creatureType'],
      arcType: body.arcType as CreateArcInput['arcType'],
      themes: body.themes,
      defaultSpiceLevel: body.defaultSpiceLevel,
      povMode: body.povMode as CreateArcInput['povMode'],
      tense: body.tense as CreateArcInput['tense'],
      narrativeDistance: body.narrativeDistance as CreateArcInput['narrativeDistance'],
      readingLevel: body.readingLevel as CreateArcInput['readingLevel'],
      dialogueRatioPct: body.dialogueRatioPct,
      hookDensity: body.hookDensity as CreateArcInput['hookDensity'],
      pacingRhythm: body.pacingRhythm as CreateArcInput['pacingRhythm'],
      sceneCountDefault: body.sceneCountDefault,
      atmosphereArchetype: body.atmosphereArchetype,
      defaultSensePrimary: body.defaultSensePrimary as CreateArcInput['defaultSensePrimary'],
      defaultSenseSecondary:
        body.defaultSenseSecondary as CreateArcInput['defaultSenseSecondary'],
      recurringMotif: body.recurringMotif,
      genreBlendPrimary: body.genreBlendPrimary as CreateArcInput['genreBlendPrimary'],
      genreBlendSecondary:
        body.genreBlendSecondary as CreateArcInput['genreBlendSecondary'],
      genreBlendRatio: body.genreBlendRatio,
      toneAllowance: body.toneAllowance as CreateArcInput['toneAllowance'],
      isQuickStart: body.isQuickStart,
      coverImageUrl: body.coverImageUrl,
    };

    const arc = await createArc(input, user.id);

    // Post-insert cap enforcement (M5 — handles TOCTOU race condition)
    // If concurrent requests both passed the pre-check, one will be rolled back here.
    if (profile.subscriptionTier !== 'pro') {
      const finalCount = await getArcCount(user.id);
      if (finalCount > FREE_TIER_ARC_LIMIT) {
        await deleteArc(arc.id, user.id);
        return c.json(
          { error: 'arc_limit_reached', message: 'Arc limit reached. Upgrade to Pro for unlimited arcs.' },
          429,
        );
      }
    }

    // Insert optional protagonist, love interest, and creature lore
    const insertPromises: Promise<unknown>[] = [];

    if (body.protagonist) {
      insertPromises.push(createCharacter({
        arcId: arc.id,
        slug: 'PROTAGONIST',
        displayName: body.protagonist.displayName,
        species: body.protagonist.species ?? 'human',
        isProtagonist: true,
        statedDesire: body.protagonist.statedDesire,
        hiddenNeed: body.protagonist.hiddenNeed,
        wound: body.protagonist.wound,
        flaw: body.protagonist.flaw,
        lie: body.protagonist.lie,
        bio: '',
        appearance: '',
        vocabRegister: 'neutral',
      }));
    }

    if (body.loveInterest) {
      insertPromises.push(createCharacter({
        arcId: arc.id,
        slug: 'LOVE_INTEREST',
        displayName: body.loveInterest.displayName,
        species: body.loveInterest.species ?? 'human',
        isProtagonist: false,
        statedDesire: body.loveInterest.statedDesire,
        hiddenNeed: body.loveInterest.hiddenNeed,
        wound: body.loveInterest.wound,
        flaw: body.loveInterest.flaw,
        lie: body.loveInterest.lie,
        bio: '',
        appearance: '',
        vocabRegister: 'neutral',
      }));
    }

    if (body.creatureLore) {
      insertPromises.push(
        adminClient.from('creature_lore').insert({
          arc_id: arc.id,
          creature_type: body.creatureType as 'vampire' | 'werewolf' | 'fairy',
          rules: body.creatureLore.rules ?? [],
          weaknesses: body.creatureLore.weaknesses ?? [],
          abilities: body.creatureLore.abilities ?? [],
          society_notes: body.creatureLore.societyNotes ?? '',
          custom_fields: {},
        }).then(({ error }) => {
          if (error) throw new Error(`Failed to insert creature lore: ${error.message}`);
        }),
      );
    }

    await Promise.all(insertPromises);

    return c.json({ arc }, 201);
  } catch (err) {
    console.error('[arcs] POST / error:', err);
    return c.json({ error: 'internal_error', message: 'Failed to create arc' }, 500);
  }
});

// GET /arcs/:id — get single arc
arcsApp.get('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const arcId = c.req.param('id');

  try {
    const arc = await getArc(arcId, user.id);
    return c.json({ arc });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Arc not found';
    return c.json({ error: 'not_found', message }, 404);
  }
});

// PATCH /arcs/:id — update arc
arcsApp.patch('/:id', authMiddleware, validate(updateArcSchema), async (c) => {
  const user = c.get('user');
  const arcId = c.req.param('id');
  const body = c.req.valid('json');

  try {
    const patch: UpdateArcInput = {
      title: body.title,
      creatureType: body.creatureType as UpdateArcInput['creatureType'],
      arcType: body.arcType as UpdateArcInput['arcType'],
      themes: body.themes,
      defaultSpiceLevel: body.defaultSpiceLevel,
      povMode: body.povMode as UpdateArcInput['povMode'],
      tense: body.tense as UpdateArcInput['tense'],
      narrativeDistance: body.narrativeDistance as UpdateArcInput['narrativeDistance'],
      readingLevel: body.readingLevel as UpdateArcInput['readingLevel'],
      dialogueRatioPct: body.dialogueRatioPct,
      hookDensity: body.hookDensity as UpdateArcInput['hookDensity'],
      pacingRhythm: body.pacingRhythm as UpdateArcInput['pacingRhythm'],
      sceneCountDefault: body.sceneCountDefault,
      atmosphereArchetype: body.atmosphereArchetype,
      defaultSensePrimary: body.defaultSensePrimary as UpdateArcInput['defaultSensePrimary'],
      defaultSenseSecondary:
        body.defaultSenseSecondary as UpdateArcInput['defaultSenseSecondary'],
      recurringMotif: body.recurringMotif,
      genreBlendPrimary: body.genreBlendPrimary as UpdateArcInput['genreBlendPrimary'],
      genreBlendSecondary:
        body.genreBlendSecondary as UpdateArcInput['genreBlendSecondary'],
      genreBlendRatio: body.genreBlendRatio,
      toneAllowance: body.toneAllowance as UpdateArcInput['toneAllowance'],
      isQuickStart: body.isQuickStart,
      coverImageUrl: body.coverImageUrl,
    };

    const arc = await updateArc(arcId, patch, user.id);
    return c.json({ arc });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Arc not found';
    const isNotFound =
      message.includes('not found') || message.includes('does not belong');
    return c.json(
      { error: isNotFound ? 'not_found' : 'internal_error', message },
      isNotFound ? 404 : 500,
    );
  }
});

// DELETE /arcs/:id — delete arc
arcsApp.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const arcId = c.req.param('id');

  try {
    await deleteArc(arcId, user.id);
    return c.json({ deleted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete arc';
    return c.json({ error: 'internal_error', message }, 500);
  }
});
