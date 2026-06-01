import { Alert } from 'react-native';
import * as Updates from 'expo-updates';

type CheckAppUpdateOptions = {
  silent?: boolean;
};

export const checkForAppUpdate = async ({ silent = false }: CheckAppUpdateOptions = {}) => {
  if (__DEV__ || !Updates.isEnabled) {
    if (!silent) {
      Alert.alert(
        'Updates unavailable',
        'App updates can be checked in an EAS release build. Expo Go and development mode use the development server instead.'
      );
    }

    return;
  }

  try {
    const update = await Updates.checkForUpdateAsync();

    if (!update.isAvailable) {
      if (!silent) {
        Alert.alert('Up to date', 'You are already using the latest available app update.');
      }

      return;
    }

    Alert.alert('Update available', 'Download and restart now?', [
      { text: 'Later', style: 'cancel' },
      {
        text: 'Update',
        onPress: async () => {
          try {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
          } catch {
            Alert.alert('Update failed', 'Unable to download the update. Please try again later.');
          }
        },
      },
    ]);
  } catch {
    if (!silent) {
      Alert.alert('Update check failed', 'Unable to check for updates right now. Please try again later.');
    }
  }
};
