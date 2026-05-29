// ElevenLabs v2.5 Turbo TTS client
// Edge-runtime compatible (fetch only, no Node.js Buffer)

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';
const DEFAULT_MODEL = 'eleven_turbo_v2_5';

export async function generateSpeech(
  text: string,
  voiceId: string,
  opts?: { stability?: number; similarityBoost?: number },
): Promise<ArrayBuffer> {
  const apiKey = process.env['ELEVENLABS_API_KEY'];
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY env var is required');

  const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: DEFAULT_MODEL,
      voice_settings: {
        stability: opts?.stability ?? 0.5,
        similarity_boost: opts?.similarityBoost ?? 0.75,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error ${response.status}: ${errorText}`);
  }

  return response.arrayBuffer();
}

// Merges multiple audio ArrayBuffers into one MP3
// Simple concatenation for streaming segments — works for MP3
export function mergeAudioChunks(chunks: ArrayBuffer[]): ArrayBuffer {
  const totalLength = chunks.reduce((sum, c) => sum + c.byteLength, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(new Uint8Array(chunk), offset);
    offset += chunk.byteLength;
  }
  return merged.buffer;
}

// Map ElevenLabs voice ID to character slug (stored in voiceLibrary or user config)
// Default voice IDs for testing — replace with real voice IDs from ElevenLabs
export const DEFAULT_VOICE_IDS: Record<string, string> = {
  british_aristocratic: '21m00Tcm4TlvDq8ikWAM', // Rachel
  american_midwest: 'AZnzlk1XvdvUeBnXmlld', // Domi
  irish_lilt: 'EXAVITQu4vr4xnSDxMaL', // Bella
  scottish_brogue: 'ErXwobaYiN019PkySvjV', // Antoni
  eastern_european: 'VR6AewLTigWG4xSOukaG', // Arnold
};
