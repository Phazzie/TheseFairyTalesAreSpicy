import type { CreatureType, PlotThread } from '../types/index.js';
import chekhovData from '../data/chekhovElements.json' assert { type: 'json' };

interface ChekhovElement {
  id: string;
  element: string;
  payoffSuggestion: string;
}

interface ChekhovData {
  vampire: ChekhovElement[];
  werewolf: ChekhovElement[];
  fairy: ChekhovElement[];
  universal: ChekhovElement[];
  [key: string]: ChekhovElement[];
}

const chekhov = chekhovData as ChekhovData;

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j] as T;
    copy[j] = temp as T;
  }
  return copy;
}

// Picks 2 unseeded Chekhov elements for this chapter
// Avoids elements already in the plot thread tracker
export function selectChekhovElements(
  creatureType: CreatureType,
  existingThreads: PlotThread[],
): { id: string; element: string; payoffSuggestion: string }[] {
  const creatureElements: ChekhovElement[] = chekhov[creatureType] ?? [];
  const universalElements: ChekhovElement[] = chekhov['universal'] ?? [];

  // Combine creature-specific and universal elements
  const allElements = [...creatureElements, ...universalElements];

  // Get IDs of elements already planted (from existingThreads where type='chekhov')
  const alreadyPlantedIds = new Set(
    existingThreads
      .filter((t) => t.threadType === 'chekhov')
      .map((t) => t.description)
      // description may contain the element id — we also check if the id is a substring
  );

  // More robust: check element ids against thread descriptions
  const plantedDescriptions = existingThreads
    .filter((t) => t.threadType === 'chekhov')
    .map((t) => t.description.toLowerCase());

  const available = allElements.filter((el) => {
    if (alreadyPlantedIds.has(el.id)) return false;
    // Also skip if the element id appears in any thread description
    if (plantedDescriptions.some((desc) => desc.includes(el.id.toLowerCase()))) return false;
    return true;
  });

  const shuffled = shuffleArray(available);

  return shuffled.slice(0, 2).map((el) => ({
    id: el.id,
    element: el.element,
    payoffSuggestion: el.payoffSuggestion,
  }));
}
