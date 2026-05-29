import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore.js';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { session, isLoading } = useAuthStore();
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-deep">
        <ActivityIndicator color="#7c3aed" />
      </View>
    );
  }
  return <Redirect href={session ? '/(tabs)/write' : '/auth/login'} />;
}
