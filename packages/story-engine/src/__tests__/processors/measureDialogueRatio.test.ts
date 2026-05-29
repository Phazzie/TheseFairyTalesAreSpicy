import { describe, it, expect } from 'vitest';
import { measureDialogueRatio } from '../../processors/measureDialogueRatio.js';

describe('measureDialogueRatio', () => {
  it('returns 0 for empty string', () => {
    expect(measureDialogueRatio('')).toBe(0);
  });

  it('returns 0 for text with no quotation marks', () => {
    const text = 'She crossed the hall without speaking. He watched from the doorway.';
    expect(measureDialogueRatio(text)).toBe(0);
  });

  it('returns close to 100 for text that is almost entirely dialogue', () => {
    // All characters are inside quotes — ratio should be very high
    const text = '"Leave." "Never." "Then stay." "You know I cannot." "I know."';
    const ratio = measureDialogueRatio(text);
    // Most characters including surrounding quotes count as dialogue
    expect(ratio).toBeGreaterThan(80);
  });

  it('returns approximately 50 for text that is half dialogue, half narration', () => {
    // The metric counts CHARACTERS INSIDE QUOTES vs total chars.
    // Build text where quoted chars ≈ 50% of total.
    // narration: 50 non-quoted chars. quoted block: "BB...B" = 50 chars (48 Bs + 2 quote chars).
    // total = 50 + 1 (space) + 50 = 101 chars. dialogue chars = 50. ratio = 50/101 ≈ 49.5%.
    const narration = 'A'.repeat(50);
    const quotedContent = '"' + 'B'.repeat(48) + '"'; // 50 chars total including quotes
    const text = `${narration} ${quotedContent}`;
    const ratio = measureDialogueRatio(text);
    expect(ratio).toBeGreaterThanOrEqual(40);
    expect(ratio).toBeLessThanOrEqual(60);
  });

  it('counts only text inside double quotes as dialogue', () => {
    // Single quotes should not count
    const text = "She said 'something' quietly.";
    expect(measureDialogueRatio(text)).toBe(0);
  });

  it('counts multiple separate dialogue chunks correctly', () => {
    const d1 = '"First line of dialogue."';      // 25 chars
    const d2 = '"Second line of dialogue."';     // 26 chars
    const narration = ' He paused. ';              // 12 chars
    const text = `${d1}${narration}${d2}`;
    const totalDialogue = d1.length + d2.length;
    const total = text.length;
    const expected = Math.round((totalDialogue / total) * 100);
    expect(measureDialogueRatio(text)).toBe(expected);
  });

  it('returns a number between 0 and 100 for any text', () => {
    const samples = [
      'Pure narration, no speech at all.',
      '"Pure dialogue, nothing else."',
      'Mixed "text with" some quotes "scattered throughout."',
    ];
    for (const sample of samples) {
      const ratio = measureDialogueRatio(sample);
      expect(ratio).toBeGreaterThanOrEqual(0);
      expect(ratio).toBeLessThanOrEqual(100);
    }
  });

  it('treats nested or malformed quotes as dialogue up to the closing quote', () => {
    // Text with unclosed quotes — the regex matches pairs, unpaired quotes are ignored
    const text = '"Closed quote." Unpaired " rest of line.';
    // Only the first quoted pair counts
    const dialogueChars = '"Closed quote."'.length;
    const expected = Math.round((dialogueChars / text.length) * 100);
    expect(measureDialogueRatio(text)).toBe(expected);
  });

  it('returns 0 for whitespace-only input', () => {
    expect(measureDialogueRatio('   ')).toBe(0);
  });
});
