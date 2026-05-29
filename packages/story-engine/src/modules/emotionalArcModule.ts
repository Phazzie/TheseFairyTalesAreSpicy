import type { ArcContext, GenerationInput } from '../types/index.js';
import emotionalArcData from '../data/emotionalArcTypes.json';

type EmotionalArcEntry = {
  code: string;
  label: string;
  startState: string;
  endState: string;
  paceNote: string;
};

export function emotionalArcModule(input: GenerationInput, context: ArcContext): string {
  const arcCode = input.emotionalArcOverride;
  if (!arcCode) return '';

  const arc = (emotionalArcData as EmotionalArcEntry[]).find((a) => a.code === arcCode);
  if (!arc) return '';

  return [
    `EMOTIONAL ARC OF THIS CHAPTER:`,
    `The reader's emotional experience must travel from "${arc.startState}" to "${arc.endState}".`,
    `This is not the plot arc — it is the emotional journey underneath the events.`,
    `Pacing note: ${arc.paceNote}`,
  ].join('\n');
}
