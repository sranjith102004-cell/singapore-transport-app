import { LTA_API_KEY } from '../config';

const getLtaApiKey = () => {
  const apiKey = LTA_API_KEY.trim();

  if (!apiKey) {
    throw new Error('Missing EXPO_PUBLIC_LTA_API_KEY in the app environment');
  }

  return apiKey;
};

export const getLtaHeaders = () => ({
  AccountKey: getLtaApiKey(),
  Accept: 'application/json',
});
