import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useArcStore } from '../../../stores/arcStore.js';
import { useOpenThreads, useResolveThread } from '../../../hooks/usePlotThreads.js';
import { Button } from '../../../components/ui/Button.js';
import { Badge } from '../../../components/ui/Badge.js';

type ThreadType = 'chekhov' | 'callback' | 'dramatic_irony' | 'open' | string;

interface PlotThread {
  id: string;
  arc_id: string;
  title: string;
  description: string | null;
  status: 'open' | 'resolved';
  introduced_chapter: number | null;
  resolved_chapter: number | null;
  thread_type?: ThreadType;
  expected_payoff?: string | null;
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
      className={`bg-gray-900/80 rounded-xl p-4 mb-3 ${borderClass}`}
    >
      <View className="flex-row items-start justify-between gap-2">
        <Text className="text-white text-base font-semibold flex-1" numberOfLines={2}>
          {thread.title}
        </Text>
        {thread.thread_type ? (
          <Badge
            label={thread.thread_type.replace(/_/g, ' ')}
            variant={badgeVariant}
          />
        ) : null}
      </View>

      {thread.description ? (
        <Text className="text-gray-400 text-sm mt-1 leading-5" numberOfLines={3}>
          {thread.description}
        </Text>
      ) : null}

      <View className="flex-row gap-4 mt-2">
        {thread.introduced_chapter != null ? (
          <Text className="text-gray-600 text-xs">
            Planted ch. {thread.introduced_chapter}
          </Text>
        ) : null}
        {thread.expected_payoff ? (
          <Text className="text-gray-600 text-xs" numberOfLines={1}>
            Payoff: {thread.expected_payoff}
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
  resolving: boolean;
}

function ThreadDetailModal({
  thread,
  onClose,
  onResolve,
  resolving,
}: ThreadDetailModalProps) {
  if (!thread) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-end">
        <View className="bg-brand-deep border border-gray-800 rounded-t-3xl px-6 pt-6 pb-10">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-xl font-bold flex-1 mr-4" numberOfLines={2}>
              {thread.title}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-gray-400 text-2xl">✕</Text>
            </TouchableOpacity>
          </View>

          {thread.description ? (
            <Text className="text-gray-300 text-sm leading-6 mb-4">
              {thread.description}
            </Text>
          ) : null}

          <View className="gap-2 mb-6">
            {thread.introduced_chapter != null ? (
              <Text className="text-gray-500 text-sm">
                Planted in Chapter {thread.introduced_chapter}
              </Text>
            ) : null}
            {thread.expected_payoff ? (
              <Text className="text-gray-500 text-sm">
                Expected payoff: {thread.expected_payoff}
              </Text>
            ) : null}
          </View>

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
              <Button variant="destructive" size="md" className="w-full" onPress={onClose}>
                Abandon Thread
              </Button>
            </View>
          ) : (
            <View className="bg-green-900/30 border border-green-700/50 rounded-xl p-3">
              <Text className="text-green-300 text-sm text-center font-semibold">
                Resolved
                {thread.resolved_chapter != null
                  ? ` in Chapter ${thread.resolved_chapter}`
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
  const { data: openThreads, isLoading, error, refetch } = useOpenThreads(currentArcId);
  const resolveThread = useResolveThread();
  const [selectedThread, setSelectedThread] = useState<PlotThread | null>(null);

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

  const threads = (openThreads ?? []) as PlotThread[];
  const open = threads.filter((t) => t.status === 'open');
  const resolved = threads.filter((t) => t.status === 'resolved');

  return (
    <SafeAreaView className="flex-1 bg-brand-deep">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
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
          <View>
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
      </ScrollView>

      <ThreadDetailModal
        thread={selectedThread}
        onClose={() => setSelectedThread(null)}
        resolving={resolveThread.isPending}
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
      />
    </SafeAreaView>
  );
}
