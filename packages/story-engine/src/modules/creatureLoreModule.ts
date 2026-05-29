import type { ArcContext, GenerationInput } from '../types/index.js';

export function creatureLoreModule(input: GenerationInput, context: ArcContext): string {
  const lore = context.creatureLore;
  if (
    (!lore.rules || lore.rules.length === 0) &&
    (!lore.weaknesses || lore.weaknesses.length === 0) &&
    (!lore.abilities || lore.abilities.length === 0)
  ) {
    return '';
  }

  const lines: string[] = [];
  let ruleIndex = 1;

  if (lore.rules && lore.rules.length > 0) {
    lines.push('Rules:');
    for (const rule of lore.rules) {
      lines.push(`  ${ruleIndex}. ${rule}`);
      ruleIndex++;
    }
  }

  if (lore.weaknesses && lore.weaknesses.length > 0) {
    lines.push('Weaknesses:');
    let weaknessIndex = 1;
    for (const weakness of lore.weaknesses) {
      lines.push(`  ${weaknessIndex}. ${weakness}`);
      weaknessIndex++;
    }
  }

  if (lore.abilities && lore.abilities.length > 0) {
    lines.push('Abilities:');
    let abilityIndex = 1;
    for (const ability of lore.abilities) {
      lines.push(`  ${abilityIndex}. ${ability}`);
      abilityIndex++;
    }
  }

  if (lore.societyNotes) {
    lines.push(`Society: ${lore.societyNotes}`);
  }

  const customKeys = Object.keys(lore.customFields ?? {});
  if (customKeys.length > 0) {
    for (const key of customKeys) {
      lines.push(`${key}: ${lore.customFields[key]}`);
    }
  }

  return `WORLD RULES:\n${lines.join('\n')}`;
}
