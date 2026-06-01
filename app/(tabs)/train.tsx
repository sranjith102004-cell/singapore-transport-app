import { type LineFilter, type TrainStation } from '@/data/train';
import { stations } from '@/data/trainStations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BusStopArrivalsModal } from '@/components/train/BusStopArrivalsModal';
import { StationCard } from '@/components/train/StationCard';
import { StationDetailsModal } from '@/components/train/StationDetailsModal';
import { PlannerModal } from '@/components/train/PlannerModal';
import { SystemMapModal } from '@/components/train/SystemMapModal';
import { TrainEmptyState } from '@/components/train/TrainEmptyState';
import { TrainHeader } from '@/components/train/TrainHeader';
import { getDistance, loadNearbyBusStopsByStation, loadStationExitsById } from '@/components/train/trainData';
import type { BusStop } from '@/components/train/types';
import { useTrainBusStopArrivals } from '@/components/train/useTrainBusStopArrivals';
import { useTrainPlanner } from '@/components/train/useTrainPlanner';
import { useAppTheme } from '@/contexts/theme';

const TRAIN_FAVORITES_KEY = 'favorite_train_stations';
const mrtSystemMapPdf = require('../../assets/maps/mrt-system-map.pdf');
const wheelchairSymbol = require('../../assets/images/wheelchair-symbol.png');

type LocationStatus = 'loading' | 'ready' | 'unavailable';

export default function TrainScreen() {
  const { isLight } = useAppTheme();
  const [searchText, setSearchText] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [openedStationIds, setOpenedStationIds] = useState<string[]>([]);
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('loading');
  const [selectedLine, setSelectedLine] = useState<LineFilter>('ALL');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedStation, setSelectedStation] = useState<TrainStation | null>(null);
  const [nearbyBusStops, setNearbyBusStops] = useState<Record<string, BusStop[]>>({});
  const [stationExits, setStationExits] = useState<Record<string, string[]>>({});
  const busStopArrivals = useTrainBusStopArrivals();
  const trainPlanner = useTrainPlanner();
  const { loadRecentTrips } = trainPlanner;
  const { closeBusStopDetails, openBusStopDetails } = busStopArrivals;

  const colors = useMemo(
    () => ({
      bg: isLight ? '#f5f5f5' : '#000',
      card: isLight ? '#fff' : '#1a1a1a',
      input: isLight ? '#f1f1f1' : '#1a1a1a',
      border: isLight ? '#ddd' : '#333',
      text: isLight ? '#111' : '#fff',
      subText: isLight ? '#666' : '#aaa',
      muted: isLight ? '#888' : '#666',
    }),
    [isLight]
  );

  const loadFavorites = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(TRAIN_FAVORITES_KEY);
      const savedIds = saved ? JSON.parse(saved) : [];
      const validStationIds = new Set(stations.map((station) => station.id));

      setFavoriteIds(
        Array.isArray(savedIds)
          ? savedIds.filter((id): id is string => typeof id === 'string' && validStationIds.has(id))
          : []
      );
    } catch {
      setFavoriteIds([]);
    }
  }, []);

  const loadLocation = useCallback(async () => {
    try {
      setLocationStatus('loading');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation(null);
        setLocationStatus('unavailable');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation(currentLocation.coords);
      setLocationStatus('ready');
    } catch (err) {
      console.log('Train location error:', err);
      setLocation(null);
      setLocationStatus('unavailable');
    }
  }, []);

  const loadNearbyBusStops = useCallback(async () => {
    try {
      setNearbyBusStops(await loadNearbyBusStopsByStation());
    } catch (err) {
      console.log('Nearby train bus stops error:', err);
    }
  }, []);

  const loadStationExits = useCallback(async () => {
    try {
      setStationExits(await loadStationExitsById());
    } catch (err) {
      console.log('Train exits error:', err);
    }
  }, []);

  const closeTrainDetails = useCallback(() => {
    setOpenedStationIds([]);
    setSelectedStation(null);
    closeBusStopDetails();
  }, [closeBusStopDetails]);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
      loadRecentTrips();
      loadNearbyBusStops();
      loadStationExits();

      return closeTrainDetails;
    }, [closeTrainDetails, loadFavorites, loadNearbyBusStops, loadRecentTrips, loadStationExits])
  );

  useEffect(() => {
    loadLocation();
  }, [loadLocation]);

  const getStationExits = (station: TrainStation) => {
    return stationExits[station.id]?.length ? stationExits[station.id] : station.exits || [];
  };

  const getExitText = (station: TrainStation) => {
    const exits = getStationExits(station);
    if (exits.length === 0) return 'Exit information unavailable';

    return `${exits.length} ${exits.length === 1 ? 'exit' : 'exits'} available`;
  };

  const toggleFavorite = async (stationId: string) => {
    const updatedFavorites = favoriteIds.includes(stationId)
      ? favoriteIds.filter((id) => id !== stationId)
      : [...favoriteIds, stationId];

    setFavoriteIds(updatedFavorites);
    try {
      await AsyncStorage.setItem(TRAIN_FAVORITES_KEY, JSON.stringify(updatedFavorites));
    } catch (err) {
      console.log('Train favorites save error:', err);
    }
  };

  const toggleStation = (stationId: string) => {
    setOpenedStationIds((current) =>
      current.includes(stationId)
        ? current.filter((id) => id !== stationId)
        : [...current, stationId]
    );
  };

  const visibleStations = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const compactQuery = query.replace(/\s/g, '');

    return stations
      .map((station) => ({
        ...station,
        distance: locationStatus === 'ready' && location
          ? getDistance(location.latitude, location.longitude, station.latitude, station.longitude)
          : null,
      }))
      .filter((station) => {
        const matchesSearch =
          !query ||
          station.name.toLowerCase().includes(query) ||
          station.name.toLowerCase().replace(/\s/g, '').includes(compactQuery) ||
          station.area.toLowerCase().includes(query) ||
          station.codes.some((code) => code.toLowerCase().includes(compactQuery)) ||
          station.lines.some((line) => line.toLowerCase().includes(query));

        const matchesLine = selectedLine === 'ALL' || station.lines.includes(selectedLine);
        const matchesFavorite = !showFavoritesOnly || favoriteIds.includes(station.id);

        return matchesSearch && matchesLine && matchesFavorite;
      })
      .sort((a, b) => {
        if (a.distance === null && b.distance === null) return a.name.localeCompare(b.name);
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
  }, [favoriteIds, location, locationStatus, searchText, selectedLine, showFavoritesOnly]);

  const isPreparingLocationSort = locationStatus === 'loading';

  const handleSearchSubmit = () => {
    if (visibleStations.length !== 1) return;

    setOpenedStationIds((current) =>
      current.includes(visibleStations[0].id) ? current : [...current, visibleStations[0].id]
    );
    Keyboard.dismiss();
  };

  const clearFilters = () => {
    setSearchText('');
    setSelectedLine('ALL');
    setShowFavoritesOnly(false);
    Keyboard.dismiss();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <TrainHeader
        colors={colors}
        onClearTrainDetails={closeTrainDetails}
        onOpenMap={() => setShowMap(true)}
        onOpenPlanner={trainPlanner.openPlanner}
        onSearchSubmit={handleSearchSubmit}
        searchText={searchText}
        selectedLine={selectedLine}
        setSearchText={setSearchText}
        setSelectedLine={setSelectedLine}
        setShowFavoritesOnly={setShowFavoritesOnly}
        showFavoritesOnly={showFavoritesOnly}
      />

      {locationStatus === 'unavailable' && !isPreparingLocationSort && (
        <Text style={[styles.locationFallbackText, { color: colors.subText }]}>
          Location unavailable. Showing stations alphabetically.
        </Text>
      )}

      <FlatList
        data={isPreparingLocationSort ? [] : visibleStations}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <TrainEmptyState
            colors={colors}
            loadingLocation={isPreparingLocationSort}
            locationUnavailable={locationStatus === 'unavailable'}
            onClearFilters={clearFilters}
            searchText={searchText}
            selectedLine={selectedLine}
            showFavoritesOnly={showFavoritesOnly}
          />
        }
        renderItem={({ item }) => (
          <StationCard
            colors={colors}
            favorite={favoriteIds.includes(item.id)}
            nearbyBusStops={nearbyBusStops[item.id] || []}
            onOpenBusStop={openBusStopDetails}
            onOpenStationDetails={setSelectedStation}
            onToggle={toggleStation}
            onToggleFavorite={toggleFavorite}
            opened={openedStationIds.includes(item.id)}
            station={item}
          />
        )}
      />

      <StationDetailsModal
        colors={colors}
        exits={selectedStation ? getStationExits(selectedStation) : []}
        exitText={selectedStation ? getExitText(selectedStation) : ''}
        nearbyBusStops={selectedStation ? nearbyBusStops[selectedStation.id] || [] : []}
        onClose={() => setSelectedStation(null)}
        onOpenBusStop={openBusStopDetails}
        station={selectedStation}
      />

      <PlannerModal
        colors={colors}
        fromQuery={trainPlanner.plannerFromQuery}
        fromSuggestions={trainPlanner.plannerFromSuggestions}
        noRoute={trainPlanner.noPlannerRoute}
        onClearFrom={() => {
          trainPlanner.setPlannerFromQuery('');
          trainPlanner.setPlannerFromId('');
        }}
        onClearRecentTrips={trainPlanner.clearRecentTrips}
        onClearTo={() => {
          trainPlanner.setPlannerToQuery('');
          trainPlanner.setPlannerToId('');
        }}
        onClose={trainPlanner.closePlanner}
        onFromQueryChange={(text) => {
          trainPlanner.setPlannerFromQuery(text);
          trainPlanner.setPlannerFromId('');
        }}
        onRemoveRecentTrip={trainPlanner.removeRecentTrip}
        onSelectRecentTrip={trainPlanner.selectRecentTrip}
        onSelectStation={trainPlanner.selectPlannerStation}
        onSwapStations={trainPlanner.swapPlannerStations}
        onToQueryChange={(text) => {
          trainPlanner.setPlannerToQuery(text);
          trainPlanner.setPlannerToId('');
        }}
        recentTrips={trainPlanner.recentTrips}
        result={trainPlanner.plannerResult}
        toQuery={trainPlanner.plannerToQuery}
        toSuggestions={trainPlanner.plannerToSuggestions}
        visible={trainPlanner.showPlanner}
      />

      <BusStopArrivalsModal
        arrivals={busStopArrivals.selectedBusStopArrivals}
        colors={colors}
        error={busStopArrivals.busStopArrivalError}
        hasLiveBusLocation={busStopArrivals.hasLiveBusLocation}
        loading={busStopArrivals.loadingBusStopArrivals}
        onClose={busStopArrivals.closeBusStopDetails}
        onRefresh={busStopArrivals.fetchBusStopArrivals}
        stop={busStopArrivals.selectedBusStop}
        updatedAt={busStopArrivals.busStopArrivalsUpdatedAt}
        wheelchairSymbol={wheelchairSymbol}
      />

      <SystemMapModal
        colors={colors}
        mapSource={mrtSystemMapPdf}
        onClose={() => setShowMap(false)}
        visible={showMap}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 70,
  },
  locationFallbackText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: -2,
    marginBottom: 10,
  },
  listContent: {
    paddingBottom: 120,
    gap: 10,
  },
});
