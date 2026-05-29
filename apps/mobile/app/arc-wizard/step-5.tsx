import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWizardStore } from '../../stores/wizardStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { SegmentedControl } from '../../components/ui/SegmentedControl.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { WIZARD_TOTAL_STEPS } from '../../lib/constants.js';

type AtmosphereArchetype =
  | 'gothic_manor'
  | 'enchanted_forest'
  | 'urban_underground'
  | 'ancient_court'
  | 'coastal_mist'
  | 'desert_ruins'
  | 'mountain_citadel';

interface ArchetypeOption {
  id: AtmosphereArchetype;
  emoji: string;
  label: string;
  description: string;
}

const ARCHETYPES: ArchetypeOption[] = [
  {
    id: 'gothic_manor',
    emoji: '🏚️',
    label: 'Gothic Manor',
    description: 'Crumbling opulence, secret passages, ancestral curses.',
  },
  {
    id: 'enchanted_forest',
    emoji: '🌲',
    label: 'Enchanted Forest',
    description: 'Ancient magic, wild rules, creatures older than memory.',
  },
  {
    id: 'urban_underground',
    emoji: '🌃',
    label: 'Urban Underground',
    description: 'Neon shadows, hidden courts beneath the city, mortal blind spots.',
  },
  {
    id: 'ancient_court',
    emoji: '🏛️',
    label: 'Ancient Court',
    description: 'Immortal politics, ritual etiquette, power dressed in silk.',
  },
  {
    id: 'coastal_mist',
    emoji: '🌊',
    label: 'Coastal Mist',
    description: 'Fog-soaked harbor towns, shipwrecks, sirens off the rocks.',
  },
  {
    id: 'desert_ruins',
    emoji: '🏜️',
    label: 'Desert Ruins',
    description: 'Scorching days, cold nights, forgotten civilizations still breathing.',
  },
  {
    id: 'mountain_citadel',
    emoji: '⛰️',
    label: 'Mountain Citadel',
    description: 'Isolation above the clouds, ancient stone, storms that last months.',
  },
];

export default function WizardStep5() {
  const router = useRouter();
  const { atmosphereArchetype, sensoryPrimary, recurringMotif, setField } =
    useWizardStore();
  const { nextWizardStep, prevWizardStep } = useUIStore();

  const handleBack = () => {
    prevWizardStep();
    router.back();
  };

  const handleContinue = () => {
    nextWizardStep();
    router.push('/arc-wizard/step-6');
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-deep">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, gap: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress */}
          <View className="flex-row items-center gap-2">
            <Text className="text-gray-500 text-xs">
              Step 5 of {WIZARD_TOTAL_STEPS}
            </Text>
            <View className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
              <View
                className="h-full bg-brand-purple rounded-full"
                style={{ width: `${(5 / WIZARD_TOTAL_STEPS) * 100}%` }}
              />
            </View>
          </View>

          <View className="gap-1">
            <Text className="text-white text-3xl font-bold">Setting</Text>
            <Text className="text-gray-400 text-sm">
              Choose the world your story breathes in.
            </Text>
          </View>

          {/* Atmosphere archetype cards */}
          <View className="gap-3">
            <Text className="text-gray-300 text-sm font-medium">
              Atmosphere Archetype
            </Text>
            {ARCHETYPES.map((arch) => {
              const isSelected = atmosphereArchetype === arch.id;
              return (
                <TouchableOpacity
                  key={arch.id}
                  onPress={() => setField('atmosphereArchetype', arch.id)}
                  activeOpacity={0.8}
                  className={`rounded-xl border p-4 flex-row items-start gap-3 ${
                    isSelected
                      ? 'border-brand-purple bg-brand-purple/10'
                      : 'border-gray-700 bg-gray-900/50'
                  }`}
                >
                  <Text className="text-2xl">{arch.emoji}</Text>
                  <View className="flex-1">
                    <Text
                      className={`text-base font-semibold ${
                        isSelected ? 'text-white' : 'text-gray-200'
                      }`}
                    >
                      {arch.label}
                    </Text>
                    <Text className="text-gray-500 text-xs mt-0.5 leading-4">
                      {arch.description}
                    </Text>
                  </View>
                  {isSelected ? (
                    <View className="w-5 h-5 rounded-full bg-brand-purple items-center justify-center">
                      <Text className="text-white text-xs">✓</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <SegmentedControl
            label="Primary Sensory Palette"
            value={sensoryPrimary}
            onChange={(v) =>
              setField(
                'sensoryPrimary',
                v as 'visual' | 'tactile' | 'auditory' | 'olfactory',
              )
            }
            options={[
              { label: 'Visual', value: 'visual' },
              { label: 'Tactile', value: 'tactile' },
              { label: 'Auditory', value: 'auditory' },
              { label: 'Olfactory', value: 'olfactory' },
            ]}
          />

          <Input
            label="Recurring Motif (optional)"
            value={recurringMotif}
            onChangeText={(v) => setField('recurringMotif', v)}
            placeholder="e.g. a silver ring, moonlight, red wine"
            helpText="A symbol or image that will echo through every chapter."
          />
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
            disabled={!atmosphereArchetype}
            style={{ flex: 2 }}
          >
            Continue →
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
