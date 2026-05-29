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

export default function WizardStep6() {
  const router = useRouter();
  const {
    protagonistName,
    protagonistSpecies,
    protagonistDesire,
    protagonistNeed,
    protagonistWound,
    protagonistFlaw,
    protagonistLie,
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
    router.push('/arc-wizard/step-7');
  };

  const canContinue = protagonistName.trim().length > 0;

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
              Step 6 of {WIZARD_TOTAL_STEPS}
            </Text>
            <View className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
              <View
                className="h-full bg-brand-purple rounded-full"
                style={{ width: `${(6 / WIZARD_TOTAL_STEPS) * 100}%` }}
              />
            </View>
          </View>

          <View className="gap-1">
            <Text className="text-white text-3xl font-bold">Your Protagonist</Text>
            <Text className="text-gray-400 text-sm">
              The woman at the heart of the story. Give her depth — contradiction is what makes her real.
            </Text>
          </View>

          <Input
            label="Name"
            value={protagonistName}
            onChangeText={(v) => setField('protagonistName', v)}
            placeholder="e.g. Elara Morvaine"
            autoCapitalize="words"
          />

          <SegmentedControl
            label="Species"
            value={protagonistSpecies}
            onChange={(v) => setField('protagonistSpecies', v)}
            options={[
              { label: 'Human', value: 'human' },
              { label: 'Vampire', value: 'vampire' },
              { label: 'Werewolf', value: 'werewolf' },
              { label: 'Fairy', value: 'fairy' },
            ]}
          />

          <Input
            label="What does she want?"
            value={protagonistDesire}
            onChangeText={(v) => setField('protagonistDesire', v)}
            placeholder="e.g. To expose the vampire court's corruption"
            helpText="Her stated desire — what she says she wants."
            multiline
            style={{ minHeight: 64, textAlignVertical: 'top' }}
          />

          <Input
            label="What does she actually need?"
            value={protagonistNeed}
            onChangeText={(v) => setField('protagonistNeed', v)}
            placeholder="e.g. To trust someone again after being betrayed"
            helpText="Her hidden need — what would truly fulfill her."
            multiline
            style={{ minHeight: 64, textAlignVertical: 'top' }}
          />

          <Input
            label="Her wound"
            value={protagonistWound}
            onChangeText={(v) => setField('protagonistWound', v)}
            placeholder="e.g. Lost her mother to a vampire attack at age 12"
            helpText="The backstory trauma that drives her behavior."
            multiline
            style={{ minHeight: 64, textAlignVertical: 'top' }}
          />

          <Input
            label="Her flaw"
            value={protagonistFlaw}
            onChangeText={(v) => setField('protagonistFlaw', v)}
            placeholder="e.g. Pushes people away when she starts to care"
            helpText="The active flaw that creates conflict."
            multiline
            style={{ minHeight: 64, textAlignVertical: 'top' }}
          />

          <Input
            label="The lie she believes"
            value={protagonistLie}
            onChangeText={(v) => setField('protagonistLie', v)}
            placeholder="e.g. I don't deserve to be loved"
            helpText="The false belief she holds about herself."
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
