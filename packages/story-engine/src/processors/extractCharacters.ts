// Parses speaker tags in generated text to find character slugs mentioned
// Returns unique character slugs found
// Input: text with [ELENA:dark_desire] and [DORIAN:cold_fury] tags
// Output: ['ELENA', 'DORIAN']
export function extractCharacters(text: string): string[] {
  const matches = [...text.matchAll(/\[([\w_]+):\w+\]/g)];
  return [...new Set(matches.map((m) => m[1] ?? '').filter(Boolean))];
}
