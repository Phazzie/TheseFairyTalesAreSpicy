import type { CreatureType, PlotThread, ChapterMetadata } from '../types/index.js';
import chekhovData from '../data/chekhovElements.json';

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
// Avoids elements already seeded in prior chapters (from chekhovSeeded in ChapterMetadata)
export function selectChekhovElements(
  creatureType: CreatureType,
  existingThreads: PlotThread[],
  recentChapterMetadata?: ChapterMetadata[],
): { id: string; element: string; payoffSuggestion: string }[] {
  const creatureElements: ChekhovElement[] = chekhov[creatureType] ?? [];
  const universalElements: ChekhovElement[] = chekhov['universal'] ?? [];

  // Combine creature-specific and universal elements
  const allElements = [...creatureElements, ...universalElements];

  // Build set of already-planted IDs from recentChapterMetadata.chekhovSeeded
  const alreadyPlantedIds = new Set<string>(
    (recentChapterMetadata ?? []).flatMap((m) => m.chekhovSeeded ?? [])
  );

  const available = allElements.filter((el) => {
    if (alreadyPlantedIds.has(el.id)) return false;
    return true;
  });

  const shuffled = shuffleArray(available);

  return shuffled.slice(0, 2).map((el) => ({
    id: el.id,
    element: el.element,
    payoffSuggestion: el.payoffSuggestion,
  }));
}
