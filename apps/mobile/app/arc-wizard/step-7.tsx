import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWizardStore } from '../../stores/wizardStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { Input } from '../../components/ui/Input.js';
import { SegmentedControl } from '../../components/ui/SegmentedControl.js';
import { Button } from '../../components/ui/Button.js';
import { WIZARD_TOTAL_STEPS } from '../../lib/constants.js';

export default function WizardStep7() {
  const router = useRouter();
  const {
    loveInterestName,
    loveInterestSpecies,
    loveInterestDesire,
    loveInterestNeed,
    loveInterestWound,
    loveInterestFlaw,
    loveInterestLie,
    setField,
  } = useWizardStore();
  const nextWizardStep = useUIStore((s) => s.nextWizardStep);
  const prevWizardStep = useUIStore((s) => s.prevWizardStep);

  const handleBack = () => {
    prevWizardStep();
    router.back();
  };

  const handleContinue = () => {
    nextWizardStep();
    router.push('/arc-wizard/step-8');
  };

  const canContinue = loveInterestName.trim().length > 0;

  return (
    <SafeAreaView className="flex-1 bg-brand-deep">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, gap: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress */}
          <View className="flex-row items-center gap-2">
            <Text className="text-gray-500 text-xs">
              Step 7 of {WIZARD_TOTAL_STEPS}
            </Text>
            <View className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
              <View
                className="h-full bg-brand-purple rounded-full"
                style={{ width: `${(7 / WIZARD_TOTAL_STEPS) * 100}%` }}
              />
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-white text-3xl font-bold">The Love Interest</Text>
            <Text className="text-gray-400 text-sm">
              Who stands in the way of what she wants — or embodies it?
            </Text>
            <View className="bg-gray-900/60 border border-gray-700 rounded-xl px-4 py-3 mt-1">
              <Text className="text-gray-300 text-sm leading-5">
                The best love interests are as psychologically complex as the protagonist. Their wound should
                rhyme with hers. Their desire should collide with hers. Their lie should be the mirror of her lie.
              </Text>
            </View>
          </View>

          <Input
            label="Name"
            value={loveInterestName}
            onChangeText={(v) => setField('loveInterestName', v)}
            placeholder="e.g. Caspian Darkwood"
            autoCapitalize="words"
          />

          <SegmentedControl
            label="Species"
            value={loveInterestSpecies}
            onChange={(v) => setField('loveInterestSpecies', v)}
            options={[
              { label: 'Vampire', value: 'vampire' },
              { label: 'Werewolf', value: 'werewolf' },
              { label: 'Fairy', value: 'fairy' },
              { label: 'Human', value: 'human' },
            ]}
          />

          <Input
            label="What do they want?"
            value={loveInterestDesire}
            onChangeText={(v) => setField('loveInterestDesire', v)}
            placeholder="e.g. To protect their bloodline at any cost"
            helpText="Their stated desire — what they say they want."
            multiline
            style={{ minHeight: 64, textAlignVertical: 'top' }}
          />

          <Input
            label="What do they actually need?"
            value={loveInterestNeed}
            onChangeText={(v) => setField('loveInterestNeed', v)}
            placeholder="e.g. To be loved for who they are, not what they are"
            helpText="Their hidden need — what would truly fulfill them."
            multiline
            style={{ minHeight: 64, textAlignVertical: 'top' }}
          />

          <Input
            label="Their wound"
            value={loveInterestWound}
            onChangeText={(v) => setField('loveInterestWound', v)}
            placeholder="e.g. Was betrayed by the one human they loved, centuries ago"
            helpText="The backstory trauma that drives their behavior."
            multiline
            style={{ minHeight: 64, textAlignVertical: 'top' }}
          />

          <Input
            label="Their flaw"
            value={loveInterestFlaw}
            onChangeText={(v) => setField('loveInterestFlaw', v)}
            placeholder="e.g. Treats love as a transaction — protection in exchange for control"
            helpText="The active flaw that creates conflict."
            multiline
            style={{ minHeight: 64, textAlignVertical: 'top' }}
          />

          <Input
            label="The lie they believe"
            value={loveInterestLie}
            onChangeText={(v) => setField('loveInterestLie', v)}
            placeholder="e.g. They are too dangerous to love"
            helpText="The false belief they hold about themselves."
            multiline
            style={{ minHeight: 64, textAlignVertical: 'top' }}
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
            disabled={!canContinue}
            style={{ flex: 2 }}
          >
            Continue →
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
