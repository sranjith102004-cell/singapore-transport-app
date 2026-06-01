import { Alert } from 'react-native';

type CheckAppUpdateOptions = {
  silent?: boolean;
};

export const checkForAppUpdate = async ({ silent = false }: CheckAppUpdateOptions = {}) => {
  if (!silent) {
    Alert.alert('Updates unavailable', 'App updates can be checked from an iOS or Android release build.');
  }
};
