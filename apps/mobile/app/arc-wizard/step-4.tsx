import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWizardStore } from '../../stores/wizardStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { SegmentedControl } from '../../components/ui/SegmentedControl.js';
import { Button } from '../../components/ui/Button.js';
import { WIZARD_TOTAL_STEPS } from '../../lib/constants.js';

export default function WizardStep4() {
  const router = useRouter();
  const { povMode, tense, narrativeDistance, pacingRhythm, setField } = useWizardStore();
  const { nextWizardStep, prevWizardStep } = useUIStore();

  const handleBack = () => {
    prevWizardStep();
    router.back();
  };

  const handleContinue = () => {
    nextWizardStep();
    router.push('/arc-wizard/step-5');
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-deep">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress */}
        <View className="flex-row items-center gap-2">
          <Text className="text-gray-500 text-xs">
            Step 4 of {WIZARD_TOTAL_STEPS}
          </Text>
          <View className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
            <View
              className="h-full bg-brand-purple rounded-full"
              style={{ width: `${(4 / WIZARD_TOTAL_STEPS) * 100}%` }}
            />
          </View>
        </View>

        <View className="gap-1">
          <Text className="text-white text-3xl font-bold">Narrative Settings</Text>
          <Text className="text-gray-400 text-sm">
            Define the narrative craft choices that shape your reader's experience.
          </Text>
        </View>

        <SegmentedControl
          label="Point of View"
          value={povMode}
          onChange={(v) => setField('povMode', v)}
          options={[
            { label: '1st Person', value: 'first_person' },
            { label: '3rd Close', value: 'third_limited' },
            { label: '3rd Omni', value: 'third_omniscient' },
          ]}
        />

        <SegmentedControl
          label="Tense"
          value={tense}
          onChange={(v) => setField('tense', v as 'past' | 'present')}
          options={[
            { label: 'Past', value: 'past' },
            { label: 'Present', value: 'present' },
          ]}
        />

        <SegmentedControl
          label="Narrative Distance"
          value={narrativeDistance}
          onChange={(v) =>
            setField('narrativeDistance', v as 'close' | 'cinematic')
          }
          options={[
            { label: 'Close', value: 'close' },
            { label: 'Cinematic', value: 'cinematic' },
          ]}
        />

        <SegmentedControl
          label="Pacing Rhythm"
          value={pacingRhythm}
          onChange={(v) =>
            setField('pacingRhythm', v as 'slow_burn' | 'propulsive' | 'variable')
          }
          options={[
            { label: 'Slow Burn', value: 'slow_burn' },
            { label: 'Propulsive', value: 'propulsive' },
            { label: 'Variable', value: 'variable' },
          ]}
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
          style={{ flex: 2 }}
        >
          Continue →
        </Button>
      </View>
    </SafeAreaView>
  );
}
