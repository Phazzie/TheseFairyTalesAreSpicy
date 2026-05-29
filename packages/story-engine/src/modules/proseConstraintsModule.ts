import type { ArcContext, GenerationInput, SpiceLevel } from '../types/index.js';
import bannedWordsData from '../data/bannedWords.json';

interface BannedWordsData {
  global: string[];
  rationale: string;
  perLevel: Record<string, string[]>;
  allowedExceptions: string[];
}

const bannedWords = bannedWordsData as BannedWordsData;

export function proseConstraintsModule(input: GenerationInput, context: ArcContext): string {
  const spiceLevel: SpiceLevel = input.spiceLevelOverride ?? context.arc.defaultSpiceLevel;
  const levelKey = String(spiceLevel);

  const globalBanned = bannedWords.global ?? [];
  const levelBanned = bannedWords.perLevel[levelKey] ?? [];

  const lines: string[] = [];

  lines.push('Banned Words & Phrases:');
  lines.push('  Global (all levels):');
  for (const word of globalBanned) {
    lines.push(`    - ${word}`);
  }

  if (levelBanned.length > 0) {
    lines.push(`  Level ${spiceLevel} specific additions:`);
    for (const word of levelBanned) {
      lines.push(`    - ${word}`);
    }
  }

  if (bannedWords.allowedExceptions && bannedWords.allowedExceptions.length > 0) {
    lines.push('  Allowed Exceptions:');
    for (const exception of bannedWords.allowedExceptions) {
      lines.push(`    - ${exception}`);
    }
  }

  lines.push('');
  lines.push('Show-Don\'t-Tell Mandate:');
  lines.push(
    '  Never state an emotion directly. Show what it produces: a physical response, a behavior, a thought that circles without landing. The reader should feel the emotion before they name it.',
  );

  const beatsThatSuitMoralDilemma = [
    'dark_temptation', 'fae_bargain', 'blood_oath', 'forbidden_threshold',
    'power_exchange', 'unraveling_control', 'reluctant_protector'
  ];

  const beatUsed = context.recentChapterMetadata?.[context.recentChapterMetadata.length - 1]?.beatUsed ?? '';
  const includeMoralDilemma =
    input.emotionalArcOverride?.includes('temptation') ||
    input.emotionalArcOverride?.includes('despair') ||
    beatsThatSuitMoralDilemma.some(beat => beatUsed?.includes(beat));

  if (includeMoralDilemma) {
    lines.push('');
    lines.push('Moral Dilemma Trigger:');
    lines.push(
      '  At approximately the 50% mark of this chapter, the protagonist faces a genuine ethical choice between two things she wants or between action and her values. She must choose — the scene does not let her off the hook.',
    );
  }

  return `PROSE CONSTRAINTS:\n${lines.join('\n')}`;
}
