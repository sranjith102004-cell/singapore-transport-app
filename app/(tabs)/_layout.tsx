import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/contexts/theme';
import { Tabs } from 'expo-router';

type TabIconName = React.ComponentProps<typeof Ionicons>['name'];

const tabIcons: Record<string, { active: TabIconName; inactive: TabIconName }> = {
  index: { active: 'bus', inactive: 'bus-outline' },
  favorites: { active: 'heart', inactive: 'heart-outline' },
  train: { active: 'train', inactive: 'train-outline' },
  settings: { active: 'settings', inactive: 'settings-outline' },
};

export default function TabLayout() {
  const { isLight } = useAppTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isLight ? '#fff' : '#111',
          borderTopColor: isLight ? '#ddd' : '#222',
          height: 70,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarActiveTintColor: '#ff3366',
        tabBarInactiveTintColor: '#888',
        tabBarIcon: ({ color, focused, size }) => {
          const icon = tabIcons[route.name];

          if (!icon) return null;

          return (
            <Ionicons
              name={focused ? icon.active : icon.inactive}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Nearby' }} />
      <Tabs.Screen name="favorites" options={{ title: 'Favorites' }} />
      <Tabs.Screen name="train" options={{ title: 'MRT/LRT' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
