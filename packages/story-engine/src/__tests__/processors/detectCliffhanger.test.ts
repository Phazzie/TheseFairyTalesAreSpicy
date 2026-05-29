import { describe, it, expect } from 'vitest';
import { detectCliffhanger } from '../../processors/detectCliffhanger.js';
import type { CliffhangerType } from '../../types/index.js';

// Helper: build a long chapter body with a specific ending phrase
function buildChapter(ending: string, bodyLength = 400): string {
  const filler = 'She walked through the empty corridor, thoughts racing. ';
  const body = filler.repeat(Math.ceil(bodyLength / filler.length)).slice(0, bodyLength);
  return `${body} ${ending}`;
}

describe('detectCliffhanger', () => {
  it('returns "revelation" when "realized" appears near the end', () => {
    const text = buildChapter('And then she realized it had been him all along.');
    expect(detectCliffhanger(text)).toBe('revelation');
  });

  it('returns "revelation" when "truth was" appears near the end', () => {
    const text = buildChapter('The truth was far worse than she had imagined.');
    expect(detectCliffhanger(text)).toBe('revelation');
  });

  it('returns "revelation" when "had lied" appears in final window', () => {
    const text = buildChapter('He had lied to her from the very beginning.');
    expect(detectCliffhanger(text)).toBe('revelation');
  });

  it('returns "emotional_severance" when "walked away" appears near the end', () => {
    const text = buildChapter('She walked away and never looked back.');
    expect(detectCliffhanger(text)).toBe('emotional_severance');
  });

  it('returns "emotional_severance" when "it was over" appears near the end', () => {
    const text = buildChapter('She knew it was over between them.');
    expect(detectCliffhanger(text)).toBe('emotional_severance');
  });

  it('returns "emotional_severance" when "nothing left" appears near the end', () => {
    const text = buildChapter('There was nothing left to say to him.');
    expect(detectCliffhanger(text)).toBe('emotional_severance');
  });

  it('returns "physical_peril" when "blood" appears near the end', () => {
    const text = buildChapter('The blood spread across the stone floor in silence.');
    expect(detectCliffhanger(text)).toBe('physical_peril');
  });

  it('returns "physical_peril" when "fangs" appears near the end', () => {
    const text = buildChapter('His fangs gleamed in the darkness before her.');
    expect(detectCliffhanger(text)).toBe('physical_peril');
  });

  it('returns "physical_peril" when "blade" appears near the end', () => {
    const text = buildChapter('The blade caught the moonlight as he raised it.');
    expect(detectCliffhanger(text)).toBe('physical_peril');
  });

  it('returns "interruption" when "burst open" appears near the end', () => {
    const text = buildChapter('The door burst open before she could answer.');
    expect(detectCliffhanger(text)).toBe('interruption');
  });

  it('returns "interruption" when "suddenly" appears in last 50 words', () => {
    // Place "suddenly" close to the end to hit the last50Words check
    const filler = 'She considered her options very carefully. '.repeat(10);
    const text = `${filler}She moved to the window. Suddenly everything changed.`;
    const result = detectCliffhanger(text);
    expect(result).toBe('interruption');
  });

  it('returns "temptation_offered" when "a deal" appears near the end', () => {
    const text = buildChapter('He offered her a deal she could not refuse.');
    expect(detectCliffhanger(text)).toBe('temptation_offered');
  });

  it('returns "identity_destabilized" when "what are you" appears near the end', () => {
    const text = buildChapter('"What are you?" she whispered, stepping backward.');
    expect(detectCliffhanger(text)).toBe('identity_destabilized');
  });

  it('returns "time_bomb" when "before dawn" appears near the end', () => {
    const text = buildChapter('It had to be finished before dawn or all was lost.');
    expect(detectCliffhanger(text)).toBe('time_bomb');
  });

  it('returns "mirror_reveal" when "reflection" appears near the end', () => {
    const text = buildChapter('She saw her own reflection staring back from his eyes.');
    expect(detectCliffhanger(text)).toBe('mirror_reveal');
  });

  it('returns "none" for empty string — does not throw', () => {
    const result = detectCliffhanger('');
    expect(result).toBe('none');
  });

  it('returns a valid CliffhangerType for a very short text under 300 words', () => {
    const validTypes: CliffhangerType[] = [
      'revelation', 'interruption', 'physical_peril', 'emotional_severance',
      'temptation_offered', 'identity_destabilized', 'time_bomb', 'mirror_reveal', 'none',
    ];
    const shortText = 'She smiled. He did not.';
    const result = detectCliffhanger(shortText);
    expect(validTypes).toContain(result);
  });

  it('returns "none" when text has no recognizable pattern', () => {
    const text = buildChapter('The candle went out and darkness fell over the room.');
    expect(detectCliffhanger(text)).toBe('none');
  });

  it('does NOT detect revelation when keyword is far from the end (beyond 300-word window)', () => {
    // Place "realized" at the very start, then 350+ words of neutral filler, then a neutral ending.
    // The 300-word window looks at the last 300 words — "realized" must be outside it.
    const filler = 'She paced the empty hall wondering what to do next. '; // 10 words
    const body = filler.repeat(35); // 350 words — pushes "realized" well outside the 300-word window
    const text = `She realized it long ago. ${body}The candle burned low.`;
    // "realized" is in word 1-5; last 300 words start around word 55. Should not trigger revelation.
    const result = detectCliffhanger(text);
    expect(result).toBe('none');
  });
});
