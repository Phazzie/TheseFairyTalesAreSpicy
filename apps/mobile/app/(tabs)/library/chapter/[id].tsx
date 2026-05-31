import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  status?: string;
  word_count?: number;
  /** Actual DB column name. */
  spice_level_used?: number;
  cliffhanger_type?: string;
  /** Actual DB column name. */
  generation_attempt?: number;
  beat_used?: string;
  emotional_arc?: string;
  /** Actual DB column name. */
  dialogue_ratio_pct?: number;
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
  // canRegenerate is determined by the server (429 = limit hit), not a client-side count
  const [canRegenerate, setCanRegenerate] = useState(true);
  const openUpgradeSheet = useUIStore((s) => s.openUpgradeSheet);

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
      if (res.status === 429) {
        setCanRegenerate(false);
        openUpgradeSheet();
        return;
      }
      if (!res.ok) throw new Error('Regeneration failed');
      router.push({
        pathname: '/(tabs)/write/generate',
        params: {
          arcId: chapter.arc_id,
          chapterNumber: String(chapter.chapter_number),
          priorChapterId: chapter.id,
        },
      } as never);
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
  const generationAttempt = ch.generation_attempt ?? 1;

  const paragraphs = useMemo(() =>
    (ch.content ?? '').split(/\n\n+/).filter(p => p.trim().length > 0),
    [ch.content]
  );

  async function handleShare() {
    await Share.share({
      title: ch.title ?? `Chapter ${ch.chapter_number}`,
      message: `${ch.title ?? `Chapter ${ch.chapter_number}`}\n\n${ch.content ?? ''}`,
    });
  }

  const [publishing, setPublishing] = useState(false);

  async function handlePublishDraft() {
    setPublishing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { openUpgradeSheet(); return; }
      const res = await fetch(
        `${process.env['EXPO_PUBLIC_API_URL'] ?? ''}/api/arcs/${ch.arc_id}/chapters/${ch.id}/publish`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        },
      );
      if (!res.ok) throw new Error('Publish failed');
      refetch();
    } catch {
      // silently fall back
    } finally {
      setPublishing(false);
    }
  }

  async function handleDiscardDraft() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await fetch(
        `${process.env['EXPO_PUBLIC_API_URL'] ?? ''}/api/arcs/${ch.arc_id}/chapters/${ch.id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        },
      );
      router.back();
    } catch {
      // silently fall back
    }
  }

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
            onPress={() => { void handleShare(); }}
            className="bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg"
          >
            <Text className="text-gray-300 text-xs font-semibold">Share</Text>
          </TouchableOpacity>
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
          {ch.spice_level_used != null ? (
            <Badge
              label={SPICE_LEVEL_LABELS[ch.spice_level_used] ?? `Level ${ch.spice_level_used}`}
              variant="spice"
              spiceLevel={ch.spice_level_used}
            />
          ) : null}
          {ch.word_count != null ? (
            <Badge
              label={`${ch.word_count.toLocaleString()} words`}
              variant="default"
            />
          ) : null}
          <Badge
            label={`Attempt ${generationAttempt}`}
            variant="default"
          />
        </View>

        {/* Meta panel */}
        {metaOpen ? (
          <View className="mb-6">
            <ChapterMetaPanel
              meta={{
                beatUsed: ch.beat_used,
                emotionalArc: ch.emotional_arc,
                dialogueRatio: ch.dialogue_ratio_pct,
                chekhovSeeded: ch.chekhov_seeded,
                engineVersion: ch.engine_version,
              }}
            />
          </View>
        ) : null}

        {/* Chapter content as mapped paragraphs — FlatList inside ScrollView crashes React Native */}
        {paragraphs.map((paragraph, index) => (
          <Text
            key={`p-${index}`}
            className="text-gray-100 text-base leading-8 mb-4"
            style={{ fontFamily: 'serif' }}
            selectable
          >
            {paragraph}
          </Text>
        ))}

        {/* Bottom actions */}
        <View className="mt-10 gap-3">
          {/* Draft actions */}
          {ch.status === 'draft' && (
            <View className="gap-3">
              <Button variant="primary" onPress={() => { void handlePublishDraft(); }} loading={publishing} size="lg" className="w-full">
                Publish This Version
              </Button>
              <Button variant="destructive" onPress={() => { void handleDiscardDraft(); }} size="md" className="w-full">
                Discard Draft
              </Button>
            </View>
          )}

          {/* Listen — feature not yet available */}
          <Button variant="ghost" size="sm" disabled className="opacity-40 w-full">
            🎧 Audio Narration — Coming Soon
          </Button>

          {/* Primary CTA: Continue the story — only for published chapters */}
          {ch.status !== 'draft' && (
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onPress={() => {
                router.push({
                  pathname: '/(tabs)/write/generate',
                  params: {
                    arcId: ch.arc_id,
                    chapterNumber: String((ch.chapter_number ?? 1) + 1),
                    ...(ch.id ? { priorChapterId: ch.id } : {}),
                  },
                } as never);
              }}
            >
              Continue — Chapter {(ch.chapter_number ?? 1) + 1}
            </Button>
          )}

          {/* Regenerate — only for published chapters */}
          {ch.status !== 'draft' && (
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
                ? `Regenerate (Attempt ${generationAttempt})`
                : 'Regeneration limit reached'}
            </Button>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
