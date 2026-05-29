import type { ArcContext, GenerationInput } from '../types/index.js';
import openingTypesData from '../data/openingTypes.json';

interface OpeningTypeData {
  code: string;
  label: string;
  firstParaInstruction: string;
  exampleOpener: string;
  strengthsFor: string[];
  pitfalls: string[];
}

const openingTypes = openingTypesData as OpeningTypeData[];

const povDescriptions: Record<string, string> = {
  first_person: 'First person (I) — the reader inhabits the protagonist\'s consciousness directly.',
  third_limited: 'Third person limited — deep access to one character\'s interiority; others known only through observation.',
  third_omniscient: 'Third person omniscient — narrator has access to all characters\' interiority; use selectively and with intention.',
  rotating: 'Rotating POV — each scene anchored in a specific character\'s perspective; mark transitions clearly.',
};

const tenseDescriptions: Record<string, string> = {
  past: 'Past tense — events narrated as completed. Allows retrospective weight; the narrator survived to tell this.',
  present: 'Present tense — events unfold in real time. Heightens urgency; no reassurance of survival.',
};

const distanceDescriptions: Record<string, string> = {
  close: 'Close narrative distance — the prose lives inside the character\'s perception. Sensory detail filtered through their specific consciousness.',
  cinematic: 'Cinematic narrative distance — the prose observes from slight remove. Show the character\'s body and behavior; interiority through action.',
};

export function perspectiveModule(input: GenerationInput, context: ArcContext): string {
  const lines: string[] = [];

  const povDesc = povDescriptions[context.arc.povMode] ?? `POV: ${context.arc.povMode}`;
  const tenseDesc = tenseDescriptions[context.arc.tense] ?? `Tense: ${context.arc.tense}`;
  const distanceDesc = distanceDescriptions[context.arc.narrativeDistance] ?? `Distance: ${context.arc.narrativeDistance}`;

  lines.push(povDesc);
  lines.push(tenseDesc);
  lines.push(distanceDesc);
  lines.push('');

  // Find opening type instruction — use the first beat's opening type or default
  // For perspective module we use the arc's pacing rhythm to suggest an opening type
  let openingTypeCode: string;
  if (context.arc.pacingRhythm === 'propulsive') {
    openingTypeCode = 'in_medias_res';
  } else if (context.arc.pacingRhythm === 'slow_burn') {
    openingTypeCode = 'internal_monologue';
  } else {
    openingTypeCode = 'scene_setting';
  }

  const openingType = openingTypes.find((ot) => ot.code === openingTypeCode);

  if (openingType) {
    lines.push(`Recommended Chapter Opening — ${openingType.label}:`);
    lines.push(openingType.firstParaInstruction);
    lines.push('');
    lines.push(`Example opener: ${openingType.exampleOpener}`);
    lines.push('');
    lines.push('Pitfalls to avoid:');
    for (const pitfall of openingType.pitfalls) {
      lines.push(`  - ${pitfall}`);
    }
  } else {
    lines.push('Begin the chapter with an opening that earns the reader\'s trust immediately — specific, sensory, and character-revealing.');
  }

  return `NARRATIVE PERSPECTIVE:\n${lines.join('\n')}`;
}
