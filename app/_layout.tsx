import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider } from '@/contexts/theme';
import { checkForAppUpdate } from '@/data/appUpdates';

export default function RootLayout() {
  useEffect(() => {
    checkForAppUpdate({ silent: true });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
