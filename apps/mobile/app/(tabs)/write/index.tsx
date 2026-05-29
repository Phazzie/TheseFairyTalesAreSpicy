import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useArcs } from '../../../hooks/useArcs.js';
import { useChapters } from '../../../hooks/useChapters.js';
import { useArcStore } from '../../../stores/arcStore.js';
import { useAuthStore } from '../../../stores/authStore.js';
import { Button } from '../../../components/ui/Button.js';
import { Badge } from '../../../components/ui/Badge.js';
import { CREATURE_LABELS, SPICE_LEVEL_LABELS } from '../../../lib/constants.js';

export default function WriteIndexScreen() {
  const router = useRouter();
  const { data: arcs, isLoading, error, refetch } = useArcs();
  const { currentArcId, setCurrentArcId, currentArc, isGenerating } = useArcStore();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Resolve currently displayed arc
  const arc =
    currentArc ??
    (arcs && arcs.length > 0 ? (arcs[0] as Record<string, unknown>) : null);

  const arcId = (arc as Record<string, unknown> | null)?.id as string | undefined;

  // Fetch chapters for the current arc
  const { data: chaptersData } = useChapters(arcId ?? null);

  // Sync store if needed
  React.useEffect(() => {
    if (!currentArcId && arcs && arcs.length > 0) {
      const firstArc = arcs[0] as Record<string, unknown>;
      setCurrentArcId(firstArc.id as string);
    }
  }, [arcs, currentArcId, setCurrentArcId]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-brand-deep items-center justify-center">
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text className="text-gray-400 mt-4 text-sm">Loading your stories...</Text>
      </SafeAreaView>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-brand-deep items-center justify-center px-6">
        <Text className="text-red-400 text-lg font-semibold text-center mb-2">
          Something went wrong
        </Text>
        <Text className="text-gray-500 text-sm text-center mb-6">
          {error.message}
        </Text>
        <Button variant="ghost" onPress={() => refetch()}>
          Try Again
        </Button>
      </SafeAreaView>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────
  if (!arcs || arcs.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-brand-deep items-center justify-center px-6">
        <Text className="text-5xl mb-4">✨</Text>
        <Text className="text-white text-2xl font-bold text-center mb-2">
          Your story begins here
        </Text>
        <Text className="text-gray-400 text-base text-center mb-8">
          Create your first arc and let the magic begin.
        </Text>
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onPress={() => router.push('/arc-wizard/step-1')}
        >
          Create Your First Arc
        </Button>
      </SafeAreaView>
    );
  }

  // ── Arc data helpers ─────────────────────────────────────────────────────
  const arcRecord = arc as Record<string, unknown>;
  const creatureType = arcRecord?.creature_type as string | undefined;
  const spiceLevel = arcRecord?.default_spice_level as number | undefined;
  const chapters = (chaptersData as Record<string, unknown>[] | undefined) ?? [];
  const lastChapter =
    chapters.length > 0 ? chapters[chapters.length - 1] : null;
  const nextChapterNumber = chapters.length + 1;

  return (
    <SafeAreaView className="flex-1 bg-brand-deep">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, gap: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />}
      >
        {/* Header */}
        <View className="gap-1">
          <TouchableOpacity
            onPress={() => useAuthStore.getState().signOut()}
            className="absolute top-4 right-4 p-2"
            accessibilityLabel="Sign out"
          >
            <Text className="text-gray-500 text-sm">Sign out</Text>
          </TouchableOpacity>
          <Text className="text-gray-400 text-xs uppercase tracking-widest">
            Current Arc
          </Text>
          <Text className="text-white text-3xl font-bold">
            {(arcRecord?.title as string | undefined) ?? 'Untitled Arc'}
          </Text>
          <View className="flex-row gap-2 mt-1 flex-wrap">
            {creatureType ? (
              <Badge
                label={CREATURE_LABELS[creatureType] ?? creatureType}
                variant="creature"
              />
            ) : null}
            {spiceLevel != null ? (
              <Badge
                label={SPICE_LEVEL_LABELS[spiceLevel] ?? `Level ${spiceLevel}`}
                variant="spice"
                spiceLevel={spiceLevel}
              />
            ) : null}
          </View>
        </View>

        {/* Last chapter cliffhanger */}
        {lastChapter ? (
          <View className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
            <Text className="text-gray-500 text-xs uppercase tracking-wide mb-1">
              Where we left off
            </Text>
            <Text className="text-gray-300 text-sm leading-5">
              {(lastChapter.cliffhanger_summary as string | undefined) ??
                'Chapter ' +
                  String(lastChapter.chapter_number) +
                  ' — ' +
                  String(lastChapter.title ?? 'Published')}
            </Text>
          </View>
        ) : (
          <View className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
            <Text className="text-gray-500 text-sm italic">
              No chapters yet. Start writing to begin the adventure.
            </Text>
          </View>
        )}

        {/* Welcome callout — shown only when user just created their first arc with no chapters yet */}
        {arcs && arcs.length === 1 && chapters && chapters.length === 0 && (
          <View className="bg-brand-purple/20 border border-brand-purple/40 rounded-xl p-4">
            <Text className="text-brand-purple font-semibold mb-1">Your arc is ready! ✨</Text>
            <Text className="text-gray-300 text-sm">Tap "Begin Chapter 1" below to generate your first chapter.</Text>
          </View>
        )}

        {/* Generating indicator */}
        {isGenerating ? (
          <View className="flex-row items-center gap-3 bg-brand-purple/10 border border-brand-purple/40 rounded-xl p-4">
            <ActivityIndicator size="small" color="#7c3aed" />
            <Text className="text-brand-purple text-sm font-medium">
              Generating your chapter...
            </Text>
          </View>
        ) : null}

        {/* Continue Story */}
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={isGenerating || !arcId}
          onPress={() =>
            router.push({
              pathname: '/(tabs)/write/generate',
              params: {
                arcId,
                chapterNumber: String(nextChapterNumber),
                priorChapterId: (lastChapter as Record<string, unknown> | null)?.id as string | undefined,
              },
            })
          }
        >
          {chapters.length === 0 ? 'Begin Chapter 1' : `Continue — Chapter ${nextChapterNumber}`}
        </Button>

        {/* New Arc */}
        <Button
          variant="ghost"
          size="md"
          className="w-full"
          onPress={() => router.push('/arc-wizard/step-1')}
        >
          + New Arc
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
