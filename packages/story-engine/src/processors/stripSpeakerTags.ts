// Removes [CHARACTER:EMOTION] tags from generated text (for display)
// Keeps the dialogue, removes the tag
// Input: "[ELENA:dark_desire]\"You shouldn't be here,\" she said."
// Output: "\"You shouldn't be here,\" she said."
export function stripSpeakerTags(text: string): string {
  return text.replace(/\[[\w_]+:[\w_]+\]/g, '').trim();
}
