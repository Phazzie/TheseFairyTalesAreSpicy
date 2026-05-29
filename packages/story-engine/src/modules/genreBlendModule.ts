import type { ArcContext, GenerationInput, GenreBlendPrimary } from '../types/index.js';

const genreToneNotes: Record<GenreBlendPrimary, string> = {
  romance:
    'Tone note: Emotional journey first. Every scene — including action, revelation, and danger — filters through the primary question of what these two people mean to each other.',
  horror:
    'Tone note: Dread as undertone. The threat is real and the reader should feel it, even in tender scenes. Fear and desire are not opposites at this register — they are the same sensation.',
  mystery:
    'Tone note: Withhold information deliberately. The reader should always be slightly behind the story. Every answer raises a larger question. Trust the reader to be curious without spelling out what they should wonder.',
  thriller:
    'Tone note: Stakes are external and immediate. The clock is always running. Even intimate scenes should carry awareness of the larger threat. Safety is temporary and everyone knows it.',
  fantasy:
    'Tone note: The rules of this world have genuine weight. Magic, power, and supernatural law shape every choice. World-building details should feel earned and specific, not decorative.',
};

export function genreBlendModule(input: GenerationInput, context: ArcContext): string {
  const primary = context.arc.genreBlendPrimary;
  const secondary = context.arc.genreBlendSecondary;
  const ratio = context.arc.genreBlendRatio;

  const lines: string[] = [];

  if (secondary) {
    const secondaryRatio = 100 - ratio;
    lines.push(`Genre: ${ratio}% ${primary}, ${secondaryRatio}% ${secondary}`);
  } else {
    lines.push(`Genre: ${primary}`);
  }

  lines.push('');

  const toneNote = genreToneNotes[primary];
  if (toneNote) {
    lines.push(toneNote);
  }

  if (secondary && secondary !== primary) {
    const secondaryTone = genreToneNotes[secondary];
    if (secondaryTone) {
      lines.push('');
      lines.push(`Secondary genre note (${secondary}): ${secondaryTone}`);
    }
  }

  return `GENRE BLEND:\n${lines.join('\n')}`;
}
