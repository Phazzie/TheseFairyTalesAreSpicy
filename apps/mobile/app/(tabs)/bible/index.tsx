import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useArcs, useArcWithDetails } from '../../../hooks/useArcs.js';
import { useArcStore } from '../../../stores/arcStore.js';
import { Card } from '../../../components/ui/Card.js';
import { Badge } from '../../../components/ui/Badge.js';
import { Button } from '../../../components/ui/Button.js';
import { CREATURE_LABELS } from '../../../lib/constants.js';

export default function BibleIndexScreen() {
  const router = useRouter();
  const currentArcId = useArcStore((s) => s.currentArcId);
  const setCurrentArcId = useArcStore((s) => s.setCurrentArcId);
  const { data: arcs } = useArcs();
  const { data, isLoading, error, refetch } = useArcWithDetails(currentArcId);
  const [refreshing, setRefreshing] = useState(false);
  const [showBibleCard, setShowBibleCard] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  useEffect(() => {
    AsyncStorage.getItem('seen_bible_card').then((val) => {
      if (!val) setShowBibleCard(true);
    });
  }, []);

  function dismissBibleCard() {
    setShowBibleCard(false);
    AsyncStorage.setItem('seen_bible_card', '1');
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

  if (!data?.arc) {
    return (
      <SafeAreaView className="flex-1 bg-brand-deep items-center justify-center px-6">
        <Text className="text-4xl mb-4">📖</Text>
        <Text className="text-white text-xl font-bold text-center mb-2">
          No Story Bible Yet
        </Text>
        <Text className="text-gray-400 text-sm text-center mb-6">
          Create an arc to build your story bible.
        </Text>
        <Button
          variant="primary"
          onPress={() => router.push('/arc-wizard/step-1')}
        >
          Create Your First Arc
        </Button>
      </SafeAreaView>
    );
  }

  const arcRecord = data.arc as Record<string, unknown>;
  const characters = data.characters as Record<string, unknown>[];
  const creatureLore = data.creatureLore as Record<string, unknown> | null;
  const worldNotes = data.worldNotes as unknown[];

  const isQuickStart = arcRecord.is_quick_start as boolean | undefined;
  const creatureType = arcRecord.creature_type as string | undefined;
  const recurringMotif = arcRecord.recurring_motif as string | undefined;

  const protagonist = characters.find((c) => c.is_protagonist);
  const loveInterest = characters.find((c) => !c.is_protagonist);

  return (
    <SafeAreaView className="flex-1 bg-brand-deep">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, gap: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />}
      >
        {/* Arc Switcher */}
        {arcs && arcs.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2 -mx-5 px-5">
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

        {/* First-time Bible explanation card */}
        {showBibleCard && arcs && arcs.length > 0 && (
          <View className="mx-0 mb-4 bg-indigo-900/30 border border-indigo-700/40 rounded-xl p-4">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-indigo-300 font-semibold mb-1">📖 Story Bible</Text>
                <Text className="text-gray-400 text-sm">Your characters, world notes, and creature lore live here. The AI reads this before every generation to stay consistent.</Text>
              </View>
              <TouchableOpacity onPress={dismissBibleCard} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text className="text-gray-500 text-lg">✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Title */}
        <View className="gap-1">
          <Text className="text-gray-400 text-xs uppercase tracking-widest">
            Story Bible
          </Text>
          <Text className="text-white text-2xl font-bold">
            {(arcRecord.title as string | undefined) ?? 'Untitled Arc'}
          </Text>
        </View>

        {/* Quick Start banner */}
        {isQuickStart ? (
          <View className="bg-yellow-900/30 border border-yellow-600/50 rounded-xl p-4 flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <Text className="text-yellow-300 text-sm font-semibold">
                Quick Start Arc
              </Text>
              <Text className="text-yellow-600 text-xs mt-0.5">
                Some settings are using defaults. Tap to customize.
              </Text>
            </View>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => router.push('/(tabs)/bible/arc-settings')}
            >
              Edit
            </Button>
          </View>
        ) : null}

        {/* Characters */}
        <View className="gap-3">
          <Text className="text-white text-lg font-semibold">Characters</Text>
          {characters.length === 0 ? (
            <Text className="text-gray-500 text-sm italic">No characters defined.</Text>
          ) : (
            characters.map((char) => {
              const charId = (char.id as string | undefined) ?? String(Math.random());
              const isProtag = char.is_protagonist as boolean | undefined;
              return (
                <Card
                  key={charId}
                  onPress={() => router.push(`/(tabs)/bible/character/${charId}`)}
                  className="gap-2"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-white text-base font-semibold">
                          {(char.display_name as string | undefined) ?? 'Unknown'}
                        </Text>
                        {isProtag ? (
                          <Badge label="Protagonist" variant="status-open" />
                        ) : (
                          <Badge label="Love Interest" variant="dramatic-irony" />
                        )}
                      </View>
                      <Text className="text-gray-400 text-xs mt-0.5">
                        {(char.species as string | undefined) ?? '—'}
                      </Text>
                    </View>
                    <Text className="text-gray-600 text-xl">›</Text>
                  </View>
                  {char.stated_desire ? (
                    <Text className="text-gray-400 text-xs" numberOfLines={2}>
                      Wants: {char.stated_desire as string}
                    </Text>
                  ) : null}
                </Card>
              );
            })
          )}
        </View>

        {/* Creature Lore */}
        {creatureType ? (
          <View className="gap-2">
            <View className="flex-row items-center gap-2">
              <Text className="text-white text-lg font-semibold">Creature Lore</Text>
              <Badge
                label={CREATURE_LABELS[creatureType] ?? creatureType}
                variant="creature"
              />
            </View>
            <Card className="gap-3">
              {creatureLore ? (
                <>
                  {creatureLore.rules && (creatureLore.rules as string[]).length > 0 ? (
                    <View>
                      <Text className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                        Rules
                      </Text>
                      {(creatureLore.rules as string[]).map((rule, i) => (
                        <Text key={i} className="text-gray-300 text-sm">
                          • {rule}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                  {creatureLore.weaknesses && (creatureLore.weaknesses as string[]).length > 0 ? (
                    <View>
                      <Text className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                        Weaknesses
                      </Text>
                      {(creatureLore.weaknesses as string[]).map((w, i) => (
                        <Text key={i} className="text-gray-300 text-sm">
                          • {w}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                  {creatureLore.abilities && (creatureLore.abilities as string[]).length > 0 ? (
                    <View>
                      <Text className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                        Abilities
                      </Text>
                      {(creatureLore.abilities as string[]).map((a, i) => (
                        <Text key={i} className="text-gray-300 text-sm">
                          • {a}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                  {!creatureLore.rules && !creatureLore.weaknesses && !creatureLore.abilities ? (
                    <Text className="text-gray-600 text-sm italic">
                      No lore defined yet.
                    </Text>
                  ) : null}
                </>
              ) : (
                <Text className="text-gray-600 text-sm italic">
                  No lore defined yet.
                </Text>
              )}
            </Card>
          </View>
        ) : null}

        {/* World Notes */}
        <View className="flex-row items-center justify-between">
          <Text className="text-white text-lg font-semibold">World Notes</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/bible/notes')}>
            <Text className="text-brand-purple text-sm">
              {worldNotes?.length ?? 0} notes — View all ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recurring Motif */}
        {recurringMotif ? (
          <Card>
            <Text className="text-gray-500 text-xs uppercase tracking-wide mb-1">
              Recurring Motif
            </Text>
            <Text className="text-gray-200 text-sm italic">"{recurringMotif}"</Text>
          </Card>
        ) : null}

        {/* Edit Arc Settings */}
        <Button
          variant="ghost"
          size="md"
          className="w-full"
          onPress={() => router.push('/(tabs)/bible/arc-settings')}
        >
          Edit Arc Settings
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
