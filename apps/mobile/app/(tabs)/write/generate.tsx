import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useArcStore } from '../../../stores/arcStore.js';
import { useGeneration } from '../../../hooks/useGeneration.js';
import { GenerationPanel } from '../../../components/generation/GenerationPanel.js';
import { StreamingText } from '../../../components/generation/StreamingText.js';
import { Button } from '../../../components/ui/Button.js';

export default function GenerateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ arcId: string; chapterNumber: string; priorChapterId?: string }>();
  const arcId = params.arcId ?? '';
  const chapterNumber = parseInt(params.chapterNumber ?? '1', 10);
  const priorChapterId = params.priorChapterId ?? undefined;

  const currentArc = useArcStore((s) => s.currentArc);
  const isGenerating = useArcStore((s) => s.isGenerating);
  const streamingParagraphs = useArcStore((s) => s.streamingParagraphs);
  const streamingTail = useArcStore((s) => s.streamingTail);
  const clearStreamingText = useArcStore((s) => s.clearStreamingText);
  const hasStreamingContent = streamingParagraphs.length > 0 || streamingTail.length > 0;
  const waitingForFirstToken = isGenerating && !hasStreamingContent;

  const { generate, cancel } = useGeneration();

  // Clear any leftover streaming text from a previous generation on mount
  useEffect(() => {
    clearStreamingText();
  }, []);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  // showForm controls whether the GenerationPanel is visible; persists across generation
  const [showForm, setShowForm] = useState(true);

  const arcTitle = (currentArc as Record<string, unknown> | null)?.title as
    | string
    | undefined;
  const [completedTitle, setCompletedTitle] = useState<string | undefined>(undefined);

  const handleGenerate = async (panelParams: {
    arcId: string;
    chapterNumber: number;
    spiceLevelOverride?: number;
    userCreativeDirection?: string;
  }) => {
    setGenerateError(null);
    setGenerationComplete(false);
    setShowForm(false);
    try {
      const result = await generate({ ...panelParams, priorChapterId });
      if (result && typeof result === 'object' && 'title' in result) {
        setCompletedTitle((result as Record<string, unknown>).title as string | undefined);
      }
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
        {showForm && !isGenerating && !hasStreamingContent ? (
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

        {/* Waiting for first token — show a loading indicator so it doesn't look like a crash */}
        {waitingForFirstToken && (
          <View className="flex-1 items-center justify-center px-8">
            <ActivityIndicator color="#7c3aed" size="large" />
            <Text className="text-gray-400 text-sm mt-4 text-center">
              Conjuring your story…{'\n'}This typically takes 30–60 seconds.
            </Text>
          </View>
        )}

        {/* Streaming output — hidden once generation is complete */}
        {!waitingForFirstToken && !generationComplete && (hasStreamingContent || isGenerating) ? (
          <View className="flex-1 min-h-96">
            <StreamingText />
          </View>
        ) : null}

        {/* Cancel button — shown while generation is in progress */}
        {isGenerating && !generationComplete && (
          <TouchableOpacity
            onPress={() => { cancel(); }}
            className="mt-4 items-center py-3"
          >
            <Text className="text-gray-400 text-sm">Cancel generation</Text>
          </TouchableOpacity>
        )}

        {/* Post-generation success state — prominent centered banner */}
        {generationComplete && !isGenerating ? (
          <View className="flex-1 items-center justify-center px-8 py-12">
            <Text className="text-5xl mb-4">✨</Text>
            <Text className="text-white text-xl font-bold mb-2">
              {completedTitle ?? 'Chapter saved!'}
            </Text>
            <Text className="text-gray-400 text-sm mb-8">
              Chapter {params.chapterNumber} saved
            </Text>
            <Button
              variant="primary"
              size="lg"
              className="w-full mb-3"
              onPress={() => router.push('/(tabs)/library')}
            >
              Read Chapter
            </Button>
            <Button
              variant="ghost"
              size="md"
              className="w-full mb-3"
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/write/generate',
                  params: {
                    arcId,
                    chapterNumber: String((parseInt(params.chapterNumber ?? '1', 10)) + 1),
                    priorChapterId: undefined,
                  },
                })
              }
            >
              Continue — Chapter {(parseInt(params.chapterNumber ?? '1', 10)) + 1}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onPress={() => {
                clearStreamingText();
                setGenerationComplete(false);
                setCompletedTitle(undefined);
                setShowForm(true);
              }}
            >
              Adjust Settings
            </Button>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
