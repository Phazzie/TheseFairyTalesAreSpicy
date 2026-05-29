import type { ArcContext, GenerationInput, CharacterProfile } from '../types/index.js';

function formatCharacter(char: CharacterProfile): string {
  const lines: string[] = [];
  lines.push(`Name: ${char.displayName} (${char.slug})`);
  lines.push(`Species: ${char.species}`);
  lines.push(`Role: ${char.isProtagonist ? 'Protagonist' : 'Supporting'}`);
  lines.push(`Apparent Age: ${char.apparentAge}${char.trueAge !== char.apparentAge ? ` (true age: ${char.trueAge})` : ''}`);

  if (char.contradiction) {
    lines.push(`Stated Desire: ${char.contradiction.statedDesire}`);
    lines.push(`Hidden Need: ${char.contradiction.hiddenNeed}`);
  }

  if (char.wound) {
    lines.push(`Wound: ${char.wound}`);
  }

  if (char.flaw) {
    lines.push(`Flaw: ${char.flaw}`);
  }

  if (char.lie) {
    lines.push(`Lie They Believe: ${char.lie}`);
  }

  lines.push(`Appearance: ${char.appearance}`);
  lines.push(`Bio: ${char.bio}`);

  return lines.join('\n');
}

export function characterModule(input: GenerationInput, context: ArcContext): string {
  if (!context.characters || context.characters.length === 0) {
    return '';
  }

  const formatted = context.characters.map((char) => formatCharacter(char)).join('\n\n---\n\n');

  return `CHARACTER PROFILES:\n${formatted}`;
}
