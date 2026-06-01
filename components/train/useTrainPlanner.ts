import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard } from 'react-native';

import type { TrainStation } from '@/data/train';
import { planTrainTrip } from '@/data/trainPlanner';
import { stations } from '@/data/trainStations';

import type { RecentTrainTrip } from './types';

const RECENT_TRAIN_TRIPS_KEY = 'recent_train_trips';
const RECENT_TRAIN_TRIPS_LIMIT = 2;

export function useTrainPlanner() {
  const [showPlanner, setShowPlanner] = useState(false);
  const [plannerFromId, setPlannerFromId] = useState('');
  const [plannerToId, setPlannerToId] = useState('');
  const [plannerFromQuery, setPlannerFromQuery] = useState('');
  const [plannerToQuery, setPlannerToQuery] = useState('');
  const [recentTrips, setRecentTrips] = useState<RecentTrainTrip[]>([]);

  const loadRecentTrips = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(RECENT_TRAIN_TRIPS_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      const validStationIds = new Set(stations.map((station) => station.id));

      setRecentTrips(
        Array.isArray(parsed)
          ? parsed
              .filter(
                (trip): trip is RecentTrainTrip =>
                  typeof trip?.fromId === 'string' &&
                  typeof trip?.toId === 'string' &&
                  validStationIds.has(trip.fromId) &&
                  validStationIds.has(trip.toId) &&
                  trip.fromId !== trip.toId
              )
              .slice(0, RECENT_TRAIN_TRIPS_LIMIT)
          : []
      );
    } catch {
      setRecentTrips([]);
    }
  }, []);

  const plannerFromStation = useMemo(
    () => stations.find((station) => station.id === plannerFromId) || null,
    [plannerFromId]
  );

  const plannerToStation = useMemo(
    () => stations.find((station) => station.id === plannerToId) || null,
    [plannerToId]
  );

  const plannerResult = useMemo(() => {
    if (!plannerFromId || !plannerToId) return null;

    return planTrainTrip(plannerFromId, plannerToId);
  }, [plannerFromId, plannerToId]);

  const noPlannerRoute = plannerFromId.length > 0 && plannerToId.length > 0 && !plannerResult;

  const getPlannerSuggestions = useCallback((query: string, selectedId: string) => {
    const normalizedQuery = query.trim().toLowerCase();
    const compactQuery = normalizedQuery.replace(/\s/g, '');
    if (!normalizedQuery) return [];

    return stations
      .filter((station) => {
        if (station.id === selectedId && station.name.toLowerCase() === normalizedQuery) {
          return false;
        }

        return (
          station.name.toLowerCase().includes(normalizedQuery) ||
          station.name.toLowerCase().replace(/\s/g, '').includes(compactQuery) ||
          station.codes.some((code) => code.toLowerCase().includes(compactQuery))
        );
      })
      .slice(0, 6);
  }, []);

  const plannerFromSuggestions = useMemo(
    () => getPlannerSuggestions(plannerFromQuery, plannerFromId),
    [getPlannerSuggestions, plannerFromId, plannerFromQuery]
  );

  const plannerToSuggestions = useMemo(
    () => getPlannerSuggestions(plannerToQuery, plannerToId),
    [getPlannerSuggestions, plannerToId, plannerToQuery]
  );

  const selectPlannerStation = (station: TrainStation, field: 'from' | 'to') => {
    if (field === 'from') {
      setPlannerFromId(station.id);
      setPlannerFromQuery(station.name);
    } else {
      setPlannerToId(station.id);
      setPlannerToQuery(station.name);
    }
    Keyboard.dismiss();
  };

  const swapPlannerStations = () => {
    setPlannerFromId(plannerToId);
    setPlannerToId(plannerFromId);
    setPlannerFromQuery(plannerToStation?.name || '');
    setPlannerToQuery(plannerFromStation?.name || '');
  };

  const openPlanner = () => {
    setShowPlanner(true);
  };

  const closePlanner = () => {
    setShowPlanner(false);
    setPlannerFromId('');
    setPlannerToId('');
    setPlannerFromQuery('');
    setPlannerToQuery('');
    Keyboard.dismiss();
  };

  const saveRecentTrip = useCallback(async (fromId: string, toId: string) => {
    if (!fromId || !toId || fromId === toId) return;

    setRecentTrips((currentTrips) => {
      const updatedTrips = [
        { fromId, toId },
        ...currentTrips.filter((trip) => trip.fromId !== fromId || trip.toId !== toId),
      ].slice(0, RECENT_TRAIN_TRIPS_LIMIT);

      if (
        currentTrips.length === updatedTrips.length &&
        currentTrips.every(
          (trip, index) =>
            trip.fromId === updatedTrips[index].fromId &&
            trip.toId === updatedTrips[index].toId
        )
      ) {
        return currentTrips;
      }

      AsyncStorage.setItem(RECENT_TRAIN_TRIPS_KEY, JSON.stringify(updatedTrips)).catch((err) => {
        console.log('Recent train trips save error:', err);
      });

      return updatedTrips;
    });
  }, []);

  const selectRecentTrip = (trip: RecentTrainTrip) => {
    const fromStation = stations.find((station) => station.id === trip.fromId);
    const toStation = stations.find((station) => station.id === trip.toId);
    if (!fromStation || !toStation) return;

    setPlannerFromId(fromStation.id);
    setPlannerFromQuery(fromStation.name);
    setPlannerToId(toStation.id);
    setPlannerToQuery(toStation.name);
  };

  const removeRecentTrip = (tripToRemove: RecentTrainTrip) => {
    setRecentTrips((currentTrips) => {
      const updatedTrips = currentTrips.filter(
        (trip) => trip.fromId !== tripToRemove.fromId || trip.toId !== tripToRemove.toId
      );

      AsyncStorage.setItem(RECENT_TRAIN_TRIPS_KEY, JSON.stringify(updatedTrips)).catch((err) => {
        console.log('Recent train trips remove error:', err);
      });

      return updatedTrips;
    });
  };

  const clearRecentTrips = () => {
    setRecentTrips([]);
    AsyncStorage.removeItem(RECENT_TRAIN_TRIPS_KEY).catch((err) => {
      console.log('Recent train trips clear error:', err);
    });
  };

  useEffect(() => {
    if (!plannerResult) return;

    saveRecentTrip(plannerResult.from.id, plannerResult.to.id);
  }, [plannerResult, saveRecentTrip]);

  return {
    clearRecentTrips,
    closePlanner,
    loadRecentTrips,
    noPlannerRoute,
    openPlanner,
    plannerFromQuery,
    plannerFromSuggestions,
    plannerResult,
    plannerToQuery,
    plannerToSuggestions,
    recentTrips,
    removeRecentTrip,
    selectPlannerStation,
    selectRecentTrip,
    setPlannerFromId,
    setPlannerFromQuery,
    setPlannerToId,
    setPlannerToQuery,
    showPlanner,
    swapPlannerStations,
  };
}
