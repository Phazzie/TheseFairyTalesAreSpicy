import type { ArcContext, GenerationInput } from '../types/index.js';

const hookDensityInstructions: Record<string, string> = {
  low: 'one mid-chapter tension moment',
  medium: 'two scene-break hooks',
  high: 'micro-tension at every scene break — reader should never feel safe pausing',
};

const pacingRhythmInstructions: Record<string, string> = {
  slow_burn:
    'Slow burn pacing — restraint is a tool. Let scenes breathe. Tension accumulates through what is not said and not done. Resist the urge to resolve.',
  propulsive:
    'Propulsive pacing — forward momentum is constant. Cut anything that slows without purpose. Each scene end creates urgency for the next.',
  variable:
    'Variable pacing — alternate between slower intimate scenes and faster action/revelation beats. The contrast is intentional; use it to control reader breath.',
};

export function pacingModule(input: GenerationInput, context: ArcContext): string {
  const dialogueRatio = context.arc.dialogueRatioPct;
  const proseRatio = 100 - dialogueRatio;
  const hookInstruction =
    hookDensityInstructions[context.arc.hookDensity] ??
    hookDensityInstructions['medium'];
  const rhythmInstruction =
    pacingRhythmInstructions[context.arc.pacingRhythm] ??
    pacingRhythmInstructions['variable'];

  const sceneCount = context.arc.sceneCountDefault;

  const lines: string[] = [];
  lines.push(
    `Dialogue/Prose Balance: Target ${dialogueRatio}% dialogue, ${proseRatio}% prose description and interiority.`,
  );
  lines.push('');
  lines.push(`Hook Density: Include ${hookInstruction}.`);
  lines.push('');
  lines.push(rhythmInstruction);
  lines.push('');
  lines.push(
    `Scene Count: This chapter should contain ${sceneCount} scene${sceneCount === 1 ? '' : 's'}. Each scene needs a clear entry point, escalation, and exit beat.`,
  );

  return `PACING:\n${lines.join('\n')}`;
}
