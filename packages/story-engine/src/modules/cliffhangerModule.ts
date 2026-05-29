import type { ArcContext, GenerationInput } from '../types/index.js';
import cliffhangerData from '../data/cliffhangerTypes.json';

type CliffhangerEntry = {
  code: string;
  label: string;
  exampleSentence: string;
  intensity: number;
  craftNote?: string;
  commonMistake?: string;
};

export function cliffhangerModule(input: GenerationInput, context: ArcContext): string {
  if (!input.cliffhangerTypeOverride || input.cliffhangerTypeOverride === 'none') {
    return '';
  }

  const cliffhanger = (cliffhangerData as CliffhangerEntry[]).find(
    (c) => c.code === input.cliffhangerTypeOverride
  );

  if (!cliffhanger) return '';

  const lines = [
    `CLIFFHANGER TYPE: ${cliffhanger.label}`,
    `The chapter must end with a "${cliffhanger.label}" cliffhanger.`,
    `Example register: "${cliffhanger.exampleSentence}"`,
  ];

  if (cliffhanger.craftNote) {
    lines.push(`Craft note: ${cliffhanger.craftNote}`);
  }
  if (cliffhanger.commonMistake) {
    lines.push(`Avoid: ${cliffhanger.commonMistake}`);
  }

  return lines.join('\n');
}
