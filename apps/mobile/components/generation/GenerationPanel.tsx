import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Slider } from '../ui/Slider.js';
import { Input } from '../ui/Input.js';
import { Button } from '../ui/Button.js';
import { SPICE_LEVEL_LABELS } from '../../lib/constants.js';
import { useArcStore } from '../../stores/arcStore.js';

interface GenerationPanelProps {
  arcId: string;
  chapterNumber: number;
  onGenerate: (params: {
    arcId: string;
    chapterNumber: number;
    spiceLevelOverride?: number;
    userCreativeDirection?: string;
  }) => void;
}

export function GenerationPanel({ arcId, chapterNumber, onGenerate }: GenerationPanelProps) {
  const isGenerating = useArcStore((s) => s.isGenerating);
  const currentArc = useArcStore((s) => s.currentArc);

  const defaultSpice = (currentArc as Record<string, unknown> | null)?.spice_level as number ?? 3;
  const [spiceOverride, setSpiceOverride] = useState<number>(defaultSpice);
  const [creativeDirection, setCreativeDirection] = useState('');

  const handleGenerate = () => {
    onGenerate({
      arcId,
      chapterNumber,
      spiceLevelOverride: spiceOverride !== defaultSpice ? spiceOverride : undefined,
      userCreativeDirection: creativeDirection.trim() || undefined,
    });
  };

  return (
    <View className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 gap-4">
      <Text className="text-white text-base font-semibold">
        Chapter {chapterNumber} — Generation Settings
      </Text>

      <Slider
        label="Spice Level Override"
        value={spiceOverride}
        min={1}
        max={5}
        onChange={setSpiceOverride}
        valueLabel={SPICE_LEVEL_LABELS[spiceOverride]}
      />

      <Input
        label="Creative Direction (optional)"
        value={creativeDirection}
        onChangeText={setCreativeDirection}
        placeholder="e.g. 'Make this scene more tense — they almost kiss but don't'"
        multiline
        numberOfLines={3}
        style={{ minHeight: 72, textAlignVertical: 'top' }}
      />

      <Button
        variant="primary"
        size="lg"
        loading={isGenerating}
        onPress={handleGenerate}
        disabled={isGenerating}
        className="w-full"
      >
        {isGenerating ? 'Generating...' : 'Generate Chapter'}
      </Button>
    </View>
  );
}
