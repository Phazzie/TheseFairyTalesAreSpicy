import type { ArcContext, GenerationInput } from '../types/index.js';
import { selectAuthorBlend } from '../selectors/selectAuthorBlend.js';

export function authorModule(input: GenerationInput, context: ArcContext): string {
  const blend = selectAuthorBlend(context.arc.creatureType, context.recentChapterMetadata);

  if (!blend || blend.length === 0) {
    return `AUTHOR STYLE BLEND:\nWrite with narrative sophistication. Prioritize specificity over generality. Earn every emotion.`;
  }

  const lines: string[] = [];
  lines.push('Channel the following author styles in combination for this chapter:');
  lines.push('');

  blend.forEach((author, index) => {
    lines.push(`${index + 1}. ${author.name} (register: ${author.register})`);
    lines.push(`   ${author.style}`);
  });

  lines.push('');
  lines.push(
    'Blend these voices — do not imitate any single one. Let each contribute its strongest quality to the prose.',
  );

  return `AUTHOR STYLE BLEND:\n${lines.join('\n')}`;
}
