import type { ArcContext, GenerationInput, WorldNote } from '../types/index.js';

export function worldNotesModule(input: GenerationInput, context: ArcContext): string {
  if (!context.worldNotes || context.worldNotes.length === 0) {
    return '';
  }

  const activeNotes = context.worldNotes.filter((note) => note.isActive);

  if (activeNotes.length === 0) {
    return '';
  }

  // Sort by createdAt descending and take the 5 most recent
  const sorted = [...activeNotes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const recent = sorted.slice(0, 5);

  const formatted = recent
    .map((note: WorldNote) => `[${note.category.toUpperCase()}] ${note.content}`)
    .join('\n');

  return `WORLD NOTES:\n${formatted}`;
}
