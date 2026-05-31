import type { ArcContext, GenerationInput, CharacterProfile, ChapterMetadata } from '../types/index.js';

function sanitizeForPrompt(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\[SYSTEM\]/gi, '[USER-NOTE]')
    .replace(/IGNORE.{0,50}INSTRUCTIONS/gi, '[filtered]')
    .replace(/IGNORE.{0,50}PREVIOUS/gi, '[filtered]');
}

function formatCharacter(char: CharacterProfile): string {
  const lines: string[] = [];
  lines.push(`Name: ${sanitizeForPrompt(char.displayName)} (${char.slug})`);
  lines.push(`Species: ${char.species}`);
  lines.push(`Role: ${char.isProtagonist ? 'Protagonist' : 'Supporting'}`);
  lines.push(`Apparent Age: ${char.apparentAge}${char.trueAge !== char.apparentAge ? ` (true age: ${char.trueAge})` : ''}`);

  if (char.contradiction) {
    lines.push(`${sanitizeForPrompt(char.displayName)} says she wants: ${sanitizeForPrompt(char.contradiction.statedDesire)}`);
    lines.push(`${sanitizeForPrompt(char.displayName)} actually needs: ${sanitizeForPrompt(char.contradiction.hiddenNeed)}`);
    lines.push(`CRITICAL: Never let ${sanitizeForPrompt(char.displayName)} state this need directly, and never have another character correctly diagnose it to her face. Show it through behavior, micro-decisions, what she avoids, what she can't help doing.`);
  }

  if (char.wound) {
    lines.push(`Wound (shapes all behavior — do not state it directly): ${sanitizeForPrompt(char.wound)}`);
  }

  if (char.flaw) {
    lines.push(`Active flaw (creates conflict — show through action, never explain): ${sanitizeForPrompt(char.flaw)}`);
  }

  if (char.lie) {
    lines.push(`The lie she believes (drives her wrong choices — the reader sees it, she doesn't): ${sanitizeForPrompt(char.lie)}`);
  }

  lines.push(`Appearance: ${sanitizeForPrompt(char.appearance)}`);
  lines.push(`Bio: ${sanitizeForPrompt(char.bio)}`);

  if (char.speech?.verbalTic) {
    lines.push(`Verbal tic: ${sanitizeForPrompt(char.speech.verbalTic)}`);
  }

  if (char.speech?.signaturePhrase) {
    lines.push(`Signature phrase: ${sanitizeForPrompt(char.speech.signaturePhrase)}`);
  }

  return lines.join('\n');
}

function getChemistryContext(chapterNumber: number, recentMetadata?: ChapterMetadata[]): string {
  // Count approximate intimacy level from recent spice used
  const _avgSpice =
    recentMetadata && recentMetadata.length > 0
      ? recentMetadata.reduce((sum, m) => sum + m.spiceLevelUsed, 0) / recentMetadata.length
      : 1;

  if (chapterNumber <= 2) {
    return "RELATIONSHIP STAGE: First encounter territory. Physical awareness only — no shared history yet. Every glance is loaded but nothing has happened. Restraint is maximum.";
  } else if (chapterNumber <= 5) {
    return "RELATIONSHIP STAGE: Early tension. They have been in each other's presence. A moment or two of charged contact. Neither has acted on it deliberately. The unspoken is the whole story.";
  } else if (chapterNumber <= 10) {
    return "RELATIONSHIP STAGE: Something has shifted. There is a history now — a phrase remembered, a touch that went too far or not far enough. They are calibrating against each other.";
  } else if (chapterNumber <= 16) {
    return "RELATIONSHIP STAGE: Deep entanglement. They know things about each other that cannot be unknown. The question is no longer whether — it's what price, and who pays it.";
  } else {
    return "RELATIONSHIP STAGE: Convergence territory. Everything that was withheld is now on the table or moments from being on the table. The arc is completing.";
  }
}

export function characterModule(input: GenerationInput, context: ArcContext): string {
  if (!context.characters || context.characters.length === 0) {
    return '';
  }

  const parts: string[] = [];
  const formatted = context.characters.map((char) => formatCharacter(char)).join('\n\n---\n\n');
  parts.push(`CHARACTER PROFILES:\n${formatted}`);

  if (input.chapterNumber) {
    const chemContext = getChemistryContext(input.chapterNumber, context.recentChapterMetadata);
    parts.push(`\n${chemContext}`);
  }

  return parts.join('');
}
