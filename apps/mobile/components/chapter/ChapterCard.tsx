import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../ui/Card.js';
import { Badge } from '../ui/Badge.js';
import { SPICE_LEVEL_LABELS } from '../../lib/constants.js';

const CLIFFHANGER_LABELS: Record<string, string> = {
  revelation: 'Revelation',
  interruption: 'Interruption',
  physical_peril: 'Peril',
  emotional_severance: 'Severance',
  temptation_offered: 'Temptation',
  identity_destabilized: 'Identity',
  time_bomb: 'Time Bomb',
  mirror_reveal: 'Mirror',
  none: '',
};

interface ChapterCardProps {
  id: string;
  chapterNumber: number;
  title: string;
  wordCount?: number;
  cliffhangerType?: string;
  spiceLevel?: number;
  isDraft?: boolean;
}

export function ChapterCard({
  id,
  chapterNumber,
  title,
  wordCount,
  cliffhangerType,
  spiceLevel,
  isDraft = false,
}: ChapterCardProps) {
  const router = useRouter();

  return (
    <Card
      onPress={() => router.push(`/(tabs)/library/chapter/${id}`)}
      className={`mb-3 ${isDraft ? 'opacity-80 border border-dashed border-gray-600' : ''}`}
    >
      <View className="flex-row items-start gap-3">
        {/* Chapter number pill */}
        <View className={`w-10 h-10 rounded-full items-center justify-center shrink-0 ${isDraft ? 'bg-gray-700/50 border border-gray-600' : 'bg-brand-purple/20 border border-brand-purple/40'}`}>
          <Text className={`text-xs font-bold ${isDraft ? 'text-gray-400' : 'text-brand-purple'}`}>{chapterNumber}</Text>
        </View>

        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-white text-base font-semibold flex-1" numberOfLines={2}>
              {title}
            </Text>
            {isDraft && (
              <View className="bg-gray-700 rounded px-1.5 py-0.5">
                <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider">DRAFT</Text>
              </View>
            )}
          </View>

          <View className="flex-row flex-wrap gap-2 mt-2">
            {wordCount != null && (
              <Text className="text-gray-500 text-xs">{wordCount.toLocaleString()} words</Text>
            )}
          </View>

          <View className="flex-row flex-wrap gap-2 mt-2">
            {cliffhangerType && cliffhangerType !== 'none' && CLIFFHANGER_LABELS[cliffhangerType] !== '' ? (
              <Badge
                label={CLIFFHANGER_LABELS[cliffhangerType] ?? cliffhangerType}
                variant="theme"
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

        <Text className="text-gray-600 text-xl self-center">›</Text>
      </View>
    </Card>
  );
}
