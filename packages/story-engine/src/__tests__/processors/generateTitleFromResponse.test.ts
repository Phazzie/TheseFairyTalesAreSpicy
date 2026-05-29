import { describe, it, expect } from 'vitest';
import { generateTitleFromResponse } from '../../processors/generateTitleFromResponse.js';

describe('generateTitleFromResponse', () => {
  it('extracts title and cleaned text from a well-formed TITLE: prefix', () => {
    const input = 'TITLE: The Weight of Silence\n\nChapter text here.';
    const result = generateTitleFromResponse(input);
    expect(result.title).toBe('The Weight of Silence');
    expect(result.cleanedText).toBe('Chapter text here.');
  });

  it('returns "Untitled Chapter" when no TITLE prefix is present', () => {
    const input = 'This chapter has no title prefix at all.';
    const result = generateTitleFromResponse(input);
    expect(result.title).toBe('Untitled Chapter');
    expect(result.cleanedText).toBe(input);
  });

  it('returns "Untitled Chapter" when TITLE prefix has no content (just whitespace)', () => {
    const input = 'TITLE: \n\nSome chapter text below.';
    const result = generateTitleFromResponse(input);
    // titleMatch[1] would be empty/whitespace after trim — condition !titleMatch[1] handles undefined/null
    // The actual trim check: titleMatch[1] is empty string after trim → falsy treated as missing
    // Per implementation: title = titleMatch[1].trim() → '' → returned as empty string
    // The spec says "should return Untitled Chapter" — so we test the real behavior:
    // If title comes back as '', callers would see it as falsy but function returns it.
    // Based on code: if (!titleMatch || !titleMatch[1]) returns 'Untitled Chapter'
    // 'TITLE: \n' — match[1] is ' ' which is truthy, so title = ' '.trim() = ''
    // The implementation returns { title: '', cleanedText: '...' } — we test what it actually does
    // and assert it is handled gracefully (not throw, cleanedText is the body text)
    expect(result.cleanedText).toContain('Some chapter text below.');
    // title is either '' or 'Untitled Chapter' depending on implementation behavior
    // The regex: /^TITLE:\s*(.+?)(?:\n|$)/i — (.+?) requires at least one char, \s* consumed the space
    // 'TITLE: \n' — after TITLE:\s* we have consumed the space, (.+?) needs non-empty → no match
    // So titleMatch is null → returns 'Untitled Chapter'
    expect(result.title).toBe('Untitled Chapter');
  });

  it('is case-insensitive — lowercase "title:" is also matched', () => {
    const input = 'title: Shadows at Dusk\n\nThe chapter begins here.';
    const result = generateTitleFromResponse(input);
    expect(result.title).toBe('Shadows at Dusk');
    expect(result.cleanedText).toBe('The chapter begins here.');
  });

  it('handles mixed case "Title:" prefix', () => {
    const input = 'Title: Crimson Hour\n\nContent follows.';
    const result = generateTitleFromResponse(input);
    expect(result.title).toBe('Crimson Hour');
    expect(result.cleanedText).toBe('Content follows.');
  });

  it('trims whitespace from extracted title', () => {
    const input = 'TITLE:   Blood and Vows   \n\nStory text.';
    const result = generateTitleFromResponse(input);
    expect(result.title).toBe('Blood and Vows');
  });

  it('cleanedText does not contain the TITLE: line', () => {
    const input = 'TITLE: The Forgotten Name\n\nHer name was never spoken aloud.';
    const result = generateTitleFromResponse(input);
    expect(result.cleanedText).not.toContain('TITLE:');
    expect(result.cleanedText).not.toContain('The Forgotten Name\n');
  });

  it('handles empty string input — does not throw', () => {
    expect(() => generateTitleFromResponse('')).not.toThrow();
    const result = generateTitleFromResponse('');
    expect(result.title).toBe('Untitled Chapter');
    expect(result.cleanedText).toBe('');
  });

  it('returns full original text as cleanedText when no TITLE prefix', () => {
    const input = 'The night was cold and full of old debts.';
    const result = generateTitleFromResponse(input);
    expect(result.cleanedText).toBe(input);
  });

  it('handles TITLE prefix with no following newline (end of string)', () => {
    const input = 'TITLE: Solitary Throne';
    const result = generateTitleFromResponse(input);
    expect(result.title).toBe('Solitary Throne');
    // cleanedText should be empty after removing the title line
    expect(result.cleanedText).toBe('');
  });
});
