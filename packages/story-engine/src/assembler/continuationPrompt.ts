import type { ArcContext, AssembledPrompt, ContinuationInput } from '../types/index.js';
import { assembleSystemPrompt } from './systemPrompt.js';

export function assembleContinuationPrompt(
  input: ContinuationInput,
  context: ArcContext,
): AssembledPrompt {
  // Use the stored system prompt from the prior chapter as additional context
  // This maintains creative consistency regardless of engine updates
  const base = assembleSystemPrompt(input, context);

  const priorContext = input.priorSystemPrompt
    ? `\n\nPRIOR CHAPTER CONTEXT (from engine v${input.priorChapterEngineVersion}):\n${input.priorSystemPrompt.substring(0, 2000)}`
    : '';

  return {
    ...base,
    prompt: base.prompt + priorContext,
  };
}
