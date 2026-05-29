// Estimates dialogue percentage of chapter text
// Dialogue = text inside quotation marks
export function measureDialogueRatio(text: string): number {
  const dialogueMatches = text.match(/"[^"]+"/g) ?? [];
  const dialogueChars = dialogueMatches.reduce((sum, m) => sum + m.length, 0);
  const totalChars = text.length;
  if (totalChars === 0) return 0;
  return Math.round((dialogueChars / totalChars) * 100);
}
