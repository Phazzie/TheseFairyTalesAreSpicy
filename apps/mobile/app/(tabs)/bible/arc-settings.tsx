import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useArc } from '../../../hooks/useArcs.js';
import { useArcStore } from '../../../stores/arcStore.js';
import { SegmentedControl } from '../../../components/ui/SegmentedControl.js';
import { Slider } from '../../../components/ui/Slider.js';
import { Button } from '../../../components/ui/Button.js';
import { SPICE_LEVEL_LABELS } from '../../../lib/constants.js';
import { supabase } from '../../../lib/supabase.js';
import { useQueryClient } from '@tanstack/react-query';

export default function ArcSettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentArcId = useArcStore((s) => s.currentArcId);
  const { data: arc, isLoading, error } = useArc(currentArcId);

  const [spiceLevel, setSpiceLevel] = useState(3);
  const [povMode, setPovMode] = useState('first_person');
  const [tense, setTense] = useState('past');
  const [narrativeDistance, setNarrativeDistance] = useState('close');
  const [pacing, setPacing] = useState('slow_burn');
  const [readingLevel, setReadingLevel] = useState('commercial');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (arc) {
      const r = arc as Record<string, unknown>;
      if (r.default_spice_level) setSpiceLevel(r.default_spice_level as number);
      if (r.pov_mode) setPovMode(r.pov_mode as string);
      if (r.tense) setTense(r.tense as string);
      if (r.narrative_distance) setNarrativeDistance(r.narrative_distance as string);
      if (r.pacing_rhythm) setPacing(r.pacing_rhythm as string);
      if (r.reading_level) setReadingLevel(r.reading_level as string);
    }
  }, [arc]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-brand-deep items-center justify-center">
        <ActivityIndicator size="large" color="#7c3aed" />
      </SafeAreaView>
    );
  }

  if (error || !arc) {
    return (
      <SafeAreaView className="flex-1 bg-brand-deep items-center justify-center px-6">
        <Text className="text-red-400 text-base text-center">
          {error?.message ?? 'Arc not found'}
        </Text>
        <Button variant="ghost" className="mt-4" onPress={() => router.back()}>
          Go Back
        </Button>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    if (!currentArcId) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { error: updateError } = await supabase
        .from('arcs')
        .update({
          default_spice_level: spiceLevel,
          pov_mode: povMode,
          tense,
          narrative_distance: narrativeDistance,
          pacing_rhythm: pacing,
          reading_level: readingLevel,
          is_quick_start: false,
        })
        .eq('id', currentArcId);
      if (updateError) throw new Error(updateError.message);
      await queryClient.invalidateQueries({ queryKey: ['arcs', currentArcId] });
      router.back();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-deep">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-row items-center px-5 pt-4 pb-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text className="text-gray-400 text-xl">‹</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold flex-1">Arc Settings</Text>
        </View>

        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ gap: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <Slider
            label="Spice Level"
            value={spiceLevel}
            min={1}
            max={5}
            onChange={setSpiceLevel}
            valueLabel={SPICE_LEVEL_LABELS[spiceLevel]}
          />

          <SegmentedControl
            label="POV Mode"
            value={povMode}
            onChange={setPovMode}
            options={[
              { label: '1st Person', value: 'first_person' },
              { label: '3rd Close', value: 'third_limited' },
              { label: '3rd Omni', value: 'third_omniscient' },
            ]}
          />

          <SegmentedControl
            label="Tense"
            value={tense}
            onChange={setTense}
            options={[
              { label: 'Past', value: 'past' },
              { label: 'Present', value: 'present' },
            ]}
          />

          <SegmentedControl
            label="Narrative Distance"
            value={narrativeDistance}
            onChange={setNarrativeDistance}
            options={[
              { label: 'Close', value: 'close' },
              { label: 'Cinematic', value: 'cinematic' },
            ]}
          />

          <SegmentedControl
            label="Pacing"
            value={pacing}
            onChange={setPacing}
            options={[
              { label: 'Slow Burn', value: 'slow_burn' },
              { label: 'Propulsive', value: 'propulsive' },
              { label: 'Variable', value: 'variable' },
            ]}
          />

          <SegmentedControl
            label="Reading Level"
            value={readingLevel}
            onChange={setReadingLevel}
            options={[
              { label: 'Accessible', value: 'accessible' },
              { label: 'Commercial', value: 'commercial' },
              { label: 'Elevated', value: 'elevated' },
              { label: 'Archaic', value: 'archaic' },
            ]}
          />

          {saveError ? (
            <Text className="text-red-400 text-sm">{saveError}</Text>
          ) : null}

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            loading={saving}
            onPress={handleSave}
          >
            Save Settings
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
