import type { ArcContext, GenerationInput, CharacterProfile } from '../types/index.js';

function formatCharacterTags(char: CharacterProfile): string {
  const lines: string[] = [];
  lines.push(`  ${char.slug}:`);

  if (char.emotionStates && char.emotionStates.length > 0) {
    for (const emotion of char.emotionStates) {
      lines.push(`    [${char.slug}:${emotion.id}] — ${emotion.label}`);
    }
  } else {
    // Provide a default set of emotion tag IDs even if no states defined
    const defaultEmotions = ['neutral', 'desire', 'anger', 'grief', 'command'];
    for (const emotion of defaultEmotions) {
      lines.push(`    [${char.slug}:${emotion}]`);
    }
  }

  return lines.join('\n');
}

export function speakerTagModule(input: GenerationInput, context: ArcContext): string {
  if (!context.characters || context.characters.length === 0) {
    return '';
  }

  const lines: string[] = [];
  lines.push(
    'When a character speaks, precede their dialogue with a speaker tag: [CHARACTER_SLUG:EMOTION_ID]',
  );
  lines.push('');
  lines.push('Example: [ELENA:dark_desire]"You shouldn\'t be here," she said.');
  lines.push('');
  lines.push('Available tags:');

  for (const char of context.characters) {
    lines.push(formatCharacterTags(char));
  }

  lines.push('');
  lines.push(
    'Use these tags consistently — they drive the audio narration pipeline.',
  );

  return `SPEAKER TAG FORMAT:\n${lines.join('\n')}`;
}
