import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useArcStore } from '../../../stores/arcStore.js';
import { useGeneration } from '../../../hooks/useGeneration.js';
import { GenerationPanel } from '../../../components/generation/GenerationPanel.js';
import { StreamingText } from '../../../components/generation/StreamingText.js';
import { Button } from '../../../components/ui/Button.js';

export default function GenerateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ arcId: string; chapterNumber: string }>();
  const arcId = params.arcId ?? '';
  const chapterNumber = parseInt(params.chapterNumber ?? '1', 10);

  const currentArc = useArcStore((s) => s.currentArc);
  const isGenerating = useArcStore((s) => s.isGenerating);
  const streamingText = useArcStore((s) => s.streamingText);

  const { generate, cancel } = useGeneration();
  const [generationComplete, setGenerationComplete] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  // showForm controls whether the GenerationPanel is visible; persists across generation
  const [showForm, setShowForm] = useState(true);

  const arcTitle = (currentArc as Record<string, unknown> | null)?.title as
    | string
    | undefined;

  const handleGenerate = async (params: {
    arcId: string;
    chapterNumber: number;
    spiceLevelOverride?: number;
    userCreativeDirection?: string;
  }) => {
    setGenerateError(null);
    setGenerationComplete(false);
    setShowForm(false);
    try {
      await generate(params);
      setGenerationComplete(true);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Generation failed');
      // Show form again on error so user can retry
      setShowForm(true);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-deep">
      {/* Header */}
      <View className="flex-row items-center px-5 pt-4 pb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-3 w-9 h-9 items-center justify-center"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text className="text-gray-400 text-xl">‹</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-gray-400 text-xs uppercase tracking-wide">
            Writing
          </Text>
          <Text className="text-white text-lg font-bold" numberOfLines={1}>
            {arcTitle ?? 'Generate Chapter'}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Generation panel — hidden while generating or streaming, shown when showForm=true */}
        {showForm && !isGenerating && !streamingText ? (
          <GenerationPanel
            arcId={arcId}
            chapterNumber={chapterNumber}
            onGenerate={handleGenerate}
          />
        ) : null}

        {/* Error */}
        {generateError ? (
          <View className="bg-red-900/40 border border-red-700 rounded-xl p-4">
            <Text className="text-red-300 text-sm">{generateError}</Text>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 self-start"
              onPress={() => setGenerateError(null)}
            >
              Dismiss
            </Button>
          </View>
        ) : null}

        {/* Streaming output */}
        {(isGenerating || streamingText) ? (
          <View className="flex-1 min-h-96">
            <StreamingText />
          </View>
        ) : null}

        {/* Cancel button — shown while generation is in progress */}
        {isGenerating && (
          <TouchableOpacity
            onPress={() => { cancel(); }}
            className="mt-4 items-center py-3"
          >
            <Text className="text-gray-400 text-sm">Cancel generation</Text>
          </TouchableOpacity>
        )}

        {/* Post-generation CTA */}
        {generationComplete && !isGenerating ? (
          <View className="bg-green-900/30 border border-green-700/50 rounded-xl p-4 gap-3">
            <Text className="text-green-300 text-base font-semibold text-center">
              Chapter saved!
            </Text>
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onPress={() => router.push('/(tabs)/library')}
            >
              View in Library
            </Button>
          </View>
        ) : null}

        {/* Adjust Settings button (only shown after complete) */}
        {generationComplete && !isGenerating ? (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onPress={() => {
              setGenerationComplete(false);
              setShowForm(true);
            }}
          >
            Adjust Settings
          </Button>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
