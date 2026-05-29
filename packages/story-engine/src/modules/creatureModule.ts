import type { ArcContext, GenerationInput } from '../types/index.js';

const creatureDescriptions: Record<string, string> = {
  vampire:
    'An apex predator. Centuries of control, beauty weaponized, hunger mastered into art. Authority is absolute and sensual.',
  werewolf:
    'A creature of duality — human vulnerability and animal dominance in the same skin. The shift is power, cost, and intimacy.',
  fairy:
    'A being of ancient contract. Beautiful, capricious, bound by laws humans have forgotten. Every word is a potential oath.',
};

export function creatureModule(input: GenerationInput, context: ArcContext): string {
  const { creatureType } = context.arc;
  const description = creatureDescriptions[creatureType];
  if (!description) {
    return `CREATURE TYPE: ${creatureType}\n${creatureType}`;
  }
  // Include the creature type name explicitly so downstream checks and the model both see it
  return `CREATURE TYPE: ${creatureType}\n${description}`;
}
