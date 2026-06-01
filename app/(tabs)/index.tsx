import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetSectionList } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { type ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BusArrivalCards } from '@/components/BusArrivalCards';
import { useAppTheme } from '@/contexts/theme';
import { fetchBusArrivals } from '@/data/busArrivals';
import {
  requestBusReminderPermissions,
  scheduleBusReminderNotification,
} from '@/data/busReminder';
import { getLtaHeaders } from '@/data/lta';
import BusMap, { type BusMapRef } from '../../components/BusMap';

type Stop = {
  busStopCode: string;
  roadName: string;
  description: string;
  latitude: number;
  longitude: number;
  distance: number;
};

type RoutePoint = Stop & {
  stopSequence: number;
};

type Place = {
  name: string;
  latitude: number;
  longitude: number;
};

type BusSchedule = {
  weekdayFirst: string;
  weekdayLast: string;
  saturdayFirst: string;
  saturdayLast: string;
  sundayFirst: string;
  sundayLast: string;
};

const FAVORITES_KEY = 'favorite_bus_stops';
const BUS_STOPS_CACHE_KEY = 'cached_bus_stops';
const BUS_STOPS_CACHE_TIME_KEY = 'cached_bus_stops_time';
const BUS_ROUTES_CACHE_KEY = 'cached_bus_routes';
const BUS_ROUTES_CACHE_TIME_KEY = 'cached_bus_routes_time';
const CACHE_DURATION = 24 * 60 * 60 * 1000;

const emptySchedule: BusSchedule = {
  weekdayFirst: '-',
  weekdayLast: '-',
  saturdayFirst: '-',
  saturdayLast: '-',
  sundayFirst: '-',
  sundayLast: '-',
};

export default function HomeScreen() {
  const { isLight } = useAppTheme();
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [allStops, setAllStops] = useState<Stop[]>([]);
  const [nearbyStops, setNearbyStops] = useState<Stop[]>([]);
  const [favorites, setFavorites] = useState<Stop[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [initialLoadError, setInitialLoadError] = useState('');
  const [openedStops, setOpenedStops] = useState<string[]>([]);
  const [busData, setBusData] = useState<Record<string, any[]>>({});
  const [lastUpdatedByStop, setLastUpdatedByStop] = useState<Record<string, string>>({});
  const [arrivalErrorsByStop, setArrivalErrorsByStop] = useState<Record<string, string>>({});
  const [loadingBusStops, setLoadingBusStops] = useState<Record<string, boolean>>({});
  const [routeStops, setRouteStops] = useState<RoutePoint[]>([]);
  const [selectedBus, setSelectedBus] = useState<string | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [searchingPlace, setSearchingPlace] = useState(false);
  const [searchedPlace, setSearchedPlace] = useState<Place | null>(null);
  const [routeDirectionText, setRouteDirectionText] = useState('');
  const [liveBusMode, setLiveBusMode] = useState(false);
  const [showBusInfo, setShowBusInfo] = useState(false);
  const [liveBusMarkers, setLiveBusMarkers] = useState<any[]>([]);
  const [liveBusMessage, setLiveBusMessage] = useState('');
  const [noSearchResults, setNoSearchResults] = useState(false);
  const [stopsWithVisibleBuses, setStopsWithVisibleBuses] = useState<string[]>([]);
  const [busInfoStop, setBusInfoStop] = useState<Stop | null>(null);
  const [busSchedule, setBusSchedule] = useState<BusSchedule>(emptySchedule);
  const [appState, setAppState] = useState(AppState.currentState);

  const mapRef = useRef<BusMapRef>(null);
  const bottomSheetRef = useRef<ComponentRef<typeof BottomSheet>>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const arrivalLoadingStopsRef = useRef<Set<string>>(new Set());
  const routeLoadingRef = useRef(false);
  const routeRequestIdRef = useRef(0);
  const liveBusRequestIdRef = useRef(0);
  const searchRequestIdRef = useRef(0);
  const restoreSheetAfterKeyboardRef = useRef(false);
  const busRowsViewabilityConfig = useRef({
    itemVisiblePercentThreshold: 10,
  }).current;
  const onBusRowsViewableItemsChanged = useRef(({ viewableItems }: any) => {
    const visibleStopCodes = Array.from(
      new Set(
        viewableItems
          .filter((viewableItem: any) => viewableItem.isViewable && viewableItem.item?.ServiceNo)
          .map((viewableItem: any) => viewableItem.section?.stop?.busStopCode)
          .filter(Boolean)
      )
    ) as string[];

    setStopsWithVisibleBuses((prev) => {
      if (
        prev.length === visibleStopCodes.length &&
        prev.every((code) => visibleStopCodes.includes(code))
      ) {
        return prev;
      }

      return visibleStopCodes;
    });
  }).current;

  const colors = useMemo(
    () => ({
      bg: isLight ? '#f5f5f5' : '#000',
      sheet: isLight ? '#fff' : '#111',
      card: isLight ? '#fff' : '#1a1a1a',
      subCard: isLight ? '#f2f2f2' : '#222',
      input: isLight ? '#f1f1f1' : '#1a1a1a',
      border: isLight ? '#ddd' : '#333',
      text: isLight ? '#111' : '#fff',
      subText: isLight ? '#666' : '#aaa',
      muted: isLight ? '#888' : '#666',
      arrivalBg: isLight ? '#f7f7f7' : '#181818',
    }),
    [isLight]
  );

  const snapPoints = useMemo(() => ['76%', '92%'], []);

  const restoreBottomSheetAfterKeyboard = useCallback(() => {
    restoreSheetAfterKeyboardRef.current = true;
    Keyboard.dismiss();

    requestAnimationFrame(() => {
      bottomSheetRef.current?.snapToIndex(0);
    });

    setTimeout(() => {
      if (!restoreSheetAfterKeyboardRef.current) return;
      restoreSheetAfterKeyboardRef.current = false;
      bottomSheetRef.current?.snapToIndex(0);
    }, 250);
  }, []);

  const loadFavorites = async () => {
    const saved = await AsyncStorage.getItem(FAVORITES_KEY);
    setFavorites(saved ? JSON.parse(saved) : []);
  };

  useFocusEffect(
    useCallback(() => {
      loadFavorites();

      return () => {
        routeRequestIdRef.current += 1;
        liveBusRequestIdRef.current += 1;
        routeLoadingRef.current = false;
        arrivalLoadingStopsRef.current.clear();
        setOpenedStops([]);
        setLoadingBusStops({});
        setLoadingRoute(false);
        setSelectedBus(null);
        setRouteStops([]);
        setRouteDirectionText('');
        setLiveBusMode(false);
        setLiveBusMarkers([]);
        setLiveBusMessage('');
        setShowBusInfo(false);
        setBusInfoStop(null);
        setBusSchedule(emptySchedule);
        setStopsWithVisibleBuses([]);
      };
    }, [])
  );

  const isFavorite = (code: string) =>
    favorites.some((stop) => stop.busStopCode === code);

  const toggleFavorite = async (stop: Stop) => {
    const updatedFavorites = isFavorite(stop.busStopCode)
      ? favorites.filter((item) => item.busStopCode !== stop.busStopCode)
      : [...favorites, stop];

    setFavorites(updatedFavorites);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const earthRadius = 6371e3;
    const p1 = (lat1 * Math.PI) / 180;
    const p2 = (lat2 * Math.PI) / 180;
    const dp = ((lat2 - lat1) * Math.PI) / 180;
    const dl = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dp / 2) ** 2 +
      Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;

    return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setInitialLoadError('');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation(null);
        setInitialLoadError('Location permission is needed to find nearby bus stops.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation(loc.coords);

      let loadedStops: any[] = [];
      const cachedStops = await AsyncStorage.getItem(BUS_STOPS_CACHE_KEY);
      const cachedTime = await AsyncStorage.getItem(BUS_STOPS_CACHE_TIME_KEY);
      const now = Date.now();

      if (cachedStops && cachedTime && now - Number(cachedTime) < CACHE_DURATION) {
        loadedStops = JSON.parse(cachedStops);
      } else {
        let skip = 0;
        let keepLoading = true;

        while (keepLoading) {
          const res = await axios.get(
            'https://datamall2.mytransport.sg/ltaodataservice/BusStops',
            {
              params: { $skip: skip },
              headers: getLtaHeaders(),
            }
          );

          const data = res.data.value || [];
          loadedStops = [...loadedStops, ...data];
          keepLoading = data.length >= 500;
          skip += 500;
        }

        await AsyncStorage.setItem(BUS_STOPS_CACHE_KEY, JSON.stringify(loadedStops));
        await AsyncStorage.setItem(BUS_STOPS_CACHE_TIME_KEY, String(now));
      }

      const processed: Stop[] = loadedStops.map((stop) => {
        const distance = getDistance(
          loc.coords.latitude,
          loc.coords.longitude,
          stop.Latitude,
          stop.Longitude
        );

        return {
          busStopCode: stop.BusStopCode,
          roadName: stop.RoadName,
          description: stop.Description,
          latitude: stop.Latitude,
          longitude: stop.Longitude,
          distance,
        };
      });

      setAllStops(processed);
      setNearbyStops([...processed].sort((a, b) => a.distance - b.distance).slice(0, 15));
    } catch (err) {
      console.log('Initial load error:', err);
      setLocation(null);
      setInitialLoadError('Unable to load nearby bus stops. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const formatDistance = (distance: number) => {
    if (distance < 1000) return `${Math.round(distance)}m`;

    return `${(distance / 1000).toFixed(1)}km`;
  };

  const fetchBusArrival = async (busStopCode: string) => {
    if (arrivalLoadingStopsRef.current.has(busStopCode)) return;

    try {
      arrivalLoadingStopsRef.current.add(busStopCode);
      setLoadingBusStops((prev) => ({ ...prev, [busStopCode]: true }));

      const services = await fetchBusArrivals(busStopCode);

      setBusData((prev) => ({
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
      console.log('Bus arrival error:', err);
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

  const fetchLiveBusMarkers = async (busStopCode: string, serviceNo: string) => {
    if (!busStopCode || !serviceNo) return;

    const requestId = liveBusRequestIdRef.current + 1;
    liveBusRequestIdRef.current = requestId;

    try {
      setLiveBusMessage('');

      const services = await fetchBusArrivals(busStopCode);
      if (liveBusRequestIdRef.current !== requestId) return;

      const selectedService = services.find(
        (bus: any) => bus.ServiceNo === serviceNo
      );

      const buses = [
        selectedService?.NextBus,
        selectedService?.NextBus2,
        selectedService?.NextBus3,
      ]
        .map((bus, index) => ({
          id: `${serviceNo}-${index}`,
          serviceNo,
          latitude: Number(bus?.Latitude),
          longitude: Number(bus?.Longitude),
          load: bus?.Load,
        }))
        .filter(
          (bus) =>
            !Number.isNaN(bus.latitude) &&
            !Number.isNaN(bus.longitude) &&
            bus.latitude !== 0 &&
            bus.longitude !== 0
      );

      if (liveBusRequestIdRef.current !== requestId) return;
      setLiveBusMarkers(buses);
      setLiveBusMessage(
        buses.length === 0 ? 'No live bus location available' : ''
      );
    } catch (err) {
      console.log('Live bus marker error:', err);
      if (liveBusRequestIdRef.current !== requestId) return;
      setLiveBusMarkers([]);
      setLiveBusMessage('Live bus location unavailable');
    }
  };

  const fetchBusRoute = async (serviceNo: string, selectedBusStopCode: string) => {
    if (routeLoadingRef.current) return;

    const requestId = routeRequestIdRef.current + 1;
    routeRequestIdRef.current = requestId;

    try {
      routeLoadingRef.current = true;
      setLoadingRoute(true);
      setSelectedBus(serviceNo);

      let loadedRoutes: any[] = [];
      const cachedRoutes = await AsyncStorage.getItem(BUS_ROUTES_CACHE_KEY);
      const cachedRoutesTime = await AsyncStorage.getItem(BUS_ROUTES_CACHE_TIME_KEY);
      const now = Date.now();

      if (
        cachedRoutes &&
        cachedRoutesTime &&
        now - Number(cachedRoutesTime) < CACHE_DURATION
      ) {
        loadedRoutes = JSON.parse(cachedRoutes);
      } else {
        let skip = 0;
        let keepLoading = true;

        while (keepLoading) {
          const res = await axios.get(
            'https://datamall2.mytransport.sg/ltaodataservice/BusRoutes',
            {
              params: { $skip: skip },
              headers: getLtaHeaders(),
            }
          );

          const data = res.data.value || [];
          loadedRoutes = [...loadedRoutes, ...data];
          keepLoading = data.length >= 500;
          skip += 500;
        }

        await AsyncStorage.setItem(BUS_ROUTES_CACHE_KEY, JSON.stringify(loadedRoutes));
          await AsyncStorage.setItem(BUS_ROUTES_CACHE_TIME_KEY, String(now));
      }

      if (routeRequestIdRef.current !== requestId) return;

      const serviceRoutes = loadedRoutes.filter(
        (route) => route.ServiceNo === serviceNo
      );

      const selectedDirection =
        serviceRoutes.find((route) => route.BusStopCode === selectedBusStopCode)
          ?.Direction || serviceRoutes[0]?.Direction;

      const routeForDirection = serviceRoutes
        .filter((route) => route.Direction === selectedDirection)
        .sort((a, b) => a.StopSequence - b.StopSequence);

      const routePoints: RoutePoint[] = routeForDirection
        .map((route) => {
          const stop = allStops.find((s) => s.busStopCode === route.BusStopCode);
          if (!stop) return null;

          return {
            ...stop,
            stopSequence: route.StopSequence,
          };
        })
        .filter((stop): stop is RoutePoint => stop !== null);

      if (routeRequestIdRef.current !== requestId) return;

      setRouteStops(routePoints);

      if (routePoints.length > 0) {
        const startName = routePoints[0].description;
        const endName = routePoints[routePoints.length - 1].description;
        setRouteDirectionText(`${startName} -> ${endName}`);

        mapRef.current?.fitToCoordinates(
          routePoints.map((stop) => ({
            latitude: stop.latitude,
            longitude: stop.longitude,
          })),
          {
            edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
            animated: true,
          }
        );
      }

      const currentBusStop = routeForDirection.find(
        (route) => route.BusStopCode === selectedBusStopCode
      );

      setBusSchedule({
        weekdayFirst: currentBusStop?.WD_FirstBus || '-',
        weekdayLast: currentBusStop?.WD_LastBus || '-',
        saturdayFirst: currentBusStop?.SAT_FirstBus || '-',
        saturdayLast: currentBusStop?.SAT_LastBus || '-',
        sundayFirst: currentBusStop?.SUN_FirstBus || '-',
        sundayLast: currentBusStop?.SUN_LastBus || '-',
      });
    } catch (err) {
      console.log('Route error:', err);
    } finally {
      if (routeRequestIdRef.current === requestId) {
        routeLoadingRef.current = false;
        setLoadingRoute(false);
      }
    }
  };

  const openBusInfo = (stop: Stop, serviceNo: string) => {
    if (routeLoadingRef.current) return;

    setBusInfoStop(stop);
    setSelectedBus(serviceNo);
    setRouteDirectionText('');
    setBusSchedule(emptySchedule);
    setShowBusInfo(true);
    fetchBusRoute(serviceNo, stop.busStopCode);
  };

  const clearRoute = () => {
    routeRequestIdRef.current += 1;
    routeLoadingRef.current = false;
    setLoadingRoute(false);
    setSelectedBus(null);
    setRouteStops([]);
    setRouteDirectionText('');
    setLiveBusMode(false);
    liveBusRequestIdRef.current += 1;
    setLiveBusMarkers([]);
    setLiveBusMessage('');

    if (location) {
      mapRef.current?.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500
      );
    }
  };

  const openStop = async (item: Stop) => {
    if (loadingRoute) return;

    if (openedStops.includes(item.busStopCode)) {
      setOpenedStops((prev) => prev.filter((code) => code !== item.busStopCode));
      return;
    }

    setOpenedStops((prev) => [...prev, item.busStopCode]);
    await fetchBusArrival(item.busStopCode);
  };

  const searchPlace = async (query: string, requestId: number) => {
    try {
      setSearchingPlace(true);

      const res = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: `${query}, Singapore`,
          format: 'json',
          limit: 1,
        },
        headers: {
          'User-Agent': 'SGBusApp/1.0',
        },
      });

      const place = res.data?.[0];
      if (searchRequestIdRef.current !== requestId) return;
      if (!place) {
        setNoSearchResults(true);
        return;
      }

      const placeLat = Number(place.lat);
      const placeLon = Number(place.lon);
      if (searchRequestIdRef.current !== requestId) return;
      if (Number.isNaN(placeLat) || Number.isNaN(placeLon)) {
        setNoSearchResults(true);
        return;
      }

      setSearchedPlace({
        name: place.display_name,
        latitude: placeLat,
        longitude: placeLon,
      });
      setNoSearchResults(false);

      const nearestToPlace = allStops
        .map((stop) => ({
          ...stop,
          distance: getDistance(placeLat, placeLon, stop.latitude, stop.longitude),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 15);

      setNearbyStops(nearestToPlace);
      setOpenedStops([]);
      clearRoute();

      mapRef.current?.animateToRegion(
        {
          latitude: placeLat,
          longitude: placeLon,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500
      );
    } catch (err) {
      console.log('Place search error:', err);
    } finally {
      if (searchRequestIdRef.current === requestId) {
        setSearchingPlace(false);
      }
    }
  };

  const handleSearch = async (text: string) => {
    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;
    const query = text.trim().toLowerCase();

    if (!query) {
      setSearchedPlace(null);
      setNoSearchResults(false);
      setNearbyStops([...allStops].sort((a, b) => a.distance - b.distance).slice(0, 15));
      return;
    }

    if (query.length < 2) return;

    const busStopResults = allStops
      .filter((stop) => {
        const code = stop.busStopCode.toLowerCase();
        const name = stop.description.toLowerCase();
        const road = stop.roadName.toLowerCase();

        return code.includes(query) || name.includes(query) || road.includes(query);
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 15);

    if (busStopResults.length > 0) {
      if (searchRequestIdRef.current !== requestId) return;
      setSearchedPlace(null);
      setNoSearchResults(false);
      setNearbyStops(busStopResults);
      return;
    }

    await searchPlace(query, requestId);
  };

  const handleSearchDebounced = (text: string) => {
    setSearchText(text);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(text);
    }, 700);
  };

  const clearSearch = () => {
    searchRequestIdRef.current += 1;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    setSearchText('');
    setSearchedPlace(null);
    setSearchingPlace(false);
    setNoSearchResults(false);
    setNearbyStops([...allStops].sort((a, b) => a.distance - b.distance).slice(0, 15));
    restoreBottomSheetAfterKeyboard();
  };

  const recenterMap = () => {
    if (!location) return;

    setSearchedPlace(null);
    mapRef.current?.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      500
    );
  };

  const sendBusReminder = async (serviceNo: string, minutesBefore: number) => {
    if (!busInfoStop) return;

    const services = busData[busInfoStop.busStopCode] || [];
    const selectedService = services.find((bus) => bus.ServiceNo === serviceNo);
    const estimatedArrival = selectedService?.NextBus?.EstimatedArrival;

    if (!estimatedArrival) {
      Alert.alert('No timing', 'Bus arrival timing unavailable');
      return;
    }

    const arrivalTime = new Date(estimatedArrival).getTime();
    const notifyTime = arrivalTime - minutesBefore * 60 * 1000;
    const secondsFromNow = Math.max(1, Math.round((notifyTime - Date.now()) / 1000));

    const didSchedule = await scheduleBusReminderNotification(
      serviceNo,
      minutesBefore,
      secondsFromNow
    );

    Alert.alert(
      didSchedule ? 'Reminder set' : 'Reminders unavailable',
      didSchedule
        ? `${minutesBefore} min reminder created`
        : 'Bus reminders are available on iOS and Android.'
    );
  };

  useEffect(() => {
    if (openedStops.length === 0 || appState !== 'active') return;

    const interval = setInterval(() => {
      openedStops.forEach((busStopCode) => {
        fetchBusArrival(busStopCode);
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [appState, openedStops]);

  useEffect(() => {
    if (!liveBusMode || !busInfoStop || !selectedBus || appState !== 'active') return;

    fetchLiveBusMarkers(busInfoStop.busStopCode, selectedBus);

    const interval = setInterval(() => {
      fetchLiveBusMarkers(busInfoStop.busStopCode, selectedBus);
    }, 15000);

    return () => clearInterval(interval);
  }, [appState, liveBusMode, busInfoStop, selectedBus]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const keyboardHideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      if (!restoreSheetAfterKeyboardRef.current) return;
      restoreSheetAfterKeyboardRef.current = false;
      bottomSheetRef.current?.snapToIndex(0);
    });

    return () => keyboardHideSubscription.remove();
  }, []);

  useEffect(() => {
    loadFavorites();
    requestBusReminderPermissions();
    loadInitialData();

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [loadInitialData]);

  const sections = nearbyStops.map((stop) => ({
    stop,
    title: stop.busStopCode,
    data: openedStops.includes(stop.busStopCode)
      ? (busData[stop.busStopCode] || []).length > 0
        ? [...(busData[stop.busStopCode] || [])].sort(
            (a, b) => Number(a.ServiceNo) - Number(b.ServiceNo)
          )
        : [{ emptyMessage: true, busStopCode: stop.busStopCode }]
      : [],
  }));
  const showClearMapButton =
    routeStops.length > 0 || liveBusMarkers.length > 0 || selectedBus !== null || loadingRoute;

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color="#ff3366" />
        <Text style={{ color: colors.text, marginTop: 10 }}>
          Loading Nearby Stops...
        </Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.bg }]}>
        <Ionicons name="location-outline" size={42} color="#ff3366" />
        <Text style={[styles.loadingTitle, { color: colors.text }]}>Nearby stops unavailable</Text>
        <Text style={[styles.loadingMessage, { color: colors.subText }]}>
          {initialLoadError || 'Location is unavailable right now.'}
        </Text>
        <Pressable style={styles.retryButton} onPress={loadInitialData}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.mapArea}>
        <BusMap
          ref={mapRef}
          style={styles.map}
          location={location}
          searchedPlace={searchedPlace}
          nearbyStops={nearbyStops}
          routeStops={routeStops}
          liveBusMarkers={liveBusMarkers}
          selectedBus={selectedBus}
        />

        <Pressable style={styles.locationButton} onPress={recenterMap}>
          <Ionicons name="locate" size={24} color="white" />
        </Pressable>

        {showClearMapButton && (
          <Pressable style={styles.clearMapRouteButton} onPress={clearRoute}>
            <Ionicons name="trash-outline" size={20} color="white" />
          </Pressable>
        )}

        {liveBusMessage.length > 0 && (
          <View style={styles.mapMessage}>
            <Text style={styles.mapMessageText}>{liveBusMessage}</Text>
          </View>
        )}
      </View>

      <Modal visible={showBusInfo} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.busInfoModal,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setShowBusInfo(false)}
            >
              <Ionicons name="close-circle" size={34} color="#ff3366" />
            </Pressable>

            <Text style={[styles.modalBusNumber, { color: colors.text }]}>
              {selectedBus}
            </Text>

            <Text style={[styles.modalStopName, { color: colors.text }]}>
              {busInfoStop?.description}
            </Text>

            <Text style={[styles.modalStopRoad, { color: colors.subText }]}>
              {busInfoStop?.busStopCode} | {busInfoStop?.roadName}
            </Text>

            <View style={[styles.directionBox, { backgroundColor: colors.subCard }]}>
              <Text style={[styles.directionText, { color: colors.text }]}>
                {routeDirectionText}
              </Text>
            </View>

            <View style={[styles.scheduleTable, { backgroundColor: colors.subCard }]}>
              <View style={styles.scheduleRow}>
                <Text style={[styles.scheduleHeader, { color: colors.text }]}>Day</Text>
                <Text style={[styles.scheduleHeader, { color: colors.text }]}>First Bus</Text>
                <Text style={[styles.scheduleHeader, { color: colors.text }]}>Last Bus</Text>
              </View>

              <View style={styles.scheduleRow}>
                <Text style={[styles.modalScheduleText, { color: colors.text }]}>Weekday</Text>
                <Text style={[styles.modalScheduleText, { color: colors.text }]}>
                  {busSchedule.weekdayFirst}
                </Text>
                <Text style={[styles.modalScheduleText, { color: colors.text }]}>
                  {busSchedule.weekdayLast}
                </Text>
              </View>

              <View style={styles.scheduleRow}>
                <Text style={[styles.modalScheduleText, { color: colors.text }]}>Saturday</Text>
                <Text style={[styles.modalScheduleText, { color: colors.text }]}>
                  {busSchedule.saturdayFirst}
                </Text>
                <Text style={[styles.modalScheduleText, { color: colors.text }]}>
                  {busSchedule.saturdayLast}
                </Text>
              </View>

              <View style={styles.scheduleRow}>
                <Text style={[styles.modalScheduleText, { color: colors.text }]}>Sunday</Text>
                <Text style={[styles.modalScheduleText, { color: colors.text }]}>
                  {busSchedule.sundayFirst}
                </Text>
                <Text style={[styles.modalScheduleText, { color: colors.text }]}>
                  {busSchedule.sundayLast}
                </Text>
              </View>
            </View>

            <View style={styles.modalButtonRow}>
              <Pressable
                style={styles.modalButton}
                onPress={() => {
                  Alert.alert('Bus Reminder', 'Choose reminder', [
                    {
                      text: '5 min before',
                      onPress: () => sendBusReminder(selectedBus || '', 5),
                    },
                    {
                      text: '2 min before',
                      onPress: () => sendBusReminder(selectedBus || '', 2),
                    },
                    {
                      text: 'Arriving now',
                      onPress: () => sendBusReminder(selectedBus || '', 0),
                    },
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                  ]);
                }}
              >
                <Text style={styles.modalButtonText}>Bus Reminder</Text>
              </Pressable>

              <Pressable
                style={styles.modalButton}
                onPress={() => {
                  setLiveBusMode(true);
                  fetchLiveBusMarkers(busInfoStop?.busStopCode || '', selectedBus || '');
                  setShowBusInfo(false);
                }}
              >
                <Text style={styles.modalButtonText}>Track Live Bus</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        topInset={120}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        enablePanDownToClose={false}
        enableContentPanningGesture={false}
        backgroundStyle={{
          backgroundColor: colors.sheet,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        }}
        handleStyle={{
          paddingVertical: 16,
          backgroundColor: colors.sheet,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        }}
        handleIndicatorStyle={{
          backgroundColor: isLight ? '#aaa' : '#666',
          width: 70,
          height: 6,
        }}
      >
        <View style={[styles.fixedHeader, { backgroundColor: colors.sheet }]}>
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: colors.input,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="search" size={20} color={colors.muted} />

            <TextInput
              value={searchText}
              onChangeText={handleSearchDebounced}
              onSubmitEditing={restoreBottomSheetAfterKeyboard}
              placeholder="Search bus stop, road, code, or place"
              placeholderTextColor={colors.muted}
              style={[styles.searchInput, { color: colors.text }]}
            />

            {searchText.length > 0 && (
              <Pressable style={styles.searchClearButton} onPress={clearSearch}>
                <Ionicons name="close-circle" size={22} color={colors.muted} />
              </Pressable>
            )}
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {searchedPlace ? 'Bus Stops Near Place' : 'Nearby Bus Stops'}
          </Text>

          {searchingPlace && <Text style={styles.routeLoading}>Searching place...</Text>}
          {loadingRoute && <Text style={styles.routeLoading}>Loading route...</Text>}
          {noSearchResults && (
            <Text style={[styles.emptySearchText, { color: colors.subText }]}>
              No results found
            </Text>
          )}
        </View>

        <BottomSheetSectionList
          sections={sections}
          keyExtractor={(item: any, index) => `${item.ServiceNo}-${index}`}
          stickySectionHeadersEnabled={openedStops.length > 0}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          viewabilityConfig={busRowsViewabilityConfig}
          onViewableItemsChanged={onBusRowsViewableItemsChanged}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 260,
          }}
          renderSectionHeader={({ section }) => {
            const item = section.stop;
            const shouldConnectStop =
              openedStops.includes(item.busStopCode) &&
              stopsWithVisibleBuses.includes(item.busStopCode);

            return (
              <View style={[styles.stickyHeaderWrap, { backgroundColor: colors.sheet }]}>
                <Pressable
                  style={[
                  styles.card,
                  shouldConnectStop && styles.openedStopCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: shouldConnectStop
                        ? colors.card
                        : colors.border,
                  },
                  ]}
                  onPress={() => openStop(item)}
                >
                  <View style={styles.compactStopRow}>
                    <View style={styles.leftDistanceBox}>
                      <Ionicons name="navigate" size={18} color="#ff3366" />
                      <Text style={[styles.compactDistance, { color: colors.subText }]}>
                        {formatDistance(item.distance)}
                      </Text>
                    </View>

                    <View style={styles.compactStopInfo}>
                      <Text style={[styles.stopName, { color: colors.text }]}>
                        {item.description}
                      </Text>

                      <Text style={[styles.codeRoad, { color: colors.subText }]}>
                        {item.busStopCode} | {item.roadName}
                      </Text>
                    </View>

                    <Pressable
                      style={{ paddingTop: 2 }}
                      onPress={(event) => {
                        event.stopPropagation();
                        toggleFavorite(item);
                      }}
                    >
                      <Ionicons
                        name={isFavorite(item.busStopCode) ? 'heart' : 'heart-outline'}
                        size={26}
                        color={isFavorite(item.busStopCode) ? '#ff3366' : '#888'}
                      />
                    </Pressable>
                  </View>

                  {openedStops.includes(item.busStopCode) && (
                    <View style={styles.refreshRow}>
                      <Text style={{ color: colors.subText, fontSize: 12 }}>
                        Updated: {lastUpdatedByStop[item.busStopCode] || 'Just now'} • Auto 15s
                      </Text>

                      <Pressable onPress={() => fetchBusArrival(item.busStopCode)}>
                        <Ionicons name="refresh" size={20} color="#ff3366" />
                      </Pressable>
                    </View>
                  )}

                  {openedStops.includes(item.busStopCode) && arrivalErrorsByStop[item.busStopCode] && (
                    <Text style={styles.arrivalErrorText}>
                      {arrivalErrorsByStop[item.busStopCode]}
                    </Text>
                  )}

                  {openedStops.includes(item.busStopCode) && loadingBusStops[item.busStopCode] && (
                    <View style={styles.loadingBusRow}>
                      <ActivityIndicator color="#ff3366" />
                    </View>
                  )}
                </Pressable>
              </View>
            );
          }}
          renderItem={({ item: bus, section, index }) => {
            const stop = section.stop;

            if (bus.emptyMessage) {
              return (
                <View style={[styles.emptyBusCard, { backgroundColor: colors.subCard }]}>
                  <Text style={[styles.emptyBusText, { color: colors.subText }]}>
                    No bus timing available
                  </Text>
                </View>
              );
            }

            return (
              <Pressable
                style={[
                  styles.busCard,
                  index === 0 && styles.firstBusCard,
                  { backgroundColor: colors.subCard },
                  selectedBus === bus.ServiceNo && styles.selectedBusCard,
                ]}
                onPress={(event) => {
                  event.stopPropagation();

                  if (loadingRoute) return;

                  if (selectedBus === bus.ServiceNo && routeStops.length > 0) {
                    clearRoute();
                    return;
                  }

                  fetchBusRoute(bus.ServiceNo, stop.busStopCode);
                }}
              >
                <View style={styles.busHeaderRow}>
                  <Text style={[styles.busNumber, { color: colors.text }]}>
                    Bus {bus.ServiceNo}
                  </Text>

                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation();
                      openBusInfo(stop, bus.ServiceNo);
                    }}
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={24}
                      color="#ff3366"
                    />
                  </Pressable>
                </View>

                <BusArrivalCards
                  arrivals={[bus.NextBus, bus.NextBus2, bus.NextBus3]}
                  arrivalBg={colors.arrivalBg}
                  subTextColor={colors.subText}
                />
              </Pressable>
            );
          }}
        />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapArea: {
    height: '35%',
    width: '100%',
  },
  map: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 14,
    textAlign: 'center',
  },
  loadingMessage: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 42,
    borderRadius: 21,
    backgroundColor: '#ff3366',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 18,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  locationButton: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    backgroundColor: '#ff3366',
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  clearMapRouteButton: {
    position: 'absolute',
    right: 18,
    bottom: 84,
    backgroundColor: '#111',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  mapMessage: {
    position: 'absolute',
    left: 18,
    right: 86,
    bottom: 28,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  mapMessageText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  fixedHeader: {
    paddingHorizontal: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
    minHeight: 50,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 12,
  },
  searchClearButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  routeLoading: {
    color: '#ff3366',
    marginBottom: 10,
  },
  emptySearchText: {
    fontSize: 13,
    marginBottom: 10,
  },
  stickyHeaderWrap: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingTop: 1,
  },
  card: {
    padding: 14,
    borderRadius: 16,
    marginBottom: 6,
    borderWidth: 1.2,
    boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
    elevation: 3,
  },
  openedStopCard: {
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  compactStopRow: {
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
  compactStopInfo: {
    flex: 1,
  },
  stopName: {
    fontSize: 16,
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
    marginTop: 10,
    alignItems: 'center',
  },
  busCard: {
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginBottom: 6,
  },
  emptyBusCard: {
    padding: 14,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 6,
    alignItems: 'center',
  },
  emptyBusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  firstBusCard: {
    marginTop: 1,
  },
  selectedBusCard: {
    borderWidth: 2,
    borderColor: '#ff3366',
  },
  busHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  busNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  busInfoModal: {
    width: '100%',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
  },
  modalBusNumber: {
    fontSize: 54,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalStopName: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
  },
  modalStopRoad: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
  },
  directionBox: {
    marginTop: 14,
    padding: 10,
    borderRadius: 12,
  },
  directionText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  scheduleTable: {
    marginTop: 22,
    borderRadius: 16,
    padding: 14,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  scheduleHeader: {
    flex: 1,
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalScheduleText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#ff3366',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  liveBusMarker: {
    backgroundColor: '#ff3366',
    minWidth: 38,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    paddingHorizontal: 6,
  },
  liveBusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
});
