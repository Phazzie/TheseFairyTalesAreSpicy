import type { ArcContext, GenerationInput } from '../types/index.js';

export function arcContextModule(input: GenerationInput, context: ArcContext): string {
  const title = context.arc.title;
  const chapterNumber = input.chapterNumber;

  const lines: string[] = [];
  lines.push(`Chapter ${chapterNumber} of "${title}"`);

  if (context.rollingSummary) {
    lines.push('');
    lines.push('Story so far:');
    lines.push(context.rollingSummary.summaryText);
  }

  return `STORY CONTEXT:\n${lines.join('\n')}`;
}
