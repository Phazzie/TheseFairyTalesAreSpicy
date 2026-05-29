import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../../lib/supabase.js';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useArcWithDetails } from '../../../../hooks/useArcs.js';
import { useArcStore } from '../../../../stores/arcStore.js';
import { Card } from '../../../../components/ui/Card.js';
import { Button } from '../../../../components/ui/Button.js';
import { Input } from '../../../../components/ui/Input.js';

type CharacterRecord = Record<string, unknown>;

function PsychCard({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <Card className="gap-1">
      <Text className="text-gray-500 text-xs uppercase tracking-wide">{label}</Text>
      <Text className="text-gray-100 text-sm leading-5">{value}</Text>
    </Card>
  );
}

interface EditModalProps {
  visible: boolean;
  character: CharacterRecord;
  onClose: () => void;
  onSave: (updated: CharacterRecord) => void;
}

function EditModal({ visible, character, onClose, onSave }: EditModalProps) {
  const [form, setForm] = useState<CharacterRecord>({
    ...character,
    // Ensure correct column names are pre-filled
    display_name: character.display_name ?? '',
    stated_desire: character.stated_desire ?? '',
    hidden_need: character.hidden_need ?? '',
    wound: character.wound ?? '',
    flaw: character.flaw ?? '',
    lie: character.lie ?? '',
  });

  const field = (key: string) => (text: string) =>
    setForm((f) => ({ ...f, [key]: text }));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-brand-deep border border-gray-800 rounded-t-3xl px-6 pt-6 pb-10 max-h-5/6">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-white text-xl font-bold">Edit Character</Text>
              <TouchableOpacity onPress={onClose}>
                <Text className="text-gray-400 text-2xl">✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} className="gap-4">
              <View className="gap-4">
                <Input
                  label="Name"
                  value={form.display_name as string}
                  onChangeText={field('display_name')}
                />
                <Input
                  label="Species"
                  value={form.species as string}
                  onChangeText={field('species')}
                />
                <Input
                  label="What does she want?"
                  value={form.stated_desire as string}
                  onChangeText={field('stated_desire')}
                  multiline
                />
                <Input
                  label="What does she actually need?"
                  value={form.hidden_need as string}
                  onChangeText={field('hidden_need')}
                  multiline
                />
                <Input
                  label="Her wound"
                  value={form.wound as string}
                  onChangeText={field('wound')}
                  multiline
                />
                <Input
                  label="Her flaw"
                  value={form.flaw as string}
                  onChangeText={field('flaw')}
                  multiline
                />
                <Input
                  label="The lie she believes"
                  value={form.lie as string}
                  onChangeText={field('lie')}
                  multiline
                />
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full mt-2"
                  onPress={() => {
                    onSave(form);
                    onClose();
                  }}
                >
                  Save Changes
                </Button>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function CharacterDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentArcId = useArcStore((s) => s.currentArcId);
  const { data, isLoading, error } = useArcWithDetails(currentArcId);
  const [editVisible, setEditVisible] = useState(false);
  const queryClient = useQueryClient();

  const updateCharacterMutation = useMutation({
    mutationFn: async ({ characterId, updated }: { characterId: string; updated: CharacterRecord }) => {
      // Exclude read-only / relational fields from the update payload
      const { id: _id, arc_id: _arcId, created_at: _createdAt, ...updatePayload } = updated;
      const { error: updateError } = await supabase
        .from('characters')
        .update(updatePayload)
        .eq('id', characterId);
      if (updateError) throw new Error(updateError.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arc-details', currentArcId] });
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-brand-deep items-center justify-center">
        <Text className="text-gray-400">Loading...</Text>
      </SafeAreaView>
    );
  }

  if (error || !data?.arc) {
    return (
      <SafeAreaView className="flex-1 bg-brand-deep items-center justify-center px-6">
        <Text className="text-red-400 text-base text-center">
          {error?.message ?? 'Character not found'}
        </Text>
        <Button variant="ghost" className="mt-4" onPress={() => router.back()}>
          Go Back
        </Button>
      </SafeAreaView>
    );
  }

  const characters = data.characters as CharacterRecord[];

  const character: CharacterRecord | undefined =
    characters.find((c) => c.id === id) ??
    characters.find((c) => c.is_protagonist) ?? // fallback to protagonist
    undefined;

  if (!character) {
    return (
      <SafeAreaView className="flex-1 bg-brand-deep items-center justify-center px-6">
        <Text className="text-red-400 text-base">Character not found</Text>
        <Button variant="ghost" className="mt-4" onPress={() => router.back()}>
          Go Back
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-deep">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back + Edit header */}
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center gap-1"
          >
            <Text className="text-gray-400 text-xl">‹</Text>
            <Text className="text-gray-400 text-sm">Bible</Text>
          </TouchableOpacity>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => setEditVisible(true)}
          >
            Edit
          </Button>
        </View>

        {/* Name + species */}
        <View className="gap-1">
          <Text className="text-white text-3xl font-bold">
            {(character.display_name as string | undefined) ?? 'Unknown'}
          </Text>
          <Text className="text-gray-400 text-sm capitalize">
            {(character.species as string | undefined) ?? '—'}
            {character.age ? ` · ${String(character.age)}` : ''}
          </Text>
        </View>

        {/* Desire / Need */}
        <Card className="gap-3">
          <View>
            <Text className="text-gray-500 text-xs uppercase tracking-wide">
              Wants
            </Text>
            <Text className="text-gray-100 text-sm mt-0.5 leading-5">
              {(character.stated_desire as string | undefined) ?? '—'}
            </Text>
          </View>
          <View className="border-t border-gray-800 pt-3">
            <Text className="text-gray-500 text-xs uppercase tracking-wide">
              Actually Needs
            </Text>
            <Text className="text-gray-100 text-sm mt-0.5 leading-5">
              {(character.hidden_need as string | undefined) ?? '—'}
            </Text>
          </View>
        </Card>

        {/* Psychology */}
        <PsychCard label="Wound" value={character.wound as string | undefined} />
        <PsychCard label="Flaw" value={character.flaw as string | undefined} />
        <PsychCard
          label="The Lie She Believes"
          value={character.lie as string | undefined}
        />

        {/* Speech */}
        {character.speech_pattern ? (
          <Card className="gap-2">
            <Text className="text-gray-500 text-xs uppercase tracking-wide">
              Speech Pattern
            </Text>
            {(character.speech_pattern as Record<string, unknown>).vocab_register ? (
              <Text className="text-gray-300 text-sm">
                Vocab:{' '}
                {String(
                  (character.speech_pattern as Record<string, unknown>).vocab_register,
                )}
              </Text>
            ) : null}
            {(character.speech_pattern as Record<string, unknown>).sentence_length ? (
              <Text className="text-gray-300 text-sm">
                Sentences:{' '}
                {String(
                  (character.speech_pattern as Record<string, unknown>).sentence_length,
                )}
              </Text>
            ) : null}
            {(character.speech_pattern as Record<string, unknown>).verbal_tic ? (
              <Text className="text-gray-300 text-sm italic">
                Verbal tic: "
                {String(
                  (character.speech_pattern as Record<string, unknown>).verbal_tic,
                )}
                "
              </Text>
            ) : null}
          </Card>
        ) : null}

        {/* Bio */}
        {character.bio ? (
          <Card>
            <Text className="text-gray-500 text-xs uppercase tracking-wide mb-1">
              Bio
            </Text>
            <Text className="text-gray-200 text-sm leading-5">
              {character.bio as string}
            </Text>
          </Card>
        ) : null}

        {/* Appearance */}
        {character.appearance ? (
          <Card>
            <Text className="text-gray-500 text-xs uppercase tracking-wide mb-1">
              Appearance
            </Text>
            <Text className="text-gray-200 text-sm leading-5">
              {character.appearance as string}
            </Text>
          </Card>
        ) : null}
      </ScrollView>

      <EditModal
        visible={editVisible}
        character={character}
        onClose={() => setEditVisible(false)}
        onSave={(updated) => {
          updateCharacterMutation.mutate({ characterId: character.id as string, updated });
          setEditVisible(false);
        }}
      />
    </SafeAreaView>
  );
}
