import { Hono } from 'hono';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { authMiddleware, type Variables } from '../middleware/auth.js';
import {
  assembleContinuationPrompt,
  assembleUserPrompt,
  generateTitleFromResponse,
  stripSpeakerTags,
  detectCliffhanger,
  measureDialogueRatio,
  formatMarkdown,
  selectChekhovElements,
  type ContinuationInput,
} from '@story/engine';
import { assembleArcContext } from '../db/continuityInjector.js';
import { getProfile, incrementGenerationCount, resetGenerationCountIfExpired } from '../db/profiles.js';
import { getChapter, saveChapter, getChaptersByArc } from '../db/chapters.js';
import { createThread } from '../db/plotThreads.js';
import { saveSummary } from '../db/arcSummaries.js';
import { generateStoryStreaming, generateSummary } from '../clients/grok.js';

export const config = { runtime: 'edge' };

const continueSchema = z.object({
  arcId: z.string().uuid(),
  chapterNumber: z.number().int().positive(),
  priorChapterId: z.string().uuid(),
  spiceLevelOverride: z.number().min(1).max(5).optional(),
  emotionalArcOverride: z.string().optional(),
  cliffhangerTypeOverride: z.string().optional(),
  wordCountOverride: z.number().min(200).max(5000).optional(),
  userCreativeDirection: z.string().max(500).optional(),
  pilotMode: z.boolean().optional(),
});

export const continueApp = new Hono<{ Variables: Variables }>();

continueApp.post('/', authMiddleware, validate(continueSchema), async (c) => {
  const user = c.get('user');
  const body = c.req.valid('json');

  // 1. Check subscription tier and generation limit (count only, do NOT increment yet)
  await resetGenerationCountIfExpired(user.id);
  const profile = await getProfile(user.id);
  const limit = profile.subscriptionTier === 'pro' ? -1 : 10; // -1 = unlimited
  // Pre-check: if limit is not unlimited, verify the user has remaining quota without incrementing
  if (limit !== -1 && profile.monthlyGenerationCount >= limit) {
    return c.json(
      {
        error: 'generation_limit_reached',
        message: `You've reached your monthly generation limit. Upgrade to Pro for unlimited generations.`,
      },
      429,
    );
  }

  // 2. Load prior chapter to extract its engine version and system prompt
  let priorChapter;
  try {
    priorChapter = await getChapter(body.priorChapterId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Prior chapter not found';
    return c.json({ error: 'not_found', message }, 404);
  }

  // Verify prior chapter belongs to the arc being continued
  if (priorChapter.arcId !== body.arcId) {
    return c.json(
      { error: 'not_found', message: 'Prior chapter does not belong to this arc' },
      404,
    );
  }

  // 3. Assemble ArcContext (verifies ownership)
  let arcContext;
  try {
    arcContext = await assembleArcContext(body.arcId, user.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Arc not found';
    return c.json({ error: 'not_found', message }, 404);
  }

  // 4. Build continuation input (extends GenerationInput with prior chapter data)
  const input: ContinuationInput = {
    arcId: body.arcId,
    chapterNumber: body.chapterNumber,
    priorChapterId: body.priorChapterId,
    priorChapterEngineVersion: priorChapter.engineVersion,
    priorSystemPrompt: priorChapter.systemPromptUsed ?? '',
    spiceLevelOverride: body.spiceLevelOverride as ContinuationInput['spiceLevelOverride'],
    emotionalArcOverride: body.emotionalArcOverride as ContinuationInput['emotionalArcOverride'],
    cliffhangerTypeOverride:
      body.cliffhangerTypeOverride as ContinuationInput['cliffhangerTypeOverride'],
    wordCountOverride: body.wordCountOverride,
    userCreativeDirection: body.userCreativeDirection,
    pilotMode: body.pilotMode,
  };

  // 5. Assemble continuation system prompt
  let assembled;
  try {
    assembled = assembleContinuationPrompt(input, arcContext);
  } catch (err) {
    if (err instanceof Error && err.name === 'ContextOverflowError') {
      return c.json({ error: 'context_overflow', message: err.message }, 422);
    }
    throw err;
  }

  const userPrompt = assembleUserPrompt(input);

  // 6. Stream from Grok
  let stream: ReadableStream<string>;
  try {
    stream = await generateStoryStreaming(assembled.prompt, userPrompt);
  } catch (err) {
    console.error('[continue] Grok streaming failed:', err);
    return c.json({ error: 'internal_error', message: 'Generation failed. Please try again.' }, 500);
  }

  // 7. Collect full text + stream to client simultaneously via SSE
  let fullText = '';
  const encoder = new TextEncoder();

  const responseStream = new ReadableStream({
    async start(controller) {
      const reader = stream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += value;
          // Send SSE event
          const sseEvent = `data: ${JSON.stringify({ type: 'token', content: value })}\n\n`;
          controller.enqueue(encoder.encode(sseEvent));
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

        // Save chapter to DB (new chapter, generationAttempt: 1)
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
          status: 'published' as const,
          generationAttempt: 1,
          droppedModules: assembled.droppedModules,
          systemPromptUsed: assembled.prompt,
        });

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

        // Increment generation count only after successful chapter save
        await incrementGenerationCount(user.id, limit);

        // Send completion event with metadata
        const completionEvent = `data: ${JSON.stringify({
          type: 'complete',
          chapterId,
          title,
          cliffhangerType,
          wordCount: displayText.split(/\s+/).length,
          droppedModules: assembled.droppedModules,
        })}\n\n`;
        controller.enqueue(encoder.encode(completionEvent));
        controller.close();

        // Non-blocking: generate rolling summary if due
        const shouldSummarize = body.chapterNumber % 5 === 0;
        if (shouldSummarize) {
          void generateRollingSummary(body.arcId, body.chapterNumber).catch((err) => {
            console.error('[continue] Rolling summary failed:', err);
          });
        }
      } catch (err) {
        console.error('[continue] Stream processing error:', err);
        const errorEvent = `data: ${JSON.stringify({
          type: 'error',
          message: 'Generation failed mid-stream',
        })}\n\n`;
        controller.enqueue(encoder.encode(errorEvent));
        controller.close();
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
