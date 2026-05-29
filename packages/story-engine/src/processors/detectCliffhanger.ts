import type { CliffhangerType } from '../types/index.js';

// Classifies cliffhanger type from last ~300 words of chapter
// Uses pattern matching — not AI
export function detectCliffhanger(chapterText: string): CliffhangerType {
  const words = chapterText.trim().split(/\s+/);
  const last300Words = words.slice(-300).join(' ').toLowerCase();
  const last50Words = words.slice(-50).join(' ').toLowerCase();

  // revelation: knowledge was gained, a truth was understood
  if (
    /\b(realized|understood|truth was|had known|the secret|she knew now|he knew now|it was true|all along|had been hiding|had lied|was not what)\b/.test(
      last300Words,
    )
  ) {
    return 'revelation';
  }

  // interruption: sudden break in action, something or someone enters
  if (
    /\b(burst open|cut off|interrupted|the door|slammed|footsteps|voice from)\b/.test(
      last300Words,
    ) ||
    /\b(suddenly|burst|door|steps|interrupted)\b/.test(last50Words)
  ) {
    return 'interruption';
  }

  // physical_peril: danger to body, violence, survival threat
  if (
    /\b(blood|pain|weapon|attack|danger|wouldn't survive|would not survive|knife|blade|claws|teeth|shot|wound|struck|dying|kill|threat|fangs)\b/.test(
      last300Words,
    )
  ) {
    return 'physical_peril';
  }

  // emotional_severance: relationship ending, departure, goodbye
  if (
    /\b(walked away|never again|it was over|goodbye|turned her back|turned his back|could not stay|left without|wouldn't come back|would not come back|the end of|nothing left)\b/.test(
      last300Words,
    )
  ) {
    return 'emotional_severance';
  }

  // temptation_offered: a deal, offer, bargain presented
  if (
    /\b(if you want|the offer|a deal|a bargain|what you've always wanted|what you want|yours if|i can give you|yours to take|name your price)\b/.test(
      last300Words,
    )
  ) {
    return 'temptation_offered';
  }

  // identity_destabilized: who or what someone is has been called into question
  if (
    /\b(who are you|what are you|not what (i|she|he) thought|monster|not human|one of them|always been|never was|what i've become)\b/.test(
      last300Words,
    )
  ) {
    return 'identity_destabilized';
  }

  // time_bomb: deadline, countdown, urgency of time
  if (
    /\b(before dawn|hours left|running out|the deadline|by midnight|before morning|before sunrise|not much time|time was|counting down|when the sun)\b/.test(
      last300Words,
    )
  ) {
    return 'time_bomb';
  }

  // mirror_reveal: seeing oneself reflected in another or in a mirror
  if (
    /\b(just like|the same as|reflection|the mirror|recognized herself|recognized himself|staring back|her own face|his own face|what she saw in|what he saw in)\b/.test(
      last300Words,
    )
  ) {
    return 'mirror_reveal';
  }

  return 'none';
}
