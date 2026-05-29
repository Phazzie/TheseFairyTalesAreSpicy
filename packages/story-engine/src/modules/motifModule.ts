import type { ArcContext, GenerationInput } from '../types/index.js';

export function motifModule(input: GenerationInput, context: ArcContext): string {
  if (!context.arc.recurringMotif) {
    return '';
  }

  const motif = context.arc.recurringMotif;

  return `RECURRING MOTIF:\nWeave ${motif} into this chapter organically — in an object, image, or moment. Do not force it. One appearance is enough.`;
}
