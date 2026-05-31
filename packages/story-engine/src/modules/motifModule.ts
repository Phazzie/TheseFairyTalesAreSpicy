import type { ArcContext, GenerationInput } from '../types/index.js';

function sanitizeForPrompt(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\[SYSTEM\]/gi, '[USER-NOTE]')
    .replace(/IGNORE.{0,50}INSTRUCTIONS/gi, '[filtered]')
    .replace(/IGNORE.{0,50}PREVIOUS/gi, '[filtered]');
}

export function motifModule(input: GenerationInput, context: ArcContext): string {
  if (!context.arc.recurringMotif) {
    return '';
  }

  const motif = sanitizeForPrompt(context.arc.recurringMotif);

  return `RECURRING MOTIF:\nWeave ${motif} into this chapter organically — in an object, image, or moment. Do not force it. One appearance is enough.`;
}
