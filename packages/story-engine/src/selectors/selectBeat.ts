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

function getRecentBeatCodes(recentMetadata?: ChapterMetadata[]): Set<string> {
  if (!recentMetadata || recentMetadata.length === 0) {
    return new Set<string>();
  }
  // Look at last 3 chapters
  const lastThree = recentMetadata.slice(-3);
  return new Set(lastThree.map((m) => m.beatUsed));
}

// Weighted random beat selection
// Avoids repeating same beat in last 3 chapters
// pilotMode: avoids slow_burn beats for first 3 chapters
export function selectBeat(
  _arcType: ArcType,
  recentMetadata?: ChapterMetadata[],
  pilotMode?: boolean,
): BeatStructure {
  const recentCodes = getRecentBeatCodes(recentMetadata);

  let candidates = beatStructures.filter((beat) => {
    if (recentCodes.has(beat.code)) return false;
    if (pilotMode && SLOW_BEATS.has(beat.code)) return false;
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

  // Random selection from candidates
  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index] as BeatStructure;
}
