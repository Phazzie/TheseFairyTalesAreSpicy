import { Tabs, Redirect } from 'expo-router';
import { Text } from 'react-native';
import { useAuthStore } from '../../stores/authStore.js';

/**
 * Simple text-based tab icon helper — avoids adding an icon library dependency
 * while keeping each tab visually distinct. Can be swapped out for an icon
 * library (e.g. @expo/vector-icons) once installed.
 */
function TabIcon({ symbol, focused }: { symbol: string; focused: boolean }) {
  return (
    <Text
      style={{
        fontSize: 22,
        opacity: focused ? 1 : 0.45,
      }}
    >
      {symbol}
    </Text>
  );
}

export default function TabsLayout() {
  const { session } = useAuthStore();

  if (!session) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f0720',
          borderTopColor: 'rgba(124, 58, 237, 0.3)',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#7c3aed',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="write"
        options={{
          title: 'Write',
          tabBarIcon: ({ focused }) => <TabIcon symbol="✍️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="bible"
        options={{
          title: 'Bible',
          tabBarIcon: ({ focused }) => <TabIcon symbol="📖" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="threads"
        options={{
          title: 'Threads',
          tabBarIcon: ({ focused }) => <TabIcon symbol="🧵" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ focused }) => <TabIcon symbol="📚" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
