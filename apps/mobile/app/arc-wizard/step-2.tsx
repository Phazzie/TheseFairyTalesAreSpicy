import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWizardStore } from '../../stores/wizardStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { Button } from '../../components/ui/Button.js';
import { THEMES, MAX_THEMES, WIZARD_TOTAL_STEPS } from '../../lib/constants.js';

export default function WizardStep2() {
  const router = useRouter();
  const { themes, addTheme, removeTheme } = useWizardStore();
  const { nextWizardStep, prevWizardStep } = useUIStore();

  const toggleTheme = (theme: string) => {
    if (themes.includes(theme)) {
      removeTheme(theme);
    } else if (themes.length < MAX_THEMES) {
      addTheme(theme);
    }
  };

  const atMax = themes.length >= MAX_THEMES;

  const handleBack = () => {
    prevWizardStep();
    router.back();
  };

  const handleContinue = () => {
    nextWizardStep();
    router.push('/arc-wizard/step-3');
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-deep">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress */}
        <View className="flex-row items-center gap-2">
          <Text className="text-gray-500 text-xs">
            Step 2 of {WIZARD_TOTAL_STEPS}
          </Text>
          <View className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
            <View
              className="h-full bg-brand-purple rounded-full"
              style={{ width: `${(2 / WIZARD_TOTAL_STEPS) * 100}%` }}
            />
          </View>
        </View>

        <View className="gap-1">
          <Text className="text-white text-3xl font-bold">Choose Your Themes</Text>
          <Text className="text-gray-400 text-sm">
            Select up to {MAX_THEMES} themes that define your story's emotional core.
          </Text>
        </View>

        {/* Count indicator */}
        <View className="flex-row items-center justify-between">
          <Text className={`text-sm font-semibold ${atMax ? 'text-yellow-400' : 'text-gray-300'}`}>
            {themes.length} / {MAX_THEMES} themes selected
          </Text>
          {atMax ? (
            <Text className="text-yellow-500 text-xs">Max 5 themes</Text>
          ) : null}
        </View>

        {/* Theme grid */}
        <View className="flex-row flex-wrap gap-2">
          {THEMES.map((theme) => {
            const isSelected = themes.includes(theme);
            const isDisabled = !isSelected && atMax;
            return (
              <TouchableOpacity
                key={theme}
                onPress={() => toggleTheme(theme)}
                disabled={isDisabled}
                activeOpacity={0.7}
                className={`px-4 py-2 rounded-full border ${
                  isSelected
                    ? 'bg-brand-purple border-brand-purple'
                    : isDisabled
                    ? 'bg-gray-900 border-gray-800 opacity-40'
                    : 'bg-gray-900 border-gray-700'
                }`}
              >
                <Text
                  className={`text-sm font-medium capitalize ${
                    isSelected ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  {theme}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="px-6 pb-8 pt-4 border-t border-gray-800 flex-row gap-3">
        <Button variant="ghost" size="lg" onPress={handleBack} className="flex-1">
          ← Back
        </Button>
        <Button
          variant="primary"
          size="lg"
          onPress={handleContinue}
          disabled={themes.length === 0}
          className="flex-2"
          style={{ flex: 2 }}
        >
          Continue →
        </Button>
      </View>
    </SafeAreaView>
  );
}
