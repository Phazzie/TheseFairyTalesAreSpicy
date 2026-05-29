import { Stack } from 'expo-router';
import { useAuthStore } from '../../stores/authStore.js';
import { Redirect } from 'expo-router';

export default function AuthLayout() {
  const { session } = useAuthStore();
  if (session) return <Redirect href="/(tabs)/write" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
