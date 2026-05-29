import type {
  CharacterProfile,
  Accent,
  EmotionState,
  SpeechPattern,
  ContradictionModel,
} from '@story/engine';
import { adminClient } from './supabase.js';
import type { Database } from './database.types.js';

type CharacterRow = Database['public']['Tables']['characters']['Row'];

// ============================================================
// INPUT TYPES
// ============================================================

export type CreateCharacterInput = {
  arcId: string;
  slug: string;
  displayName: string;
  species: CharacterRow['species'];
  apparentAge?: number;
  trueAge?: number;
  isProtagonist?: boolean;
  accent?: Accent;
  emotionStateIds?: string[];
  vocabRegister: CharacterRow['vocab_register'];
  speechAvgSentenceLength?: 'short' | 'medium' | 'long';
  speechVerbalTic?: string;
  speechSignaturePhrase?: string;
  statedDesire?: string;
  hiddenNeed?: string;
  wound?: string;
  flaw?: string;
  lie?: string;
  bio: string;
  appearance: string;
};

// ============================================================
// MAPPERS
// ============================================================

function dbRowToCharacterProfile(row: CharacterRow): CharacterProfile {
  const accent: Accent = {
    id: row.accent_id ?? '',
    region: row.accent_region ?? '',
  };

  // EmotionState IDs from DB are bare strings; reconstruct minimal EmotionState objects
  const emotionStates: EmotionState[] = (row.emotion_state_ids ?? []).map((id) => ({
    id,
    label: id,
    prosodyNote: '',
  }));

  const speech: SpeechPattern = {
    vocabRegister: row.vocab_register,
    avgSentenceLength: row.speech_avg_sentence_length ?? 'medium',
    verbalTic: row.speech_verbal_tic ?? undefined,
    signaturePhrase: row.speech_signature_phrase ?? undefined,
  };

  const contradiction: ContradictionModel | undefined =
    row.stated_desire && row.hidden_need
      ? { statedDesire: row.stated_desire, hiddenNeed: row.hidden_need }
      : undefined;

  return {
    id: row.id,
    arcId: row.arc_id,
    slug: row.slug,
    displayName: row.display_name,
    species: row.species,
    apparentAge: row.apparent_age ?? 0,
    trueAge: row.true_age ?? 0,
    isProtagonist: row.is_protagonist,
    accent,
    emotionStates,
    vocabRegister: row.vocab_register,
    speech,
    contradiction,
    wound: row.wound ?? undefined,
    flaw: row.flaw ?? undefined,
    lie: row.lie ?? undefined,
    bio: row.bio,
    appearance: row.appearance,
    createdAt: row.created_at,
  };
}

function createInputToDbInsert(
  data: CreateCharacterInput,
): Database['public']['Tables']['characters']['Insert'] {
  return {
    arc_id: data.arcId,
    slug: data.slug,
    display_name: data.displayName,
    species: data.species,
    apparent_age: data.apparentAge ?? null,
    true_age: data.trueAge ?? null,
    is_protagonist: data.isProtagonist ?? false,
    accent_id: data.accent?.id ?? null,
    accent_region: data.accent?.region ?? null,
    emotion_state_ids: data.emotionStateIds ?? [],
    vocab_register: data.vocabRegister,
    speech_avg_sentence_length: data.speechAvgSentenceLength ?? null,
    speech_verbal_tic: data.speechVerbalTic ?? null,
    speech_signature_phrase: data.speechSignaturePhrase ?? null,
    stated_desire: data.statedDesire ?? null,
    hidden_need: data.hiddenNeed ?? null,
    wound: data.wound ?? null,
    flaw: data.flaw ?? null,
    lie: data.lie ?? null,
    bio: data.bio,
    appearance: data.appearance,
  };
}

// ============================================================
// QUERIES
// ============================================================

export async function getCharacters(arcId: string): Promise<CharacterProfile[]> {
  const { data, error } = await adminClient
    .from('characters')
    .select('*')
    .eq('arc_id', arcId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch characters for arc ${arcId}: ${error.message}`);
  }

  return (data ?? []).map(dbRowToCharacterProfile);
}

export async function getCharacter(characterId: string): Promise<CharacterProfile> {
  const { data, error } = await adminClient
    .from('characters')
    .select('*')
    .eq('id', characterId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch character ${characterId}: ${error.message}`);
  }
  if (!data) {
    throw new Error(`Character ${characterId} not found`);
  }

  return dbRowToCharacterProfile(data);
}

export async function createCharacter(data: CreateCharacterInput): Promise<CharacterProfile> {
  const insert = createInputToDbInsert(data);

  const { data: created, error } = await adminClient
    .from('characters')
    .insert(insert)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create character: ${error.message}`);
  }
  if (!created) {
    throw new Error('Character creation returned no data');
  }

  return dbRowToCharacterProfile(created);
}

export async function updateCharacter(
  characterId: string,
  patch: Partial<CreateCharacterInput>,
): Promise<CharacterProfile> {
  const update: Database['public']['Tables']['characters']['Update'] = {};

  if (patch.slug !== undefined) update.slug = patch.slug;
  if (patch.displayName !== undefined) update.display_name = patch.displayName;
  if (patch.species !== undefined) update.species = patch.species;
  if (patch.apparentAge !== undefined) update.apparent_age = patch.apparentAge ?? null;
  if (patch.trueAge !== undefined) update.true_age = patch.trueAge ?? null;
  if (patch.isProtagonist !== undefined) update.is_protagonist = patch.isProtagonist;
  if (patch.accent !== undefined) {
    update.accent_id = patch.accent?.id ?? null;
    update.accent_region = patch.accent?.region ?? null;
  }
  if (patch.emotionStateIds !== undefined) update.emotion_state_ids = patch.emotionStateIds;
  if (patch.vocabRegister !== undefined) update.vocab_register = patch.vocabRegister;
  if (patch.speechAvgSentenceLength !== undefined)
    update.speech_avg_sentence_length = patch.speechAvgSentenceLength ?? null;
  if (patch.speechVerbalTic !== undefined) update.speech_verbal_tic = patch.speechVerbalTic ?? null;
  if (patch.speechSignaturePhrase !== undefined)
    update.speech_signature_phrase = patch.speechSignaturePhrase ?? null;
  if (patch.statedDesire !== undefined) update.stated_desire = patch.statedDesire ?? null;
  if (patch.hiddenNeed !== undefined) update.hidden_need = patch.hiddenNeed ?? null;
  if (patch.wound !== undefined) update.wound = patch.wound ?? null;
  if (patch.flaw !== undefined) update.flaw = patch.flaw ?? null;
  if (patch.lie !== undefined) update.lie = patch.lie ?? null;
  if (patch.bio !== undefined) update.bio = patch.bio;
  if (patch.appearance !== undefined) update.appearance = patch.appearance;

  const { data: updated, error } = await adminClient
    .from('characters')
    .update(update)
    .eq('id', characterId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update character ${characterId}: ${error.message}`);
  }
  if (!updated) {
    throw new Error(`Character ${characterId} not found`);
  }

  return dbRowToCharacterProfile(updated);
}

export async function deleteCharacter(characterId: string): Promise<void> {
  const { error } = await adminClient
    .from('characters')
    .delete()
    .eq('id', characterId);

  if (error) {
    throw new Error(`Failed to delete character ${characterId}: ${error.message}`);
  }
}
