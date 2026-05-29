import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useChapter } from '../../hooks/useChapters.js';
import { Button } from '../../components/ui/Button.js';
import { supabase } from '../../lib/supabase.js';

// expo-av types (optional peer dep — gracefully handle missing)
type AVPlaybackStatus = {
  isLoaded: boolean;
  isPlaying?: boolean;
  positionMillis?: number;
  durationMillis?: number;
  didJustFinish?: boolean;
};

type SoundObject = {
  unloadAsync: () => Promise<void>;
  playAsync: () => Promise<void>;
  pauseAsync: () => Promise<void>;
  setOnPlaybackStatusUpdate: (cb: (status: AVPlaybackStatus) => void) => void;
  getStatusAsync: () => Promise<AVPlaybackStatus>;
};

type AudioModule = {
  Audio: {
    Sound: {
      createAsync: (
        source: { uri: string },
        status?: Record<string, unknown>,
      ) => Promise<{ sound: SoundObject; status: AVPlaybackStatus }>;
    };
    setAudioModeAsync: (mode: Record<string, unknown>) => Promise<void>;
  };
};

interface ChapterRecord {
  id: string;
  title: string;
  chapter_number: number;
  audio_url?: string;
  arc_id: string;
}

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default function AudioPlayerScreen() {
  const router = useRouter();
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const { data: chapter, isLoading, error, refetch } = useChapter(chapterId ?? null);

  const soundRef = useRef<SoundObject | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [soundLoading, setSoundLoading] = useState(false);
  const [soundError, setSoundError] = useState<string | null>(null);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const ch = chapter as unknown as ChapterRecord | null;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => null);
    };
  }, []);

  const loadAndPlay = useCallback(async (uri: string) => {
    setSoundLoading(true);
    setSoundError(null);
    try {
      let av: AudioModule | null = null;
      try {
        av = require('expo-av') as AudioModule;
      } catch {
        setSoundError('Audio playback is not available on this platform.');
        return;
      }

      await av.Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
      });

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { sound, status } = await av.Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
      );

      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((s: AVPlaybackStatus) => {
        if (s.isLoaded) {
          setIsPlaying(s.isPlaying ?? false);
          setPositionMs(s.positionMillis ?? 0);
          setDurationMs(s.durationMillis ?? 0);
          if (s.didJustFinish) {
            setIsPlaying(false);
            setPositionMs(0);
          }
        }
      });

      if (status.isLoaded) {
        setDurationMs(status.durationMillis ?? 0);
        setIsPlaying(true);
      }
    } catch (err) {
      setSoundError(err instanceof Error ? err.message : 'Failed to load audio');
    } finally {
      setSoundLoading(false);
    }
  }, []);

  const togglePlayPause = async () => {
    if (!soundRef.current) {
      if (ch?.audio_url) {
        await loadAndPlay(ch.audio_url);
      }
      return;
    }
    const status = await soundRef.current.getStatusAsync();
    if (status.isLoaded) {
      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
    }
  };

  const handleGenerateAudio = async () => {
    if (!ch) return;
    setGeneratingAudio(true);
    setGenerationError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-audio', {
        body: { chapter_id: ch.id, arc_id: ch.arc_id },
      });
      if (fnError) throw new Error(fnError.message);
      await refetch();
      const audioUrl = (data as Record<string, unknown>)?.audio_url as string | undefined;
      if (audioUrl) {
        await loadAndPlay(audioUrl);
      }
    } catch (err) {
      setGenerationError(
        err instanceof Error ? err.message : 'Failed to generate audio',
      );
    } finally {
      setGeneratingAudio(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-brand-deep items-center justify-center">
        <ActivityIndicator size="large" color="#7c3aed" />
      </SafeAreaView>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !chapter) {
    return (
      <SafeAreaView className="flex-1 bg-brand-deep items-center justify-center px-6">
        <Text className="text-red-400 text-base text-center mb-4">
          {error?.message ?? 'Chapter not found'}
        </Text>
        <Button variant="ghost" onPress={() => router.back()}>
          Go Back
        </Button>
      </SafeAreaView>
    );
  }

  const progress = durationMs > 0 ? positionMs / durationMs : 0;
  const hasAudio = Boolean(ch?.audio_url);

  return (
    <SafeAreaView className="flex-1 bg-brand-deep">
      {/* Header */}
      <View className="flex-row items-center px-5 pt-4 pb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="mr-3"
        >
          <Text className="text-gray-400 text-xl">‹</Text>
        </TouchableOpacity>
        <Text className="text-gray-400 text-sm">Audio Player</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Chapter info */}
        <View className="items-center py-10 gap-2">
          <Text className="text-brand-purple text-xs font-semibold uppercase tracking-widest">
            Chapter {ch?.chapter_number ?? '—'}
          </Text>
          <Text className="text-white text-2xl font-bold text-center mt-1">
            {ch?.title ?? 'Untitled'}
          </Text>
        </View>

        {/* Audio player UI */}
        {hasAudio ? (
          <View className="gap-6">
            {/* Progress bar */}
            <View className="gap-2">
              <View className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <View
                  className="h-full bg-brand-purple rounded-full"
                  style={{ width: `${progress * 100}%` }}
                />
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-500 text-xs">{formatMs(positionMs)}</Text>
                <Text className="text-gray-500 text-xs">{formatMs(durationMs)}</Text>
              </View>
            </View>

            {/* Play / Pause */}
            <View className="items-center">
              {soundLoading ? (
                <ActivityIndicator size="large" color="#7c3aed" />
              ) : (
                <TouchableOpacity
                  onPress={togglePlayPause}
                  className="w-20 h-20 rounded-full bg-brand-purple items-center justify-center"
                  activeOpacity={0.8}
                >
                  <Text className="text-white text-3xl">
                    {isPlaying ? '⏸' : '▶'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {soundError ? (
              <Text className="text-red-400 text-sm text-center">{soundError}</Text>
            ) : null}
          </View>
        ) : (
          /* No audio yet */
          <View className="items-center gap-6 py-8">
            <View className="w-24 h-24 rounded-full bg-gray-800 items-center justify-center">
              <Text className="text-4xl">🎧</Text>
            </View>
            <View className="gap-2 items-center">
              <Text className="text-white text-lg font-semibold text-center">
                No audio yet
              </Text>
              <Text className="text-gray-400 text-sm text-center">
                Generate a narrated audio version of this chapter using character voices.
              </Text>
            </View>

            {generationError ? (
              <Text className="text-red-400 text-sm text-center">{generationError}</Text>
            ) : null}

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              loading={generatingAudio}
              onPress={handleGenerateAudio}
            >
              Generate Audio Narration
            </Button>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
