import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function AudioPlayerScreen() {
  const router = useRouter();

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

      {/* Coming soon */}
      <View className="flex-1 items-center justify-center px-8 gap-4">
        <Text className="text-5xl">🎧</Text>
        <Text className="text-white text-2xl font-bold text-center">
          Audio Narration
        </Text>
        <Text className="text-gray-400 text-base text-center leading-6">
          This feature is coming soon. We're working on bringing your chapters to life with character voices and atmospheric narration.
        </Text>
      </View>
    </SafeAreaView>
  );
}
