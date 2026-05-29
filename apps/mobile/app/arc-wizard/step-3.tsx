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
import { Slider } from '../../components/ui/Slider.js';
import { SegmentedControl } from '../../components/ui/SegmentedControl.js';
import { Button } from '../../components/ui/Button.js';
import { SPICE_LEVEL_LABELS, WIZARD_TOTAL_STEPS } from '../../lib/constants.js';

export default function WizardStep3() {
  const router = useRouter();
  const { spiceLevel, readingLevel, genreBlendPrimary, genreBlendSecondary, genreBlendRatio, setField } =
    useWizardStore();
  const nextWizardStep = useUIStore((s) => s.nextWizardStep);
  const prevWizardStep = useUIStore((s) => s.prevWizardStep);

  const handleBack = () => {
    prevWizardStep();
    router.back();
  };

  const handleContinue = () => {
    nextWizardStep();
    router.push('/arc-wizard/step-4');
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
            Step 3 of {WIZARD_TOTAL_STEPS}
          </Text>
          <View className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
            <View
              className="h-full bg-brand-purple rounded-full"
              style={{ width: `${(3 / WIZARD_TOTAL_STEPS) * 100}%` }}
            />
          </View>
        </View>

        <View className="gap-1">
          <Text className="text-white text-3xl font-bold">Heat & Tone</Text>
          <Text className="text-gray-400 text-sm">
            Set the intensity level and literary register of your story.
          </Text>
        </View>

        <Slider
          label="Spice Level"
          value={spiceLevel}
          min={1}
          max={5}
          onChange={(v) => setField('spiceLevel', v as 1 | 2 | 3 | 4 | 5)}
          valueLabel={SPICE_LEVEL_LABELS[spiceLevel]}
        />

        <SegmentedControl
          label="Reading Level"
          value={readingLevel}
          onChange={(v) =>
            setField(
              'readingLevel',
              v as 'accessible' | 'commercial' | 'elevated' | 'archaic',
            )
          }
          options={[
            { label: 'Accessible', value: 'accessible' },
            { label: 'Commercial', value: 'commercial' },
            { label: 'Elevated', value: 'elevated' },
            { label: 'Archaic', value: 'archaic' },
          ]}
        />

        <SegmentedControl
          label="Primary Genre"
          value={genreBlendPrimary}
          onChange={(v) => setField('genreBlendPrimary', v)}
          options={[
            { label: 'Romance', value: 'romance' },
            { label: 'Horror', value: 'horror' },
            { label: 'Mystery', value: 'mystery' },
            { label: 'Thriller', value: 'thriller' },
          ]}
        />

        <View className="gap-1">
          <Text className="text-gray-400 text-xs">
            Optional: add a secondary genre for a blend
          </Text>
          <SegmentedControl
            label="Secondary Genre (optional)"
            value={genreBlendSecondary}
            onChange={(v) =>
              setField('genreBlendSecondary', v === genreBlendSecondary ? '' : v)
            }
            options={[
              { label: 'None', value: '' },
              { label: 'Horror', value: 'horror' },
              { label: 'Mystery', value: 'mystery' },
              { label: 'Thriller', value: 'thriller' },
            ]}
          />
        </View>

        {genreBlendSecondary ? (
          <Slider
            label={`Blend Ratio (${genreBlendRatio}% ${genreBlendPrimary} / ${100 - genreBlendRatio}% ${genreBlendSecondary})`}
            value={genreBlendRatio}
            min={10}
            max={90}
            onChange={(v) => setField('genreBlendRatio', v)}
          />
        ) : null}
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
