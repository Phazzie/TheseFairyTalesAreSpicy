import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useUIStore } from '../../stores/uiStore.js';
import { Button } from '../ui/Button.js';

interface PlanRowProps {
  feature: string;
  free: string;
  pro: string;
}

function PlanRow({ feature, free, pro }: PlanRowProps) {
  return (
    <View className="flex-row py-2 border-b border-gray-800">
      <Text className="flex-1 text-gray-300 text-sm">{feature}</Text>
      <Text className="w-16 text-center text-gray-500 text-sm">{free}</Text>
      <Text className="w-16 text-center text-brand-purple text-sm font-semibold">{pro}</Text>
    </View>
  );
}

export function UpgradeSheet() {
  const { showUpgradeSheet, closeUpgradeSheet } = useUIStore();

  return (
    <Modal
      visible={showUpgradeSheet}
      transparent
      animationType="slide"
      onRequestClose={closeUpgradeSheet}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <SafeAreaView className="bg-brand-deep rounded-t-3xl border border-gray-800">
          <View className="px-6 pt-6 pb-10">
            {/* Handle */}
            <View className="w-12 h-1.5 bg-gray-700 rounded-full self-center mb-6" />

            {/* Close */}
            <TouchableOpacity
              onPress={closeUpgradeSheet}
              className="absolute top-6 right-6"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className="text-gray-400 text-2xl">✕</Text>
            </TouchableOpacity>

            {/* Header */}
            <Text className="text-white text-2xl font-bold text-center mb-1">
              You&apos;ve reached your limit
            </Text>
            <Text className="text-gray-400 text-sm text-center mb-6">
              Upgrade to Pro and keep writing your story
            </Text>

            {/* Comparison table */}
            <View className="mb-6">
              <View className="flex-row pb-2 border-b border-gray-700">
                <Text className="flex-1 text-gray-500 text-xs font-semibold uppercase tracking-wide">
                  Feature
                </Text>
                <Text className="w-16 text-center text-gray-500 text-xs font-semibold uppercase tracking-wide">
                  Free
                </Text>
                <Text className="w-16 text-center text-brand-purple text-xs font-semibold uppercase tracking-wide">
                  Pro
                </Text>
              </View>
              <PlanRow feature="Arcs" free="3" pro="Unlimited" />
              <PlanRow feature="Gens / month" free="10" pro="Unlimited" />
              <PlanRow feature="Regenerations" free="1/chapter" pro="3/chapter" />
              <PlanRow feature="Audio narration" free="—" pro="Included" />
              <PlanRow feature="Story export" free="—" pro="PDF / EPUB" />
            </View>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onPress={() => {
                // Opens the web upgrade page — replace URL with your Stripe Checkout link
                const upgradeUrl = process.env['EXPO_PUBLIC_UPGRADE_URL'] ?? 'https://spicyfairytales.app/upgrade';
                void import('expo-linking').then(({ default: Linking }) => Linking.openURL(upgradeUrl));
                closeUpgradeSheet();
              }}
            >
              Upgrade to Pro — $7.99 / mo
            </Button>

            <TouchableOpacity onPress={closeUpgradeSheet} className="mt-4 items-center">
              <Text className="text-gray-500 text-sm">Maybe later</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
