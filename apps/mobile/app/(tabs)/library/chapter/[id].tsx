import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useChapter } from '../../../../hooks/useChapters.js';
import { ChapterMetaPanel } from '../../../../components/chapter/ChapterMetaPanel.js';
import { Button } from '../../../../components/ui/Button.js';
import { Badge } from '../../../../components/ui/Badge.js';
import { SPICE_LEVEL_LABELS } from '../../../../lib/constants.js';
import { useUIStore } from '../../../../stores/uiStore.js';
import { supabase } from '../../../../lib/supabase.js';

interface ChapterRecord {
  id: string;
  arc_id: string;
  chapter_number: number;
  title: string;
  content: string;
  word_count?: number;
  spice_level?: number;
  cliffhanger_type?: string;
  attempt_count?: number;
  beat_used?: string;
  emotional_arc?: string;
  dialogue_ratio?: number;
  chekhov_seeded?: string[];
  engine_version?: string;
  has_audio?: boolean;
}

export default function ChapterDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: chapter, isLoading, error, refetch } = useChapter(id ?? null);
  const [metaOpen, setMetaOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const { openUpgradeSheet } = useUIStore();

  async function handleRegenerate() {
    if (!chapter) return;
    setRegenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { openUpgradeSheet(); return; }
      const res = await fetch(
        `${process.env['EXPO_PUBLIC_API_URL'] ?? ''}/api/arcs/${chapter.arc_id}/chapters/${chapter.id}/regenerate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        },
      );
      if (res.status === 429) { openUpgradeSheet(); return; }
      if (!res.ok) throw new Error('Regeneration failed');
      router.push('/(tabs)/write/generate' as never);
    } catch {
      // Error shown via alert in a real app — for now just re-enable the button
    } finally {
      setRegenerating(false);
    }
  }

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
        <Text className="text-red-400 text-base text-center mb-4">
          {error.message}
        </Text>
        <Button variant="ghost" onPress={() => refetch()}>
          Retry
        </Button>
        <Button variant="ghost" className="mt-2" onPress={() => router.back()}>
          Go Back
        </Button>
      </SafeAreaView>
    );
  }

  if (!chapter) {
    return (
      <SafeAreaView className="flex-1 bg-brand-deep items-center justify-center px-6">
        <Text className="text-gray-400 text-base">Chapter not found.</Text>
        <Button variant="ghost" className="mt-4" onPress={() => router.back()}>
          Go Back
        </Button>
      </SafeAreaView>
    );
  }

  const ch = chapter as unknown as ChapterRecord;
  const attemptCount = ch.attempt_count ?? 1;
  const maxAttempts = 3; // pro tier limit; free = 1
  const canRegenerate = attemptCount < maxAttempts;

  return (
    <SafeAreaView className="flex-1 bg-brand-deep">
      {/* Back + action row */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center gap-1"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text className="text-gray-400 text-xl">‹</Text>
          <Text className="text-gray-400 text-sm">Library</Text>
        </TouchableOpacity>

        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => setMetaOpen((o) => !o)}
            className="bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg"
          >
            <Text className="text-gray-300 text-xs font-semibold">
              {metaOpen ? 'Hide Meta' : 'Metadata'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Chapter number */}
        <Text className="text-brand-purple text-xs font-semibold uppercase tracking-widest mt-2">
          Chapter {ch.chapter_number}
        </Text>

        {/* Title */}
        <Text className="text-white text-3xl font-bold mt-1 mb-2 leading-9">
          {ch.title}
        </Text>

        {/* Badges row */}
        <View className="flex-row flex-wrap gap-2 mb-6">
          {ch.spice_level != null ? (
            <Badge
              label={SPICE_LEVEL_LABELS[ch.spice_level] ?? `Level ${ch.spice_level}`}
              variant="spice"
              spiceLevel={ch.spice_level}
            />
          ) : null}
          {ch.word_count != null ? (
            <Badge
              label={`${ch.word_count.toLocaleString()} words`}
              variant="default"
            />
          ) : null}
        </View>

        {/* Meta panel */}
        {metaOpen ? (
          <View className="mb-6">
            <ChapterMetaPanel
              meta={{
                beatUsed: ch.beat_used,
                emotionalArc: ch.emotional_arc,
                dialogueRatio: ch.dialogue_ratio,
                chekhovSeeded: ch.chekhov_seeded,
                engineVersion: ch.engine_version,
              }}
            />
          </View>
        ) : null}

        {/* Chapter content */}
        <Text
          className="text-gray-100 text-base leading-8"
          style={{ fontFamily: 'serif' }}
        >
          {ch.content ?? ''}
        </Text>

        {/* Bottom actions */}
        <View className="mt-10 gap-3">
          {/* Listen */}
          <Button
            variant="ghost"
            size="lg"
            className="w-full"
            onPress={() =>
              router.push({
                pathname: '/audio/[chapterId]',
                params: { chapterId: ch.id },
              })
            }
          >
            🎧 Listen to Chapter
          </Button>

          {/* Regenerate */}
          <Button
            variant="ghost"
            size="md"
            className="w-full"
            disabled={!canRegenerate || regenerating}
            loading={regenerating}
            onPress={() => {
              if (!canRegenerate) {
                openUpgradeSheet();
                return;
              }
              void handleRegenerate();
            }}
          >
            {canRegenerate
              ? `Regenerate (${attemptCount}/${maxAttempts} attempts)`
              : `Max regenerations reached (${attemptCount}/${maxAttempts})`}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
