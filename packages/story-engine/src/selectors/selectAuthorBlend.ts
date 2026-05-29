import type { CreatureType, ChapterMetadata } from '../types/index.js';
import authorPoolsData from '../data/authorPools.json';

interface AuthorEntry {
  name: string;
  style: string;
  register: string;
  voiceTags: string[];
}

interface AuthorPoolsData {
  vampire: AuthorEntry[];
  werewolf: AuthorEntry[];
  fairy: AuthorEntry[];
  cross_creature: AuthorEntry[];
  [key: string]: AuthorEntry[];
}

const authorPools = authorPoolsData as AuthorPoolsData;

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // Swap elements
    const temp = copy[i];
    copy[i] = copy[j] as T;
    copy[j] = temp as T;
  }
  return copy;
}

function getRecentlyUsedAuthors(recentMetadata?: ChapterMetadata[]): Set<string> {
  if (!recentMetadata || recentMetadata.length === 0) {
    return new Set<string>();
  }

  // Look at last 3 chapters and collect all authors used
  const lastThree = recentMetadata.slice(-3);
  const usedAuthors = lastThree.flatMap((m) => m.authorsUsed ?? []);
  return new Set<string>(usedAuthors);
}

// 2+1 algorithm: 2 from creature-matched pool + 1 from cross_creature pool
// Avoids repeating authors used in the last 3 chapters
export function selectAuthorBlend(
  creatureType: CreatureType,
  recentMetadata?: ChapterMetadata[],
): { name: string; style: string; register: string }[] {
  const creaturePool: AuthorEntry[] = authorPools[creatureType] ?? [];
  const crossPool: AuthorEntry[] = authorPools['cross_creature'] ?? [];

  const recentlyUsed = getRecentlyUsedAuthors(recentMetadata);

  const filterUsed = (pool: AuthorEntry[]): AuthorEntry[] =>
    pool.filter((a) => !recentlyUsed.has(a.name));

  const availableCreature = filterUsed(creaturePool);
  const availableCross = filterUsed(crossPool);

  // If filtering eliminates everyone, fall back to full pool
  const finalCreature = availableCreature.length >= 2 ? availableCreature : creaturePool;
  const finalCross = availableCross.length >= 1 ? availableCross : crossPool;

  const shuffledCreature = shuffleArray(finalCreature);
  const shuffledCross = shuffleArray(finalCross);

  const selected: AuthorEntry[] = [];

  // Pick 2 from creature pool
  const creaturePicks = shuffledCreature.slice(0, 2);
  selected.push(...creaturePicks);

  // Pick 1 from cross_creature pool (not already selected)
  const selectedNames = new Set(selected.map((a) => a.name));
  const crossPick = shuffledCross.find((a) => !selectedNames.has(a.name));

  if (crossPick) {
    selected.push(crossPick);
  } else if (shuffledCross.length > 0) {
    // Allow repeat if no unique option exists
    selected.push(shuffledCross[0] as AuthorEntry);
  }

  return selected.map((a) => ({
    name: a.name,
    style: a.style,
    register: a.register,
  }));
}
