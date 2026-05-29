import { Hono } from 'hono';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { authMiddleware, type Variables } from '../middleware/auth.js';
import {
  assembleSystemPrompt,
  assembleUserPrompt,
  generateTitleFromResponse,
  stripSpeakerTags,
  detectCliffhanger,
  measureDialogueRatio,
  formatMarkdown,
  selectChekhovElements,
  type GenerationInput,
} from '@story/engine';
import { assembleArcContext } from '../db/continuityInjector.js';
import { getProfile, tryReserveGenerationSlot, refundGenerationSlot, resetGenerationCountIfExpired } from '../db/profiles.js';
import { saveChapter, publishChapter, getChaptersByArc } from '../db/chapters.js';
import { createThread } from '../db/plotThreads.js';
import { saveSummary } from '../db/arcSummaries.js';
import { generateStoryStreaming, generateSummary } from '../clients/grok.js';

export const config = { runtime: 'edge' };

const generateSchema = z.object({
  arcId: z.string().uuid(),
  chapterNumber: z.number().int().positive(),
  spiceLevelOverride: z.number().min(1).max(5).optional(),
  emotionalArcOverride: z.string().optional(),
  cliffhangerTypeOverride: z.string().optional(),
  wordCountOverride: z.number().min(200).max(5000).optional(),
  userCreativeDirection: z.string().max(200).optional(),
  pilotMode: z.boolean().optional(),
});

export const generateApp = new Hono<{ Variables: Variables }>();

generateApp.post('/', authMiddleware, validate(generateSchema), async (c) => {
  const user = c.get('user');
  const body = c.req.valid('json');

  // 1. Check subscription tier and atomically reserve a generation slot (M4/M5 — TOCTOU fix)
  await resetGenerationCountIfExpired(user.id);
  const profile = await getProfile(user.id);
  const limit = profile.subscriptionTier === 'pro' ? -1 : 10; // -1 = unlimited
  const slotReserved = await tryReserveGenerationSlot(user.id, limit);
  if (!slotReserved) {
    return c.json(
      {
        error: 'generation_limit_reached',
        message: `You've reached your monthly generation limit. Upgrade to Pro for unlimited generations.`,
      },
      429,
    );
  }

  // 2. Assemble ArcContext (verifies ownership)
  let arcContext;
  try {
    arcContext = await assembleArcContext(body.arcId, user.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Arc not found';
    return c.json({ error: 'not_found', message }, 404);
  }

  // 3. Build generation input
  const input: GenerationInput = {
    arcId: body.arcId,
    chapterNumber: body.chapterNumber,
    spiceLevelOverride: body.spiceLevelOverride as GenerationInput['spiceLevelOverride'],
    emotionalArcOverride: body.emotionalArcOverride as GenerationInput['emotionalArcOverride'],
    cliffhangerTypeOverride:
      body.cliffhangerTypeOverride as GenerationInput['cliffhangerTypeOverride'],
    wordCountOverride: body.wordCountOverride,
    userCreativeDirection: body.userCreativeDirection,
    pilotMode: body.pilotMode,
  };

  // 4. Assemble system prompt
  let assembled;
  try {
    assembled = assembleSystemPrompt(input, arcContext);
  } catch (err) {
    if (err instanceof Error && err.name === 'ContextOverflowError') {
      return c.json({
        error: 'context_overflow',
        message: 'Your story\'s world has grown too rich for a single generation. Try archiving some world notes or starting a fresh arc.',
      }, 422);
    }
    throw err;
  }

  const userPrompt = assembleUserPrompt(input);

  // 5. Stream from Grok
  let stream: ReadableStream<string>;
  try {
    stream = await generateStoryStreaming(assembled.prompt, userPrompt);
  } catch (err) {
    console.error('[generate] Grok streaming failed:', err);
    return c.json({ error: 'internal_error', message: 'Generation failed. Please try again.' }, 500);
  }

  // 6. Collect full text + stream to client simultaneously via SSE
  let fullText = '';
  const encoder = new TextEncoder();

  const responseStream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const safeClose = () => { if (!closed) { closed = true; controller.close(); } };
      const safeEnqueue = (data: Uint8Array) => { if (!closed) controller.enqueue(data); };

      // Keepalive: send an SSE comment every 15 s so NAT gateways don't kill
      // idle TCP connections on cellular networks during long Grok pauses.
      let keepaliveInterval: ReturnType<typeof setInterval> | null = null;
      keepaliveInterval = setInterval(() => {
        safeEnqueue(encoder.encode(': keepalive\n\n'));
      }, 15000);

      const reader = stream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += value;
          // Send SSE event
          const sseEvent = `data: ${JSON.stringify({ type: 'token', content: value })}\n\n`;
          safeEnqueue(encoder.encode(sseEvent));
        }

        // Post-process
        const { title, cleanedText } = generateTitleFromResponse(fullText);
        const displayText = formatMarkdown(stripSpeakerTags(cleanedText));
        const dialogueRatio = measureDialogueRatio(cleanedText);
        const cliffhangerType = detectCliffhanger(cleanedText);

        // Select Chekhov elements for plot threads
        const chekhovElements = selectChekhovElements(
          arcContext.arc.creatureType,
          arcContext.plotThreads,
        );

        // Save chapter to DB
        const spiceUsed = (
          input.spiceLevelOverride ?? arcContext.arc.defaultSpiceLevel
        ) as 1 | 2 | 3 | 4 | 5;
        const { id: chapterId } = await saveChapter({
          arcId: body.arcId,
          chapterNumber: body.chapterNumber,
          title,
          content: displayText,
          wordCount: displayText.split(/\s+/).length,
          beatUsed: assembled.beatUsed,
          emotionalArc: input.emotionalArcOverride ?? 'desire_to_denial',
          dialogueRatioPct: dialogueRatio,
          chekhovSeeded: chekhovElements.map((e) => e.id),
          cliffhangerType,
          spiceLevelUsed: spiceUsed,
          engineVersion: assembled.engineVersion,
          status: 'draft' as const,
          generationAttempt: 1,
          droppedModules: assembled.droppedModules,
          systemPromptUsed: assembled.prompt,
        });
        // Atomically archive any prior published chapter and publish this one
        await publishChapter(chapterId);

        // Create plot threads for seeded Chekhov elements
        await Promise.all(
          chekhovElements.map((el) =>
            createThread({
              arcId: body.arcId,
              threadType: 'chekhov' as const,
              description: el.element,
              plantedInChapter: body.chapterNumber,
            }),
          ),
        );

        // Slot was already incremented atomically before Grok call — no further increment needed.

        // Send completion event with metadata
        const completionEvent = `data: ${JSON.stringify({
          type: 'complete',
          chapterId,
          title,
          cliffhangerType,
          wordCount: displayText.split(/\s+/).length,
          droppedModules: assembled.droppedModules,
        })}\n\n`;
        safeEnqueue(encoder.encode(completionEvent));

        // Non-blocking: generate rolling summary if due
        const shouldSummarize = body.chapterNumber % 5 === 0;
        if (shouldSummarize) {
          // Fire and forget — errors don't affect the response
          void generateRollingSummary(body.arcId, body.chapterNumber).catch((err) => {
            console.error('[generate] Rolling summary failed:', err);
          });
        }
      } catch (err) {
        console.error('[generate] Stream processing error:', err);
        // Refund the reserved slot since generation did not complete successfully
        void refundGenerationSlot(user.id).catch(e => console.error('[generate] Failed to refund slot:', e));
        const errorEvent = `data: ${JSON.stringify({
          type: 'error',
          message: 'Generation failed mid-stream',
        })}\n\n`;
        safeEnqueue(encoder.encode(errorEvent));
      } finally {
        if (keepaliveInterval) clearInterval(keepaliveInterval);
        safeClose();
      }
    },
  });

  return new Response(responseStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
});

async function generateRollingSummary(arcId: string, chapterMilestone: number): Promise<void> {
  const chapters = await getChaptersByArc(arcId);
  const recentChapters = chapters.slice(-5);
  if (recentChapters.length === 0) return;
  const chaptersText = recentChapters
    .map((ch) => `Chapter ${ch.chapterNumber}:\n${ch.content}`)
    .join('\n\n---\n\n');
  const summaryText = await generateSummary(chaptersText);
  if (summaryText) {
    await saveSummary(arcId, chapterMilestone, summaryText);
  }
}
