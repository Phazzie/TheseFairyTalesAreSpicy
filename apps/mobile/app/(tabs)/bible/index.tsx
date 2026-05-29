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
import { Card } from '../../../components/ui/Card.js';
import { Badge } from '../../../components/ui/Badge.js';
import { Button } from '../../../components/ui/Button.js';
import { CREATURE_LABELS } from '../../../lib/constants.js';

export default function BibleIndexScreen() {
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

  if (!arc) {
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

  const arcRecord = arc as Record<string, unknown>;
  const isQuickStart = arcRecord.is_quick_start as boolean | undefined;
  const protagonist = arcRecord.protagonist as Record<string, unknown> | undefined;
  const loveInterest = arcRecord.love_interest as Record<string, unknown> | undefined;
  const creatureLore = arcRecord.creature_lore as Record<string, unknown> | undefined;
  const creatureType = arcRecord.creature_type as string | undefined;
  const recurringMotif = arcRecord.recurring_motif as string | undefined;
  const worldNotes = arcRecord.world_notes as unknown[] | undefined;

  const characters = [protagonist, loveInterest].filter(Boolean) as Record<
    string,
    unknown
  >[];

  return (
    <SafeAreaView className="flex-1 bg-brand-deep">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
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
            characters.map((char, i) => {
              const charId = (char.id as string | undefined) ?? String(i);
              const isProtagonist = i === 0;
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
                          {(char.name as string | undefined) ?? 'Unknown'}
                        </Text>
                        {isProtagonist ? (
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
              {creatureLore?.rules && (creatureLore.rules as string[]).length > 0 ? (
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
          <TouchableOpacity>
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
