import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useArcStore } from '../../../stores/arcStore.js';
import { useArcs } from '../../../hooks/useArcs.js';
import { useAllThreads, useResolveThread, useAbandonThread } from '../../../hooks/usePlotThreads.js';
import { Button } from '../../../components/ui/Button.js';
import { Badge } from '../../../components/ui/Badge.js';

type ThreadType = 'chekhov' | 'callback' | 'dramatic_irony' | 'open' | string;

/** Matches the actual plot_threads DB columns. */
interface PlotThread {
  id: string;
  arc_id: string;
  /** Primary text for the thread — there is no 'title' column. */
  description: string;
  status: 'open' | 'resolved' | 'abandoned';
  planted_in_chapter: number | null;
  resolved_in_chapter: number | null;
  expected_payoff_chapter: string | null;
  thread_type?: ThreadType;
  created_at: string;
}

const THREAD_BORDER: Record<string, string> = {
  chekhov: 'border-l-4 border-l-red-500',
  callback: 'border-l-4 border-l-blue-500',
  dramatic_irony: 'border-l-4 border-l-purple-500',
};

const THREAD_BADGE_VARIANT: Record<string, 'chekhov' | 'callback' | 'dramatic-irony' | 'default'> =
  {
    chekhov: 'chekhov',
    callback: 'callback',
    dramatic_irony: 'dramatic-irony',
  };

interface ThreadCardProps {
  thread: PlotThread;
  onTap: () => void;
}

function ThreadCard({ thread, onTap }: ThreadCardProps) {
  const borderClass =
    thread.thread_type && THREAD_BORDER[thread.thread_type]
      ? THREAD_BORDER[thread.thread_type]
      : 'border-l-4 border-l-gray-700';

  const badgeVariant =
    thread.thread_type && THREAD_BADGE_VARIANT[thread.thread_type]
      ? THREAD_BADGE_VARIANT[thread.thread_type]
      : 'default';

  return (
    <TouchableOpacity
      onPress={onTap}
      activeOpacity={0.75}
      accessibilityRole="button"
      className={`bg-gray-900/80 rounded-xl p-4 mb-3 ${borderClass}`}
    >
      <View className="flex-row items-start justify-between gap-2">
        <Text className="text-white text-base font-semibold flex-1" numberOfLines={2}>
          {thread.description}
        </Text>
        {thread.thread_type ? (
          <Badge
            label={thread.thread_type.replace(/_/g, ' ')}
            variant={badgeVariant}
          />
        ) : null}
      </View>

      <View className="flex-row gap-4 mt-2">
        {thread.planted_in_chapter != null ? (
          <Text className="text-gray-600 text-xs">
            Planted ch. {thread.planted_in_chapter}
          </Text>
        ) : null}
        {thread.expected_payoff_chapter ? (
          <Text className="text-gray-600 text-xs" numberOfLines={1}>
            Payoff: {thread.expected_payoff_chapter}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

interface ThreadDetailModalProps {
  thread: PlotThread | null;
  onClose: () => void;
  onResolve: (threadId: string) => void;
  onAbandon: (threadId: string) => void;
  resolving: boolean;
  abandoning: boolean;
  abandonError: string | null;
}

function ThreadDetailModal({
  thread,
  onClose,
  onResolve,
  onAbandon,
  resolving,
  abandoning,
  abandonError,
}: ThreadDetailModalProps) {
  if (!thread) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-end">
        <View className="bg-brand-deep border border-gray-800 rounded-t-3xl px-6 pt-6 pb-10">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-xl font-bold flex-1 mr-4" numberOfLines={2}>
              {thread.description}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-gray-400 text-2xl">✕</Text>
            </TouchableOpacity>
          </View>

          <View className="gap-2 mb-6">
            {thread.planted_in_chapter != null ? (
              <Text className="text-gray-500 text-sm">
                Planted in Chapter {thread.planted_in_chapter}
              </Text>
            ) : null}
            {thread.expected_payoff_chapter ? (
              <Text className="text-gray-500 text-sm">
                Expected payoff: {thread.expected_payoff_chapter}
              </Text>
            ) : null}
          </View>

          {abandonError ? (
            <Text className="text-red-400 text-sm text-center mb-3">{abandonError}</Text>
          ) : null}

          {thread.status === 'open' ? (
            <View className="gap-3">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                loading={resolving}
                onPress={() => onResolve(thread.id)}
              >
                Mark Resolved
              </Button>
              <Button
                variant="destructive"
                size="md"
                className="w-full"
                loading={abandoning}
                onPress={() => onAbandon(thread.id)}
              >
                Abandon Thread
              </Button>
            </View>
          ) : (
            <View className="bg-green-900/30 border border-green-700/50 rounded-xl p-3">
              <Text className="text-green-300 text-sm text-center font-semibold">
                Resolved
                {thread.resolved_in_chapter != null
                  ? ` in Chapter ${thread.resolved_in_chapter}`
                  : ''}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function ThreadsScreen() {
  const currentArcId = useArcStore((s) => s.currentArcId);
  const setCurrentArcId = useArcStore((s) => s.setCurrentArcId);
  const { data: arcs } = useArcs();
  const { data: allThreads, isLoading, error, refetch } = useAllThreads(currentArcId);
  const resolveThread = useResolveThread();
  const abandonThread = useAbandonThread();
  const [selectedThread, setSelectedThread] = useState<PlotThread | null>(null);
  const [abandonError, setAbandonError] = useState<string | null>(null);
  const [showThreadsCard, setShowThreadsCard] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('seen_threads_card').then((val) => {
      if (!val) setShowThreadsCard(true);
    });
  }, []);

  function dismissThreadsCard() {
    setShowThreadsCard(false);
    AsyncStorage.setItem('seen_threads_card', '1');
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
        <Text className="text-red-400 text-base text-center mb-4">{error.message}</Text>
        <Button variant="ghost" onPress={() => refetch()}>
          Retry
        </Button>
      </SafeAreaView>
    );
  }

  const threads = (allThreads ?? []) as PlotThread[];
  const open = threads.filter((t) => t.status === 'open');
  const resolved = threads.filter((t) => t.status === 'resolved');
  const abandoned = threads.filter((t) => t.status === 'abandoned');

  return (
    <SafeAreaView className="flex-1 bg-brand-deep">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Arc Switcher */}
        {arcs && arcs.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 -mx-5 px-5">
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

        {/* First-time Threads explanation card */}
        {showThreadsCard && arcs && arcs.length > 0 && (
          <View className="mb-4 bg-teal-900/30 border border-teal-700/40 rounded-xl p-4">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-teal-300 font-semibold mb-1">🧵 Plot Threads</Text>
                <Text className="text-gray-400 text-sm">Details planted in your story that need to pay off later. The AI seeds two per chapter automatically — track them here.</Text>
              </View>
              <TouchableOpacity onPress={dismissThreadsCard} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text className="text-gray-500 text-lg">✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Header */}
        <Text className="text-gray-400 text-xs uppercase tracking-widest mb-1">
          Plot
        </Text>
        <Text className="text-white text-2xl font-bold mb-6">Thread Tracker</Text>

        {threads.length === 0 ? (
          <View className="items-center py-16">
            <Text className="text-4xl mb-4">🧵</Text>
            <Text className="text-white text-xl font-bold text-center mb-2">
              No threads yet
            </Text>
            <Text className="text-gray-400 text-sm text-center">
              Threads are automatically seeded as chapters are generated.
            </Text>
          </View>
        ) : null}

        {/* Open */}
        {open.length > 0 ? (
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <Text className="text-white text-lg font-semibold">Open</Text>
              <View className="bg-blue-600 rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-white text-xs font-bold">{open.length}</Text>
              </View>
            </View>
            {open.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                onTap={() => setSelectedThread(thread)}
              />
            ))}
          </View>
        ) : null}

        {/* Resolved */}
        {resolved.length > 0 ? (
          <View className="mb-6">
            <Text className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">
              Resolved
            </Text>
            {resolved.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                onTap={() => setSelectedThread(thread)}
              />
            ))}
          </View>
        ) : null}

        {/* Abandoned */}
        {abandoned.length > 0 ? (
          <View>
            <Text className="text-gray-600 text-sm font-semibold uppercase tracking-wide mb-3">
              Abandoned
            </Text>
            {abandoned.map((thread) => (
              <TouchableOpacity
                key={thread.id}
                activeOpacity={0.75}
                className="bg-gray-900/40 rounded-xl p-4 mb-3 border-l-4 border-l-gray-700 opacity-60"
              >
                <Text className="text-gray-500 text-base" numberOfLines={2}>
                  {thread.description}
                </Text>
                {thread.planted_in_chapter != null ? (
                  <Text className="text-gray-700 text-xs mt-1">
                    Planted ch. {thread.planted_in_chapter}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <ThreadDetailModal
        thread={selectedThread}
        onClose={() => {
          setSelectedThread(null);
          setAbandonError(null);
        }}
        resolving={resolveThread.isPending}
        abandoning={abandonThread.isPending}
        abandonError={abandonError}
        onResolve={(threadId) => {
          if (!currentArcId) return;
          resolveThread.mutate(
            { threadId, arcId: currentArcId },
            {
              onSuccess: () => {
                setSelectedThread(null);
                refetch();
              },
            },
          );
        }}
        onAbandon={(threadId) => {
          if (!currentArcId) return;
          setAbandonError(null);
          abandonThread.mutate(
            { threadId, arcId: currentArcId },
            {
              onSuccess: () => {
                setSelectedThread(null);
                setAbandonError(null);
                refetch();
              },
              onError: (err) => {
                setAbandonError(err instanceof Error ? err.message : 'Failed to abandon thread.');
              },
            },
          );
        }}
      />
    </SafeAreaView>
  );
}
