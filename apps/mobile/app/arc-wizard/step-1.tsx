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
import { WIZARD_TOTAL_STEPS } from '../../lib/constants.js';

type CreatureType = 'vampire' | 'werewolf' | 'fairy';

interface CreatureOption {
  type: CreatureType;
  emoji: string;
  label: string;
  description: string;
}

const CREATURES: CreatureOption[] = [
  {
    type: 'vampire',
    emoji: '🧛',
    label: 'Vampire',
    description:
      'Ancient, magnetic, and dangerous. Vampires bring centuries of desire and denial. Perfect for power imbalance, obsession, and the thrill of surrender.',
  },
  {
    type: 'werewolf',
    emoji: '🐺',
    label: 'Werewolf',
    description:
      'Raw, passionate, and torn between worlds. Werewolves ignite fated-mates chemistry, pack loyalty, and the ache of belonging — or not.',
  },
  {
    type: 'fairy',
    emoji: '🧚',
    label: 'Fairy',
    description:
      'Capricious, beautiful, and bound by rules they never fully explain. Fairies weave bargains, glamours, and a love that might cost everything.',
  },
];

export default function WizardStep1() {
  const router = useRouter();
  const { creatureType, setField } = useWizardStore();
  const { nextWizardStep } = useUIStore();

  const handleContinue = () => {
    nextWizardStep();
    router.push('/arc-wizard/step-2');
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
            Step 1 of {WIZARD_TOTAL_STEPS}
          </Text>
          <View className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
            <View
              className="h-full bg-brand-purple rounded-full"
              style={{ width: `${(1 / WIZARD_TOTAL_STEPS) * 100}%` }}
            />
          </View>
        </View>

        <View className="gap-1">
          <Text className="text-white text-3xl font-bold">Choose Your Creature</Text>
          <Text className="text-gray-400 text-sm">
            What supernatural being will sweep your protagonist off her feet?
          </Text>
        </View>

        {/* Cards */}
        {CREATURES.map((c) => {
          const isSelected = creatureType === c.type;
          return (
            <TouchableOpacity
              key={c.type}
              onPress={() => setField('creatureType', c.type)}
              activeOpacity={0.8}
              className={`rounded-2xl border-2 p-5 gap-3 ${
                isSelected
                  ? 'border-brand-purple bg-brand-purple/10'
                  : 'border-gray-700 bg-gray-900/60'
              }`}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-4xl">{c.emoji}</Text>
                <View className="flex-1">
                  <Text
                    className={`text-xl font-bold ${
                      isSelected ? 'text-white' : 'text-gray-200'
                    }`}
                  >
                    {c.label}
                  </Text>
                </View>
                {isSelected ? (
                  <View className="w-6 h-6 rounded-full bg-brand-purple items-center justify-center">
                    <Text className="text-white text-xs font-bold">✓</Text>
                  </View>
                ) : (
                  <View className="w-6 h-6 rounded-full border-2 border-gray-600" />
                )}
              </View>
              <Text className="text-gray-400 text-sm leading-5">{c.description}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer */}
      <View className="px-6 pb-8 pt-4 border-t border-gray-800">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!creatureType}
          onPress={handleContinue}
        >
          Continue →
        </Button>
      </View>
    </SafeAreaView>
  );
}
