import type { ArcContext, GenerationInput, RelationshipPair, CharacterProfile } from '../types/index.js';

function resolveCharacterName(
  characterId: string,
  characters: CharacterProfile[],
): string {
  const found = characters.find((c) => c.id === characterId);
  return found ? found.displayName : characterId;
}

function formatRelationship(pair: RelationshipPair, characters: CharacterProfile[]): string {
  const nameA = resolveCharacterName(pair.characterAId, characters);
  const nameB = resolveCharacterName(pair.characterBId, characters);

  const powerLabel =
    pair.powerHolder === 'a'
      ? nameA
      : pair.powerHolder === 'b'
        ? nameB
        : 'Equal power';

  const lines: string[] = [];
  lines.push(`${nameA} & ${nameB}`);
  lines.push(`Tension Type: ${pair.tensionType}`);
  lines.push(`Power Holder: ${powerLabel}`);
  lines.push(`History: ${pair.history}`);
  lines.push(`Current Dynamic: ${pair.currentDynamic}`);

  return lines.join('\n');
}

export function relationshipModule(input: GenerationInput, context: ArcContext): string {
  if (!context.relationships || context.relationships.length === 0) {
    return '';
  }

  const formatted = context.relationships
    .map((pair) => formatRelationship(pair, context.characters))
    .join('\n\n---\n\n');

  return `RELATIONSHIP DYNAMICS:\n${formatted}`;
}
