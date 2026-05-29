// Extracts title from AI response TITLE: prefix
// Input: "TITLE: The Weight of Silence\n\nChapter text here..."
// Output: { title: "The Weight of Silence", cleanedText: "Chapter text here..." }
export function generateTitleFromResponse(rawResponse: string): { title: string; cleanedText: string } {
  // Use [ \t]* (not \s*) so we don't consume newlines — only spaces and tabs after TITLE:
  const titleMatch = rawResponse.match(/^TITLE:[ \t]*([^\n]+)/i);
  const title = titleMatch?.[1]?.trim() ?? '';

  // Strip the TITLE line (everything up to and including the first newline)
  const cleanedText = rawResponse.replace(/^TITLE:[^\n]*\n?/i, '').trim();

  if (!title) {
    // TITLE line was blank or absent — return original text with Untitled
    return { title: 'Untitled Chapter', cleanedText: cleanedText || rawResponse.trim() };
  }
  return { title, cleanedText };
}
