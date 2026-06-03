import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWizardStore } from '../../stores/wizardStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { useArcStore } from '../../stores/arcStore.js';
import { useCreateArc as useCreateArcMutation } from '../../hooks/useArcs.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Card } from '../../components/ui/Card.js';
import { CREATURE_LABELS, SPICE_LEVEL_LABELS, WIZARD_TOTAL_STEPS } from '../../lib/constants.js';

function SummaryRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View className="flex-row gap-2">
      <Text className="text-gray-500 text-sm w-28 shrink-0">{label}</Text>
      <Text className="text-gray-200 text-sm flex-1">{value}</Text>
    </View>
  );
}

export default function WizardStep8() {
  const router = useRouter();
  const creatureType = useWizardStore((s) => s.creatureType);
  const spiceLevel = useWizardStore((s) => s.spiceLevel);
  const tense = useWizardStore((s) => s.tense);
  const povMode = useWizardStore((s) => s.povMode);
  const pacingRhythm = useWizardStore((s) => s.pacingRhythm);
  const protagonistName = useWizardStore((s) => s.protagonistName);
  const protagonistSpecies = useWizardStore((s) => s.protagonistSpecies);
  const loveInterestName = useWizardStore((s) => s.loveInterestName);
  const loveInterestSpecies = useWizardStore((s) => s.loveInterestSpecies);
  const themes = useWizardStore((s) => s.themes);
  const creatureRules = useWizardStore((s) => s.creatureRules);
  const creatureWeaknesses = useWizardStore((s) => s.creatureWeaknesses);
  const creatureAbilities = useWizardStore((s) => s.creatureAbilities);
  const setField = useWizardStore((s) => s.setField);
  const resetWizard = useWizardStore((s) => s.reset);
  const toArcInsert = useWizardStore((s) => s.toArcInsert);
  const prevWizardStep = useUIStore((s) => s.prevWizardStep);
  const setWizardStep = useUIStore((s) => s.setWizardStep);
  const setCurrentArcId = useArcStore((s) => s.setCurrentArcId);
  const createArc = useCreateArcMutation();

  const [arcTitle, setArcTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    prevWizardStep();
    router.back();
  };

  const handleCreate = async () => {
    setError(null);
    const payload = {
      ...toArcInsert(),
      title:
        arcTitle.trim() ||
        `${protagonistName || 'Untitled'} & ${loveInterestName || 'Unknown'}`,
    };

    try {
      const newArc = await createArc.mutateAsync(payload);
      const arcRecord = newArc as Record<string, unknown>;
      setCurrentArcId(arcRecord.id as string);
      resetWizard();
      setWizardStep(1);
      // Small delay to allow store updates to propagate before routing
      setTimeout(() => {
        router.replace('/(tabs)/write');
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create arc');
    }
  };

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
              Step 8 of {WIZARD_TOTAL_STEPS}
            </Text>
            <View className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
              <View className="h-full bg-brand-purple rounded-full w-full" />
            </View>
          </View>

          <View className="gap-1">
            <Text className="text-white text-3xl font-bold">Review & Create</Text>
            <Text className="text-gray-400 text-sm">
              Almost there. Give your arc a title and confirm your creature's lore.
            </Text>
          </View>

          {/* Arc title */}
          <Input
            label="Arc Title (optional)"
            value={arcTitle}
            onChangeText={setArcTitle}
            placeholder={`${protagonistName || 'Elara'} & ${loveInterestName || 'Caspian'}`}
            helpText="Leave blank to auto-generate from character names."
          />

          {/* Summary card */}
          <Card className="gap-3">
            <Text className="text-white text-base font-semibold mb-1">Story Summary</Text>

            {creatureType ? (
              <View className="flex-row items-center gap-2">
                <Text className="text-gray-500 text-sm w-28">Creature</Text>
                <Badge
                  label={CREATURE_LABELS[creatureType] ?? creatureType}
                  variant="creature"
                />
              </View>
            ) : null}

            <SummaryRow
              label="Spice Level"
              value={SPICE_LEVEL_LABELS[spiceLevel]}
            />
            <SummaryRow label="Tense" value={tense} />
            <SummaryRow label="POV" value={povMode.replace(/_/g, ' ')} />
            <SummaryRow label="Pacing" value={pacingRhythm.replace(/_/g, ' ')} />
            <SummaryRow
              label="Protagonist"
              value={
                protagonistName
                  ? `${protagonistName} (${protagonistSpecies})`
                  : undefined
              }
            />
            <SummaryRow
              label="Love Interest"
              value={
                loveInterestName
                  ? `${loveInterestName} (${loveInterestSpecies})`
                  : undefined
              }
            />

            {themes.length > 0 ? (
              <View className="gap-1">
                <Text className="text-gray-500 text-sm">Themes</Text>
                <View className="flex-row flex-wrap gap-1">
                  {themes.map((t) => (
                    <Badge key={t} label={t} variant="theme" />
                  ))}
                </View>
              </View>
            ) : null}
          </Card>

          {/* Creature lore editor */}
          <View className="gap-1">
            <Text className="text-white text-lg font-semibold">Creature Lore</Text>
            <Text className="text-gray-400 text-xs">
              One rule / weakness / ability per line. The engine will reference these while generating.
            </Text>
          </View>

          <Input
            label="Rules"
            value={creatureRules}
            onChangeText={(v) => setField('creatureRules', v)}
            placeholder={"Cannot enter a home uninvited\nBurns in direct sunlight"}
            multiline
            numberOfLines={4}
            style={{ minHeight: 90, textAlignVertical: 'top' }}
          />

          <Input
            label="Weaknesses"
            value={creatureWeaknesses}
            onChangeText={(v) => setField('creatureWeaknesses', v)}
            placeholder={"Silver\nRunning water\nHoly symbols"}
            multiline
            numberOfLines={4}
            style={{ minHeight: 90, textAlignVertical: 'top' }}
          />

          <Input
            label="Abilities"
            value={creatureAbilities}
            onChangeText={(v) => setField('creatureAbilities', v)}
            placeholder={"Compulsion\nShapeshift\nHeightened senses"}
            multiline
            numberOfLines={4}
            style={{ minHeight: 90, textAlignVertical: 'top' }}
          />

          {/* Error */}
          {error ? (
            <View className="bg-red-900/40 border border-red-700 rounded-xl p-3">
              <Text className="text-red-300 text-sm">{error}</Text>
            </View>
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
            onPress={handleCreate}
            loading={createArc.isPending}
            disabled={!creatureType || !protagonistName}
            style={{ flex: 2 }}
          >
            Create Arc
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
