import { Stack, useRouter } from 'expo-router';
import { useUIStore } from '../../stores/uiStore.js';

export default function ArcWizardLayout() {
  const { wizardStep, prevWizardStep } = useUIStore();
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#1a0a2e' },
        animation: 'slide_from_right',
        gestureEnabled: wizardStep > 1,
      }}
    >
      <Stack.Screen
        name="step-1"
        options={{ gestureEnabled: false }}
        listeners={{
          beforeRemove: (e) => {
            if (wizardStep <= 1) return;
            e.preventDefault();
            prevWizardStep();
            router.back();
          },
        }}
      />
      <Stack.Screen name="step-2" />
      <Stack.Screen name="step-3" />
      <Stack.Screen name="step-4" />
      <Stack.Screen name="step-5" />
      <Stack.Screen name="step-6" />
      <Stack.Screen name="step-7" />
      <Stack.Screen name="step-8" />
    </Stack>
  );
}
