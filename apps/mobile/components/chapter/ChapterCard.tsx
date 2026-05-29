import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../ui/Card.js';
import { Badge } from '../ui/Badge.js';
import { SPICE_LEVEL_LABELS } from '../../lib/constants.js';

interface ChapterCardProps {
  id: string;
  chapterNumber: number;
  title: string;
  wordCount?: number;
  cliffhangerType?: string;
  spiceLevel?: number;
}

export function ChapterCard({
  id,
  chapterNumber,
  title,
  wordCount,
  cliffhangerType,
  spiceLevel,
}: ChapterCardProps) {
  const router = useRouter();

  return (
    <Card
      onPress={() => router.push(`/(tabs)/library/chapter/${id}`)}
      className="mb-3"
    >
      <View className="flex-row items-start gap-3">
        {/* Chapter number pill */}
        <View className="w-10 h-10 rounded-full bg-brand-purple/20 border border-brand-purple/40 items-center justify-center shrink-0">
          <Text className="text-brand-purple text-xs font-bold">{chapterNumber}</Text>
        </View>

        <View className="flex-1">
          <Text className="text-white text-base font-semibold" numberOfLines={2}>
            {title}
          </Text>

          <View className="flex-row flex-wrap gap-2 mt-2">
            {wordCount != null && (
              <Text className="text-gray-500 text-xs">{wordCount.toLocaleString()} words</Text>
            )}
          </View>

          <View className="flex-row flex-wrap gap-2 mt-2">
            {cliffhangerType ? (
              <Badge label={cliffhangerType} variant="theme" />
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

        <Text className="text-gray-600 text-xl self-center">›</Text>
      </View>
    </Card>
  );
}
