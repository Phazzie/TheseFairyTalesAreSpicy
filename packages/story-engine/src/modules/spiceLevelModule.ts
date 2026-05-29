import type { ArcContext, GenerationInput, SpiceLevel } from '../types/index.js';
import spiceLevelsData from '../data/spiceLevels.json';

interface SpiceLevelData {
  level: number;
  label: string;
  description: string;
  allowedActs: string[];
  forbiddenLanguage: string[];
  explicitInstruction: string;
  paceNote: string;
}

const spiceLevels = spiceLevelsData as SpiceLevelData[];

const PILOT_MODE_CAP: SpiceLevel = 3;

export function spiceLevelModule(input: GenerationInput, context: ArcContext): string {
  let targetLevel: SpiceLevel = input.spiceLevelOverride ?? context.arc.defaultSpiceLevel;

  if (input.pilotMode && targetLevel > PILOT_MODE_CAP) {
    targetLevel = PILOT_MODE_CAP;
  }

  const levelData = spiceLevels.find((sl) => sl.level === targetLevel);

  if (!levelData) {
    return `SPICE LEVEL:\nLevel ${targetLevel} — write with appropriate restraint and intentionality. Every intimate moment must be earned through prior emotional groundwork.`;
  }

  const lines: string[] = [];
  lines.push(`Level ${levelData.level}: ${levelData.label}`);
  if (input.pilotMode && (input.spiceLevelOverride ?? context.arc.defaultSpiceLevel) > PILOT_MODE_CAP) {
    lines.push(`(Pilot mode active: capped at level ${PILOT_MODE_CAP})`);
  }
  lines.push('');
  lines.push(levelData.description);
  lines.push('');
  lines.push('Allowed Acts:');
  for (const act of levelData.allowedActs) {
    lines.push(`  - ${act}`);
  }
  lines.push('');
  lines.push('Forbidden Language:');
  for (const forbidden of levelData.forbiddenLanguage) {
    lines.push(`  - ${forbidden}`);
  }
  lines.push('');
  lines.push(`Instruction: ${levelData.explicitInstruction}`);
  lines.push('');
  lines.push(`Pacing Note: ${levelData.paceNote}`);

  return `SPICE LEVEL:\n${lines.join('\n')}`;
}
