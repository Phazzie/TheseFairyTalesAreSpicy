import { describe, it, expect } from 'vitest';
import { stripSpeakerTags } from '../../processors/stripSpeakerTags.js';

describe('stripSpeakerTags', () => {
  it('removes a single speaker tag', () => {
    const input = '[ELENA:dark_desire]"You shouldn\'t be here," she said.';
    const result = stripSpeakerTags(input);
    expect(result).toBe('"You shouldn\'t be here," she said.');
    expect(result).not.toContain('[ELENA');
  });

  it('removes multiple different speaker tags', () => {
    const input = '[ELENA:cold_fury]"Leave." [DORIAN:dark_desire]"I\'m afraid I can\'t do that."';
    const result = stripSpeakerTags(input);
    expect(result).not.toMatch(/\[[\w_]+:[\w_]+\]/);
    expect(result).toContain('"Leave."');
    expect(result).toContain('"I\'m afraid I can\'t do that."');
  });

  it('handles text with no speaker tags', () => {
    const input = 'The candle flickered in the draft from the open window.';
    expect(stripSpeakerTags(input)).toBe(input);
  });

  it('handles empty string', () => {
    expect(stripSpeakerTags('')).toBe('');
  });

  it('removes tag but preserves surrounding whitespace trim', () => {
    // Tag at the very start, text should be trimmed of leading space
    const input = '[DORIAN:hunger]   The hunger was unbearable.';
    const result = stripSpeakerTags(input);
    expect(result).not.toContain('[DORIAN');
    expect(result).toContain('unbearable.');
  });

  it('removes consecutive adjacent tags with no space between', () => {
    const input = '[A:b][C:d]"Dialogue here."';
    const result = stripSpeakerTags(input);
    expect(result).not.toMatch(/\[/);
    expect(result).toContain('"Dialogue here."');
  });

  it('does not remove square brackets that are NOT speaker tags (no colon)', () => {
    // "[NOTE]" has no colon so the regex should not match it
    const input = '[NOTE] Some annotation here.';
    const result = stripSpeakerTags(input);
    // The regex requires [WORD:WORD] pattern; [NOTE] alone should survive
    expect(result).toContain('[NOTE]');
  });

  it('handles tag with underscores in both parts', () => {
    const input = '[DARK_QUEEN:cold_fury]She turned away.';
    const result = stripSpeakerTags(input);
    expect(result).not.toMatch(/\[DARK_QUEEN/);
    expect(result).toContain('She turned away.');
  });
});
