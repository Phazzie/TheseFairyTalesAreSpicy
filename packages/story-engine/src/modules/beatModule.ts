import type { ArcContext, GenerationInput } from '../types/index.js';
import { selectBeat } from '../selectors/selectBeat.js';

interface BeatStructure {
  code: string;
  name: string;
  progression: string[];
  spiceNote: string;
  antiPatterns: string[];
}

export function beatModule(input: GenerationInput, context: ArcContext, preSelectedBeat?: BeatStructure): string {
  const beat = preSelectedBeat ?? selectBeat(
    context.arc.arcType,
    context.recentChapterMetadata,
    input.pilotMode,
  );

  if (!beat) {
    return `STORY STRUCTURE:\nBuild this chapter with a clear emotional arc: establish situation, introduce complication, escalate tension, end on a note that demands the next chapter be read.`;
  }

  const lines: string[] = [];
  lines.push(`Beat: ${beat.name}`);
  lines.push('');
  lines.push('Progression (follow this sequence):');
  beat.progression.forEach((step: string, index: number) => {
    lines.push(`  ${index + 1}. ${step.replace(/_/g, ' ')}`);
  });
  lines.push('');
  lines.push(`Spice Note: ${beat.spiceNote}`);
  lines.push('');
  lines.push('Anti-Patterns (avoid these):');
  beat.antiPatterns.forEach((pattern: string) => {
    lines.push(`  - ${pattern}`);
  });

  return `STORY STRUCTURE:\n${lines.join('\n')}`;
}
