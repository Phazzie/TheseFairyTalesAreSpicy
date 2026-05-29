// Final rendering cleanup for chapter text
// - Normalize multiple blank lines to max 2
// - Trim leading/trailing whitespace
// - Ensure paragraph breaks are consistent (\n\n)
export function formatMarkdown(text: string): string {
  return text
    .replace(/\n{3,}/g, '\n\n')  // max 2 consecutive newlines
    .replace(/[ \t]+$/gm, '')     // remove trailing whitespace per line
    .trim();
}
