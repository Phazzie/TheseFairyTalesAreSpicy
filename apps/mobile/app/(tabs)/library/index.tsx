import React from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useArcStore } from '../../../stores/arcStore.js';
import { useArcs } from '../../../hooks/useArcs.js';
import { useChapters, useDraftChapters } from '../../../hooks/useChapters.js';
import { ChapterCard } from '../../../components/chapter/ChapterCard.js';
import { Button } from '../../../components/ui/Button.js';
import { useRouter } from 'expo-router';

interface ChapterRecord {
  id: string;
  chapter_number: number;
  title: string;
  word_count?: number;
  cliffhanger_type?: string;
  /** Actual DB column name. */
  spice_level_used?: number;
}

export default function LibraryScreen() {
  const router = useRouter();
  const currentArcId = useArcStore((s) => s.currentArcId);
  const setCurrentArcId = useArcStore((s) => s.setCurrentArcId);
  const { data: arcs } = useArcs();
  const { data: chapters, isLoading, error, refetch, isRefetching } = useChapters(currentArcId);
  const { data: drafts } = useDraftChapters(currentArcId);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-brand-deep items-center justify-center">
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text className="text-gray-400 mt-4 text-sm">Loading chapters...</Text>
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

  const chapterList = (chapters ?? []) as ChapterRecord[];

  return (
    <SafeAreaView className="flex-1 bg-brand-deep">
      <FlatList
        data={chapterList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#7c3aed"
            colors={['#7c3aed']}
          />
        }
        ListHeaderComponent={
          <View className="mb-4">
            {/* Arc Switcher */}
            {arcs && arcs.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 -mx-5 px-0">
                <View className="flex-row gap-2">
                  {arcs.map((a) => {
                    const arcItem = a as Record<string, unknown>;
                    return (
                      <TouchableOpacity
                        key={arcItem.id as string}
                        onPress={() => setCurrentArcId(arcItem.id as string)}
                        className={`px-3 py-1.5 rounded-full border ${
                          arcItem.id === currentArcId
                            ? 'bg-brand-purple border-brand-purple'
                            : 'bg-gray-800 border-gray-700'
                        }`}
                      >
                        <Text className={`text-xs font-medium ${arcItem.id === currentArcId ? 'text-white' : 'text-gray-400'}`}>
                          {(arcItem.title as string | undefined) ?? (arcItem.creature_type as string | undefined)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            <Text className="text-gray-400 text-xs uppercase tracking-widest mb-1">
              Your
            </Text>
            <Text className="text-white text-2xl font-bold mb-4">Chapter Library</Text>

            {/* Drafts section */}
            {drafts && drafts.length > 0 && (
              <View className="mb-4">
                <Text className="text-gray-500 text-xs font-semibold uppercase tracking-widest px-0 mb-2">
                  Drafts ({drafts.length})
                </Text>
                {(drafts as ChapterRecord[]).map((draft) => (
                  <ChapterCard
                    key={draft.id}
                    id={draft.id}
                    chapterNumber={draft.chapter_number}
                    title={draft.title}
                    wordCount={draft.word_count}
                    cliffhangerType={draft.cliffhanger_type}
                    spiceLevel={draft.spice_level_used}
                    isDraft
                  />
                ))}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text className="text-4xl mb-4">📚</Text>
            <Text className="text-white text-xl font-bold text-center mb-2">
              No chapters yet
            </Text>
            <Text className="text-gray-400 text-sm text-center mb-6">
              Generate your first chapter to see it here.
            </Text>
            <Button
              variant="primary"
              onPress={() => router.push('/(tabs)/write')}
            >
              Go Write
            </Button>
          </View>
        }
        renderItem={({ item }) => (
          <ChapterCard
            id={item.id}
            chapterNumber={item.chapter_number}
            title={item.title}
            wordCount={item.word_count}
            cliffhangerType={item.cliffhanger_type}
            spiceLevel={item.spice_level_used}
          />
        )}
      />
    </SafeAreaView>
  );
}
