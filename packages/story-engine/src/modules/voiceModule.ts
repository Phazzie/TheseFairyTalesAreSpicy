import type { ArcContext, GenerationInput, CharacterProfile } from '../types/index.js';
import voiceData from '../data/voiceLibrary.json';

interface VoiceEmotionState {
  id: string;
  label: string;
  prosodyNote: string;
}

interface VoiceAccentEntry {
  accentId: string;
  region: string;
  voiceNote: string;
  emotionStates: VoiceEmotionState[];
}

const voiceLibrary = voiceData as VoiceAccentEntry[];

function findAccentEntry(accentId: string): VoiceAccentEntry | undefined {
  return voiceLibrary.find((entry) => entry.accentId === accentId);
}

function formatCharacterVoice(char: CharacterProfile): string {
  const lines: string[] = [];
  lines.push(`${char.displayName} (${char.slug}):`);
  lines.push(`  Accent: ${char.accent.region}`);
  lines.push(`  Vocab Register: ${char.vocabRegister}`);

  const accentEntry = findAccentEntry(char.accent.id);
  if (accentEntry) {
    lines.push(`  Voice Note: ${accentEntry.voiceNote}`);
  }

  if (char.speech.avgSentenceLength) {
    lines.push(`  Sentence Length: ${char.speech.avgSentenceLength}`);
  }

  if (char.speech.verbalTic) {
    lines.push(`  Verbal Tic: ${char.speech.verbalTic}`);
  }

  if (char.speech.signaturePhrase) {
    lines.push(`  Signature Phrase: "${char.speech.signaturePhrase}"`);
  }

  if (accentEntry && accentEntry.emotionStates.length > 0) {
    lines.push('  Emotion States:');
    for (const state of accentEntry.emotionStates) {
      lines.push(`    [${state.id}] ${state.label}: ${state.prosodyNote}`);
    }
  }

  return lines.join('\n');
}

export function voiceModule(input: GenerationInput, context: ArcContext): string {
  if (!context.characters || context.characters.length === 0) {
    return '';
  }

  const formatted = context.characters.map((char) => formatCharacterVoice(char)).join('\n\n');

  return `CHARACTER VOICES:\n${formatted}`;
}
