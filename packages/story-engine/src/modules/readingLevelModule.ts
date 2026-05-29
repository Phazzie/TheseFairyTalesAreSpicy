import type { ArcContext, GenerationInput } from '../types/index.js';

const readingLevelInstructions: Record<string, string> = {
  accessible:
    'Vocabulary: everyday English, sentences 10-20 words average. No literary allusions. Direct emotional language. Think bestselling paperback.',
  commercial:
    'Vocabulary: conversational, punchy, relatable. Short paragraphs. Dialogue-forward. Think: texting your best friend about what happened.',
  elevated:
    'Vocabulary: rich and precise. Sentences vary dramatically in length. Literary allusions welcome. Think: Donna Tartt or Anne Rice.',
  archaic:
    'Vocabulary: formal and period-appropriate. Thee/thou only if historical setting warrants. Ornate but never inaccessible.',
};

export function readingLevelModule(input: GenerationInput, context: ArcContext): string {
  const instruction =
    readingLevelInstructions[context.arc.readingLevel] ??
    readingLevelInstructions['commercial'];

  return `READING LEVEL:\n${instruction}`;
}
