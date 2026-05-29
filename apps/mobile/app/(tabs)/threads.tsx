import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ThreadsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-brand-deep">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-3xl mb-2">🧵</Text>
        <Text className="text-white text-xl font-bold mb-1">Plot Threads</Text>
        <Text className="text-gray-400 text-sm text-center">
          Track open story threads and loose ends across your arc.
        </Text>
      </View>
    </SafeAreaView>
  );
}
