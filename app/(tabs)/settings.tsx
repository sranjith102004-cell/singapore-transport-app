import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { type ThemePreference, useAppTheme } from '@/contexts/theme';
import { checkForAppUpdate } from '@/data/appUpdates';
import { getNotificationPermissionStatus } from '@/data/notificationPermission';

const BUS_STOPS_CACHE_KEY = 'cached_bus_stops';
const BUS_STOPS_CACHE_TIME_KEY = 'cached_bus_stops_time';
const BUS_ROUTES_CACHE_KEY = 'cached_bus_routes';
const BUS_ROUTES_CACHE_TIME_KEY = 'cached_bus_routes_time';
type PermissionStatusText = 'Allowed' | 'Ask first' | 'Checking' | 'Not allowed' | 'Unavailable';

const getPermissionLabel = (status: string): PermissionStatusText => {
  if (status === 'granted') return 'Allowed';
  if (status === 'denied') return 'Not allowed';
  if (status === 'undetermined') return 'Ask first';
  return 'Unavailable';
};

export default function Settings() {
  const { theme, isLight, saveTheme } = useAppTheme();
  const [locationPermission, setLocationPermission] = useState<PermissionStatusText>('Checking');
  const [notificationPermission, setNotificationPermission] = useState<PermissionStatusText>('Checking');
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  const colors = useMemo(
    () => ({
      bg: isLight ? '#f5f5f5' : '#000',
      card: isLight ? '#fff' : '#1a1a1a',
      input: isLight ? '#f1f1f1' : '#111',
      border: isLight ? '#ddd' : '#333',
      text: isLight ? '#111' : '#fff',
      subText: isLight ? '#666' : '#aaa',
      muted: isLight ? '#888' : '#666',
    }),
    [isLight]
  );

  const loadPermissionStatus = useCallback(async () => {
    try {
      const locationStatus = await Location.getForegroundPermissionsAsync();
      setLocationPermission(getPermissionLabel(locationStatus.status));
    } catch {
      setLocationPermission('Unavailable');
    }

    try {
      const notificationStatus = await getNotificationPermissionStatus();
      setNotificationPermission(getPermissionLabel(notificationStatus));
    } catch {
      setNotificationPermission('Unavailable');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPermissionStatus();
    }, [loadPermissionStatus])
  );

  const clearBusCache = async () => {
    await AsyncStorage.multiRemove([
      BUS_STOPS_CACHE_KEY,
      BUS_STOPS_CACHE_TIME_KEY,
      BUS_ROUTES_CACHE_KEY,
      BUS_ROUTES_CACHE_TIME_KEY,
    ]);
    Alert.alert('Done', 'Bus cache cleared');
  };

  const confirmClearBusCache = () => {
    Alert.alert(
      'Clear Bus Cache?',
      'Bus stop and route data will be downloaded again next time the app needs it.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearBusCache },
      ]
    );
  };

  const checkForUpdates = async () => {
    if (checkingUpdate) return;

    try {
      setCheckingUpdate(true);
      await checkForAppUpdate();
    } finally {
      setCheckingUpdate(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Ionicons name="color-palette-outline" size={18} color="#ff3366" />
          </View>
          <View style={styles.sectionHeaderText}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.subText }]}>Choose how the app looks</Text>
          </View>
        </View>

        <View style={[styles.segmentedControl, { backgroundColor: colors.input, borderColor: colors.border }]}>
          {(['dark', 'light', 'system'] as ThemePreference[]).map((item) => {
            const isSelected = theme === item;

            return (
              <Pressable
                key={item}
                style={[styles.segmentButton, isSelected && styles.segmentButtonActive]}
                onPress={() => saveTheme(item)}
              >
                <Text style={[styles.segmentText, { color: isSelected ? '#fff' : colors.subText }]}>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Ionicons name="server-outline" size={18} color="#ff3366" />
          </View>
          <View style={styles.sectionHeaderText}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Data & Cache</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.subText }]}>
              Refresh stored bus stop and route data
            </Text>
          </View>
        </View>

        <Pressable style={[styles.settingRow, { borderTopColor: colors.border }]} onPress={confirmClearBusCache}>
          <View style={styles.rowTextWrap}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>Clear Bus Cache</Text>
            <Text style={[styles.rowSubtitle, { color: colors.subText }]}>The app will reload bus data next time</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Pressable>
      </View>

      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Ionicons name="cloud-download-outline" size={18} color="#ff3366" />
          </View>
          <View style={styles.sectionHeaderText}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>App Updates</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.subText }]}>
              Check for the latest published app update
            </Text>
          </View>
        </View>

        <Pressable
          style={[styles.settingRow, { borderTopColor: colors.border }]}
          onPress={checkForUpdates}
          disabled={checkingUpdate}
        >
          <View style={styles.rowTextWrap}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>Check for Updates</Text>
            <Text style={[styles.rowSubtitle, { color: colors.subText }]}>
              {checkingUpdate ? 'Checking now...' : 'Download an update when one is available'}
            </Text>
          </View>
          {checkingUpdate ? (
            <ActivityIndicator color="#ff3366" />
          ) : (
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          )}
        </Pressable>
      </View>

      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#ff3366" />
          </View>
          <View style={styles.sectionHeaderText}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Permissions</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.subText }]}>Current access used by the app</Text>
          </View>
        </View>

        <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.infoLabel, { color: colors.subText }]}>Location</Text>
          <View style={styles.statusWrap}>
            <View style={[styles.statusDot, locationPermission === 'Allowed' && styles.statusDotActive]} />
            <Text style={[styles.infoValue, { color: colors.text }]}>{locationPermission}</Text>
          </View>
        </View>

        <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.infoLabel, { color: colors.subText }]}>Notifications</Text>
          <View style={styles.statusWrap}>
            <View style={[styles.statusDot, notificationPermission === 'Allowed' && styles.statusDotActive]} />
            <Text style={[styles.infoValue, { color: colors.text }]}>{notificationPermission}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Ionicons name="information-circle-outline" size={18} color="#ff3366" />
          </View>
          <View style={styles.sectionHeaderText}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>App Info</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.subText }]}>Singapore bus and MRT/LRT helper</Text>
          </View>
        </View>

        <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.infoLabel, { color: colors.subText }]}>Version</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>1.0.0</Text>
        </View>

        <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.infoLabel, { color: colors.subText }]}>Data Source</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>LTA DataMall</Text>
        </View>
      </View>

      <Text style={[styles.footerText, { color: colors.subText }]}>
        Built for quick bus arrivals, nearby stops, and train trip planning.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 70,
    paddingBottom: 120,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 18,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 51, 102, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginTop: 16,
    minHeight: 48,
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  segmentButtonActive: {
    backgroundColor: '#ff3366',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '800',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 16,
    gap: 12,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  rowSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 14,
    gap: 14,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
  },
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
  },
  statusDotActive: {
    backgroundColor: '#1fc85b',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 4,
    textAlign: 'center',
  },
});
