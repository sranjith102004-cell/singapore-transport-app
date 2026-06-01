import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BusArrivalCards } from '@/components/BusArrivalCards';
import { useAppTheme } from '@/contexts/theme';
import { fetchBusArrivals } from '@/data/busArrivals';

const FAVORITES_KEY = 'favorite_bus_stops';

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [busData, setBusData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [openedFavorites, setOpenedFavorites] = useState<string[]>([]);
  const [loadingBusStops, setLoadingBusStops] = useState<Record<string, boolean>>({});
  const [lastUpdatedByStop, setLastUpdatedByStop] = useState<Record<string, string>>({});
  const [arrivalErrorsByStop, setArrivalErrorsByStop] = useState<Record<string, string>>({});
  const { isLight } = useAppTheme();
  const [appState, setAppState] = useState(AppState.currentState);
  const arrivalLoadingStopsRef = useRef<Set<string>>(new Set());

const colors = useMemo(
  () => ({
    bg: isLight ? '#f5f5f5' : '#000',
    card: isLight ? '#fff' : '#1a1a1a',
    arrivalBg: isLight ? '#f7f7f7' : '#181818',
    border: isLight ? '#ddd' : '#333',
    text: isLight ? '#111' : '#fff',
    subText: isLight ? '#666' : '#aaa',
    muted: isLight ? '#888' : '#666',
    busCard: isLight ? '#f2f2f2' : '#222',
  }),
  [isLight]
);

  const loadFavorites = async () => {
    const saved = await AsyncStorage.getItem(FAVORITES_KEY);

    if (saved) {
      setFavorites(JSON.parse(saved));
    } else {
      setFavorites([]);
    }

    setLoading(false);
  };

  const fetchBusArrival = async (busStopCode: string) => {
    if (arrivalLoadingStopsRef.current.has(busStopCode)) return;

    try {
      arrivalLoadingStopsRef.current.add(busStopCode);
      setLoadingBusStops((prev) => ({ ...prev, [busStopCode]: true }));

      const services = await fetchBusArrivals(busStopCode);

      setBusData((prev: any) => ({
        ...prev,
        [busStopCode]: services,
      }));
      setLastUpdatedByStop((prev) => ({
        ...prev,
        [busStopCode]: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }));
      setArrivalErrorsByStop((prev) => {
        const next = { ...prev };
        delete next[busStopCode];
        return next;
      });
    } catch (err) {
      console.log(err);
      setArrivalErrorsByStop((prev) => ({
        ...prev,
        [busStopCode]: 'Unable to refresh bus timing',
      }));
    } finally {
      arrivalLoadingStopsRef.current.delete(busStopCode);
      setLoadingBusStops((prev) => {
        const next = { ...prev };
        delete next[busStopCode];
        return next;
      });
    }
  };

  const openFavorite = async (busStopCode: string) => {
    if (openedFavorites.includes(busStopCode)) {
      setOpenedFavorites((prev) => prev.filter((code) => code !== busStopCode));
      return;
    }

    setOpenedFavorites((prev) => [...prev, busStopCode]);
    await fetchBusArrival(busStopCode);
  };

  const removeFavorite = async (busStopCode: string) => {
    const updated = favorites.filter((item) => item.busStopCode !== busStopCode);

    setFavorites(updated);

    setOpenedFavorites((prev) => prev.filter((code) => code !== busStopCode));

    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  };

  const formatDistance = (distance: number) => {
    if (typeof distance !== 'number') return '-';
    if (distance < 1000) return `${Math.round(distance)}m`;

    return `${(distance / 1000).toFixed(1)}km`;
  };

  useFocusEffect(
  useCallback(() => {
    loadFavorites();

    return () => {
      arrivalLoadingStopsRef.current.clear();
      setOpenedFavorites([]);
      setLoadingBusStops({});
    };
  }, [])
);

  useEffect(() => {
    if (openedFavorites.length === 0 || appState !== 'active') return;

    const interval = setInterval(() => {
      openedFavorites.forEach((busStopCode) => {
        fetchBusArrival(busStopCode);
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [appState, openedFavorites]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);

    return () => subscription.remove();
  }, []);

  if (loading) {
    return (
      <View
style={[
styles.container,
{
backgroundColor:colors.bg
}
]}
>
        <ActivityIndicator size="large" color="#ff3366" />
      </View>
    );
  }

  const sections = favorites.map((stop) => ({
    stop,
    title: stop.busStopCode,
    data: openedFavorites.includes(stop.busStopCode)
      ? (busData[stop.busStopCode] || []).length > 0
        ? [...(busData[stop.busStopCode] || [])].sort(
            (a: any, b: any) => Number(a.ServiceNo) - Number(b.ServiceNo)
          )
        : [{ emptyMessage: true, busStopCode: stop.busStopCode }]
      : [],
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.fixedTitle, { backgroundColor: colors.bg }]}>
        <Text style={[styles.title, { color: colors.text }]}>Favorite Stops</Text>
      </View>

      <View style={styles.listArea}>
        <SectionList
          sections={sections}
          keyExtractor={(item: any, index) => `${item.ServiceNo}-${index}`}
          stickySectionHeadersEnabled
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.subText }]}>
              No favorites yet. Tap the heart on a bus stop to save it.
            </Text>
          }
          contentContainerStyle={{
            paddingBottom: 120,
          }}
          renderSectionHeader={({ section }) => {
            const item = section.stop;

            return (
              <View style={[styles.stickyHeaderWrap, { backgroundColor: colors.bg }]}>
                <Pressable
                  android_ripple={null}
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => openFavorite(item.busStopCode)}
                >
                  <View style={styles.row}>
                    <View style={styles.leftDistanceBox}>
                      <Ionicons name="navigate" size={18} color="#ff3366" />
                      <Text style={[styles.compactDistance, { color: colors.subText }]}>
                        {formatDistance(item.distance)}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.stopName, { color: colors.text }]}>
                        {item.description}
                      </Text>
                      <Text style={[styles.codeRoad, { color: colors.subText }]}>
                        {item.busStopCode} | {item.roadName}
                      </Text>
                    </View>

                    <Pressable
                      android_ripple={null}
                      onPress={(e) => {
                        e.stopPropagation();
                        removeFavorite(item.busStopCode);
                      }}
                    >
                      <Ionicons name="heart" size={26} color="#ff3366" />
                    </Pressable>
                  </View>

                  {openedFavorites.includes(item.busStopCode) && (
                    <View style={styles.refreshRow}>
                      <Text style={{ color: colors.subText, fontSize: 12 }}>
                        Updated: {lastUpdatedByStop[item.busStopCode] || 'Just now'} • Auto 15s
                      </Text>

                      <Pressable onPress={() => fetchBusArrival(item.busStopCode)}>
                        <Ionicons name="refresh" size={20} color="#ff3366" />
                      </Pressable>
                    </View>
                  )}

                  {openedFavorites.includes(item.busStopCode) && arrivalErrorsByStop[item.busStopCode] && (
                    <Text style={styles.arrivalErrorText}>
                      {arrivalErrorsByStop[item.busStopCode]}
                    </Text>
                  )}

                  {openedFavorites.includes(item.busStopCode) &&
                    loadingBusStops[item.busStopCode] && (
                      <View style={styles.loadingBusRow}>
                        <ActivityIndicator color="#ff3366" />
                      </View>
                    )}
                </Pressable>
              </View>
            );
          }}
          renderItem={({ item: bus }) => {
            if (bus.emptyMessage) {
              return (
                <View
                  style={[
                    styles.emptyBusCard,
                    {
                      backgroundColor: colors.busCard,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.emptyBusText, { color: colors.subText }]}>
                    No bus timing available
                  </Text>
                </View>
              );
            }

            return (
              <View
                style={[
                  styles.busCard,
                  {
                    backgroundColor: colors.busCard,
                    borderColor: colors.border,
                  },
                ]}
              >
              <Text style={[styles.busNumber, { color: colors.text }]}>
                Bus {bus.ServiceNo}
              </Text>

              <BusArrivalCards
                arrivals={[bus.NextBus, bus.NextBus2, bus.NextBus3]}
                arrivalBg={colors.arrivalBg}
                subTextColor={colors.subText}
              />
            </View>
            );
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 14,
  },

  loading: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    color: 'white',
    fontSize: 34,
    fontWeight: 'bold',
  },

  fixedTitle: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    paddingTop: 70,
    paddingBottom: 20,
    zIndex: 20,
    elevation: 20,
  },

  listArea: {
    flex: 1,
    marginTop: 130,
  },

  emptyText: {
    color: '#888',
    fontSize: 15,
    lineHeight: 22,
  },

  stickyHeaderWrap: {
    marginHorizontal: -14,
    paddingHorizontal: 14,
    paddingTop: 1,
    paddingBottom: 1,
    zIndex: 10,
    elevation: 10,
  },

  card: {
    backgroundColor: '#1a1a1a',
    padding: 18,
    borderRadius: 18,
    marginBottom: 6,
    borderWidth: 1,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  leftDistanceBox: {
    width: 46,
    alignItems: 'center',
    paddingTop: 2,
  },

  compactDistance: {
    fontSize: 12,
    marginTop: 4,
  },

  stopName: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },

  codeRoad: {
    marginTop: 4,
    fontSize: 13,
  },

  refreshRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 2,
  },
  arrivalErrorText: {
    color: '#ff3366',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },

  loadingBusRow: {
    marginTop: 12,
    alignItems: 'center',
  },

  busCard: {
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 12,
    marginTop: 1,
    marginBottom: 10,
    borderWidth: 1,
  },

  emptyBusCard: {
    padding: 14,
    borderRadius: 12,
    marginTop: 1,
    marginBottom: 10,
    borderWidth: 1,
    alignItems: 'center',
  },

  emptyBusText: {
    fontSize: 13,
    fontWeight: '600',
  },

  busNumber: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 1,
  },

});
