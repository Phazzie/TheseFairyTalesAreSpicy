import type { ArcType, ChapterMetadata } from '../types/index.js';
import beatStructuresData from '../data/beatStructures.json';

interface BeatStructure {
  code: string;
  name: string;
  progression: string[];
  spiceNote: string;
  antiPatterns: string[];
}

const beatStructures = beatStructuresData as BeatStructure[];

// Codes considered "slow" beats that are suppressed in pilot mode
const SLOW_BEATS = new Set(['slow_burn_awakening', 'reluctant_protector', 'ancient_claim']);

// Arc-position tiers
const EARLY_BEATS = [
  'slow_burn_awakening',
  'forbidden_threshold',
  'forced_proximity',
  'rivals_to_lovers',
  'reluctant_protector',
];

const LATE_BEATS = [
  'unraveling_control',
  'moonlit_surrender',
  'venomous_affection',
  'eternal_game',
  'ancient_claim',
];

// Decompression / breathing beats — inserted after 3 consecutive non-decompression chapters
const BREATHING_BEATS = ['afterglow', 'wound_tending', 'vulnerable_confession'];

function getRecentBeatCodes(recentMetadata?: ChapterMetadata[]): Set<string> {
  if (!recentMetadata || recentMetadata.length === 0) {
    return new Set<string>();
  }
  // Look at last 3 chapters
  const lastThree = recentMetadata.slice(-3);
  return new Set(lastThree.map((m) => m.beatUsed));
}

function getConsecutiveNonDecompressionCount(recentMetadata?: ChapterMetadata[]): number {
  if (!recentMetadata || recentMetadata.length === 0) return 0;
  let count = 0;
  // Walk from most recent backwards
  for (let i = recentMetadata.length - 1; i >= 0; i--) {
    if (BREATHING_BEATS.includes(recentMetadata[i]!.beatUsed)) break;
    count++;
  }
  return count;
}

function getWeightedPool(allBeats: BeatStructure[], chapterNumber: number): BeatStructure[] {
  if (!chapterNumber || chapterNumber <= 0) return allBeats;

  if (chapterNumber <= 5) {
    // Weight heavily toward early beats (70% early, 30% mid, 0% late)
    return [
      ...allBeats.filter((b) => EARLY_BEATS.includes(b.code)),
      ...allBeats.filter((b) => EARLY_BEATS.includes(b.code)), // double-weight early
      ...allBeats.filter((b) => !EARLY_BEATS.includes(b.code) && !LATE_BEATS.includes(b.code)),
    ];
  } else if (chapterNumber >= 16) {
    // Weight toward late beats (0% early, 30% mid, 70% late)
    return [
      ...allBeats.filter((b) => LATE_BEATS.includes(b.code)),
      ...allBeats.filter((b) => LATE_BEATS.includes(b.code)), // double-weight late
      ...allBeats.filter((b) => !EARLY_BEATS.includes(b.code) && !LATE_BEATS.includes(b.code)),
    ];
  }
  // Middle: all beats equally weighted
  return allBeats;
}

// Weighted random beat selection
// Avoids repeating same beat in last 3 chapters
// pilotMode: avoids slow_burn beats for first 3 chapters
// chapterNumber: enables arc-position-aware weighting
export function selectBeat(
  _arcType: ArcType,
  recentMetadata?: ChapterMetadata[],
  pilotMode?: boolean,
  chapterNumber?: number,
): BeatStructure {
  const recentCodes = getRecentBeatCodes(recentMetadata);

  // Never select a decompression beat as the very first chapter
  const isFirstChapter = chapterNumber === 1 || (!chapterNumber && (!recentMetadata || recentMetadata.length === 0));

  let candidates = beatStructures.filter((beat) => {
    if (recentCodes.has(beat.code)) return false;
    if (pilotMode && SLOW_BEATS.has(beat.code)) return false;
    if (isFirstChapter && BREATHING_BEATS.includes(beat.code)) return false;
    return true;
  });

  // If all beats are recently used, allow repeats — pick least recent
  if (candidates.length === 0) {
    if (recentMetadata && recentMetadata.length > 0) {
      // Find beat used furthest back
      const usageOrder = new Map<string, number>();
      recentMetadata.forEach((m, index) => {
        if (!usageOrder.has(m.beatUsed)) {
          usageOrder.set(m.beatUsed, index);
        }
      });

      let leastRecentCode: string | undefined;
      let leastRecentIndex = Infinity;

      for (const [code, index] of usageOrder.entries()) {
        if (index < leastRecentIndex) {
          leastRecentIndex = index;
          leastRecentCode = code;
        }
      }

      const leastRecentBeat = beatStructures.find((b) => b.code === leastRecentCode);
      if (leastRecentBeat) {
        return leastRecentBeat;
      }
    }

    // Absolute fallback: pick from pilot-mode filtered beats or all beats
    candidates = pilotMode
      ? beatStructures.filter((b) => !SLOW_BEATS.has(b.code))
      : beatStructures;

    if (candidates.length === 0) {
      candidates = beatStructures;
    }
  }

  // Apply arc-position weighting when chapterNumber is provided
  let weightedCandidates = chapterNumber && chapterNumber > 0
    ? getWeightedPool(candidates, chapterNumber)
    : candidates;

  // Enforce decompression: after 3 consecutive non-decompression beats, 2× weight decompression beats
  const consecutiveNonDecompression = getConsecutiveNonDecompressionCount(recentMetadata);
  if (consecutiveNonDecompression >= 3 && !isFirstChapter) {
    const availableBreathing = candidates.filter((b) => BREATHING_BEATS.includes(b.code));
    if (availableBreathing.length > 0) {
      // Add decompression beats with 2× weight on top of existing pool
      weightedCandidates = [
        ...weightedCandidates,
        ...availableBreathing, // extra copy = 2× weight
      ];
    }
  }

  // Random selection from weighted candidates
  const index = Math.floor(Math.random() * weightedCandidates.length);
  return weightedCandidates[index] as BeatStructure;
}
