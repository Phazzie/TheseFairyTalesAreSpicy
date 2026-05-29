import type { ArcContext, GenerationInput, CharacterProfile } from '../types/index.js';

function formatCharacter(char: CharacterProfile): string {
  const lines: string[] = [];
  lines.push(`Name: ${char.displayName} (${char.slug})`);
  lines.push(`Species: ${char.species}`);
  lines.push(`Role: ${char.isProtagonist ? 'Protagonist' : 'Supporting'}`);
  lines.push(`Apparent Age: ${char.apparentAge}${char.trueAge !== char.apparentAge ? ` (true age: ${char.trueAge})` : ''}`);

  if (char.contradiction) {
    lines.push(`${char.displayName} says she wants: ${char.contradiction.statedDesire}`);
    lines.push(`${char.displayName} actually needs: ${char.contradiction.hiddenNeed}`);
    lines.push(`CRITICAL: Never let ${char.displayName} state this need directly, and never have another character correctly diagnose it to her face. Show it through behavior, micro-decisions, what she avoids, what she can't help doing.`);
  }

  if (char.wound) {
    lines.push(`Wound (shapes all behavior — do not state it directly): ${char.wound}`);
  }

  if (char.flaw) {
    lines.push(`Active flaw (creates conflict — show through action, never explain): ${char.flaw}`);
  }

  if (char.lie) {
    lines.push(`The lie she believes (drives her wrong choices — the reader sees it, she doesn't): ${char.lie}`);
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
