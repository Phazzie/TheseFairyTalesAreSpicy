import type { ArcContext, AssembledPrompt, ContinuationInput } from '../types/index.js';
import { assembleSystemPrompt } from './systemPrompt.js';

export function assembleContinuationPrompt(
  input: ContinuationInput,
  context: ArcContext,
): AssembledPrompt {
  // Use the stored system prompt from the prior chapter as additional context
  // This maintains creative consistency regardless of engine updates
  const base = assembleSystemPrompt(input, context);

  let priorContext = '';
  if (input.priorSystemPrompt !== undefined) {
    if (input.priorSystemPrompt.trim().length === 0) {
      // Log a warning — empty system prompt means no prior context
      console.warn('[continuationPrompt] priorSystemPrompt is empty — prior chapter context omitted. This degrades story continuity.');
      // Don't add the PRIOR CHAPTER CONTEXT block — it would be empty and confusing
    } else {
      // Truncate to 2000 chars to keep continuation prompt within token budget
      const truncated = input.priorSystemPrompt.length > 2000
        ? input.priorSystemPrompt.substring(0, 2000)
        : input.priorSystemPrompt;
      priorContext = `\n\nPRIOR CHAPTER CONTEXT (from engine v${input.priorChapterEngineVersion}):\n${truncated}`;
    }
  }

  return {
    ...base,
    prompt: base.prompt + priorContext,
  };
}
