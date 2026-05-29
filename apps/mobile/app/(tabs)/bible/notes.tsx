import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useArc } from '../../../hooks/useArcs.js';
import { useArcStore } from '../../../stores/arcStore.js';
import { Button } from '../../../components/ui/Button.js';
import { Card } from '../../../components/ui/Card.js';
import { Badge } from '../../../components/ui/Badge.js';

const CATEGORY_LABELS: Record<string, string> = {
  lore: 'Lore',
  setting: 'Setting',
  rule: 'Rule',
  foreshadowing: 'Foreshadowing',
  character_detail: 'Character',
};

export default function WorldNotesScreen() {
  const router = useRouter();
  const currentArcId = useArcStore((s) => s.currentArcId);
  const { data: arc, isLoading, error, refetch } = useArc(currentArcId);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-brand-deep items-center justify-center">
        <ActivityIndicator size="large" color="#7c3aed" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-brand-deep items-center justify-center px-6">
        <Text className="text-red-400 text-base text-center mb-4">{error.message}</Text>
        <Button variant="ghost" onPress={() => refetch()}>
          Retry
        </Button>
      </SafeAreaView>
    );
  }

  const arcRecord = arc as Record<string, unknown> | undefined;
  const worldNotes = (arcRecord?.world_notes as Record<string, unknown>[] | undefined) ?? [];

  return (
    <SafeAreaView className="flex-1 bg-brand-deep">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center gap-3 mb-2">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-brand-purple text-base">← Back</Text>
          </TouchableOpacity>
        </View>

        <View className="gap-1 mb-2">
          <Text className="text-gray-400 text-xs uppercase tracking-widest">
            Story Bible
          </Text>
          <Text className="text-white text-2xl font-bold">World Notes</Text>
        </View>

        {worldNotes.length === 0 ? (
          <View className="items-center py-16">
            <Text className="text-4xl mb-4">📝</Text>
            <Text className="text-white text-xl font-bold text-center mb-2">
              No world notes yet
            </Text>
            <Text className="text-gray-400 text-sm text-center">
              World notes are added automatically as chapters are generated.
            </Text>
          </View>
        ) : (
          worldNotes.map((note, i) => {
            const noteId = (note.id as string | undefined) ?? String(i);
            const category = note.category as string | undefined;
            const content = note.content as string | undefined;
            const title = note.title as string | undefined;
            return (
              <Card key={noteId} className="gap-2">
                <View className="flex-row items-center justify-between gap-2">
                  {title ? (
                    <Text className="text-white text-base font-semibold flex-1" numberOfLines={1}>
                      {title}
                    </Text>
                  ) : null}
                  {category ? (
                    <Badge
                      label={CATEGORY_LABELS[category] ?? category}
                      variant="default"
                    />
                  ) : null}
                </View>
                {content ? (
                  <Text className="text-gray-300 text-sm leading-5">{content}</Text>
                ) : null}
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
