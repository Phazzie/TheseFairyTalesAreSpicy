import type { ArcContext, GenerationInput } from '../types/index.js';
import { selectAuthorBlend } from '../selectors/selectAuthorBlend.js';

function getNarrativeFunction(voiceTags: string[]): string {
  const tags = voiceTags.map((t) => t.toLowerCase());

  const hasAny = (keywords: string[]) => keywords.some((kw) => tags.some((t) => t.includes(kw)));

  if (hasAny(['lyrical', 'brooding', 'introspective', 'poetic'])) {
    return "protagonist's internal voice and interiority";
  }
  if (hasAny(['dialogue', 'banter', 'witty', 'sharp'])) {
    return 'dialogue and character voice';
  }
  if (hasAny(['atmospheric', 'sensory', 'setting'])) {
    return 'setting description and atmosphere';
  }
  if (hasAny(['action', 'pacing', 'propulsive'])) {
    return 'action sequences and physical tension';
  }
  if (hasAny(['political', 'scheming', 'menace'])) {
    return 'power dynamics and antagonist presence';
  }
  return 'prose texture and sentence rhythm';
}

export function authorModule(input: GenerationInput, context: ArcContext): string {
  const blend = selectAuthorBlend(context.arc.creatureType, context.recentChapterMetadata);

  if (!blend || blend.length === 0) {
    return `AUTHOR STYLE BLEND:\nWrite with narrative sophistication. Prioritize specificity over generality. Earn every emotion.`;
  }

  const lines: string[] = [];
  lines.push('For this chapter, draw on the following authors — each for a specific purpose:');
  lines.push('');

  blend.forEach((author, index) => {
    const voiceTags: string[] = (author as { voiceTags?: string[] }).voiceTags ?? [];
    const narrativeFn = getNarrativeFunction(voiceTags);
    const signature = voiceTags.length > 0 ? voiceTags.join(', ') : author.register;

    lines.push(`${index + 1}. ${author.name} — ${author.style}: Use for ${narrativeFn}`);
    lines.push(`   Signature: ${signature}`);
    lines.push('');
  });

  lines.push(
    "Do not blend these voices uniformly. Give each author their lane — the prose should shift register when moving between interior thought, dialogue, and action.",
  );

  return `AUTHOR STYLE BLEND:\n${lines.join('\n')}`;
}
