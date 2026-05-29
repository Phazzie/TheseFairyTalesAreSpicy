import type { ArcContext, GenerationInput } from '../types/index.js';
import archetypesData from '../data/atmosphereArchetypes.json' assert { type: 'json' };

interface AtmosphereArchetypeData {
  id: string;
  label: string;
  imageryPalette: string[];
  atmosphericInstruction: string;
  sensoryPriorities: string[];
  tonalTarget: string;
}

const archetypes = archetypesData as AtmosphereArchetypeData[];

const GENERIC_ATMOSPHERIC_INSTRUCTION =
  'Establish atmosphere through specific sensory detail. Every setting element should do double work: reveal character or foreshadow event, never describe for its own sake. Ground the reader in place before moving into action.';

export function atmosphereModule(input: GenerationInput, context: ArcContext): string {
  const archetypeId = context.arc.atmosphereArchetype;
  const sensoryPrimary = context.arc.defaultSensoryPrimary;

  const archetype = archetypes.find((a) => a.id === archetypeId);

  const lines: string[] = [];

  if (archetype) {
    lines.push(`Setting: ${archetype.label}`);
    lines.push('');
    lines.push('Imagery Palette:');
    for (const image of archetype.imageryPalette) {
      lines.push(`  - ${image}`);
    }
    lines.push('');
    lines.push(`Atmospheric Instruction: ${archetype.atmosphericInstruction}`);
    lines.push('');
    lines.push(`Tonal Target: ${archetype.tonalTarget}`);
  } else {
    lines.push(`Setting Archetype: ${archetypeId}`);
    lines.push('');
    lines.push(`Atmospheric Instruction: ${GENERIC_ATMOSPHERIC_INSTRUCTION}`);
  }

  lines.push('');
  lines.push(`Primary Sensory Mode: ${sensoryPrimary} — lead with this sense in scene-opening description.`);

  return `SETTING & ATMOSPHERE:\n${lines.join('\n')}`;
}
