import type { GenerationInput } from '../types/index.js';

export function assembleUserPrompt(input: GenerationInput): string {
  const wordCount = input.wordCountOverride ?? 1500;
  const parts: string[] = [
    `Write chapter ${input.chapterNumber} of this supernatural romance serial.`,
    `Target word count: ${wordCount} words.`,
    `Begin your response with: TITLE: [your chapter title here]`,
    `Then write the chapter text.`,
    `End the chapter on a cliffhanger that makes the reader immediately want chapter ${input.chapterNumber + 1}.`,
  ];

  if (input.userCreativeDirection) {
    parts.push(`\nCREATIVE DIRECTION FROM THE AUTHOR:\n${input.userCreativeDirection}`);
  }

  return parts.join('\n');
}
