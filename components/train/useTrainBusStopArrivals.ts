import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { fetchBusArrivals, type LtaBusArrival } from '@/data/busArrivals';

import type { BusStop } from './types';

export function useTrainBusStopArrivals() {
  const [selectedBusStop, setSelectedBusStop] = useState<BusStop | null>(null);
  const [selectedBusStopArrivals, setSelectedBusStopArrivals] = useState<LtaBusArrival[]>([]);
  const [loadingBusStopArrivals, setLoadingBusStopArrivals] = useState(false);
  const [busStopArrivalsUpdatedAt, setBusStopArrivalsUpdatedAt] = useState('');
  const [busStopArrivalError, setBusStopArrivalError] = useState('');
  const [appState, setAppState] = useState(AppState.currentState);
  const busStopArrivalsLoadingRef = useRef(false);
  const busStopArrivalsRequestIdRef = useRef(0);

  const resetBusStopArrivals = useCallback(() => {
    setSelectedBusStopArrivals([]);
    setBusStopArrivalsUpdatedAt('');
    setBusStopArrivalError('');
  }, []);

  const closeBusStopDetails = useCallback(() => {
    busStopArrivalsRequestIdRef.current += 1;
    busStopArrivalsLoadingRef.current = false;
    setSelectedBusStop(null);
    setSelectedBusStopArrivals([]);
    setLoadingBusStopArrivals(false);
    setBusStopArrivalsUpdatedAt('');
    setBusStopArrivalError('');
  }, []);

  const hasLiveBusLocation = (nextBus?: LtaBusArrival['NextBus']) => {
    const latitude = Number(nextBus?.Latitude);
    const longitude = Number(nextBus?.Longitude);

    return !Number.isNaN(latitude) && !Number.isNaN(longitude) && latitude !== 0 && longitude !== 0;
  };

  const fetchBusStopArrivals = useCallback(async (stop: BusStop) => {
    if (busStopArrivalsLoadingRef.current) return;

    const requestId = busStopArrivalsRequestIdRef.current + 1;
    busStopArrivalsRequestIdRef.current = requestId;
    setLoadingBusStopArrivals(true);

    try {
      busStopArrivalsLoadingRef.current = true;
      const services = await fetchBusArrivals(stop.busStopCode);
      if (busStopArrivalsRequestIdRef.current !== requestId) return;

      setSelectedBusStopArrivals(
        services.sort((a, b) => Number(a.ServiceNo) - Number(b.ServiceNo))
      );
      setBusStopArrivalsUpdatedAt(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
      setBusStopArrivalError('');
    } catch (err) {
      console.log('Train bus arrival error:', err);
      if (busStopArrivalsRequestIdRef.current !== requestId) return;

      setSelectedBusStopArrivals([]);
      setBusStopArrivalError('Unable to refresh bus timing');
    } finally {
      if (busStopArrivalsRequestIdRef.current === requestId) {
        busStopArrivalsLoadingRef.current = false;
        setLoadingBusStopArrivals(false);
      }
    }
  }, []);

  const openBusStopDetails = useCallback(
    (stop: BusStop) => {
      setSelectedBusStop(stop);
      resetBusStopArrivals();
      fetchBusStopArrivals(stop);
    },
    [fetchBusStopArrivals, resetBusStopArrivals]
  );

  useEffect(() => {
    if (!selectedBusStop || appState !== 'active') return;

    const refreshTimer = setInterval(() => {
      fetchBusStopArrivals(selectedBusStop);
    }, 15000);

    return () => clearInterval(refreshTimer);
  }, [appState, fetchBusStopArrivals, selectedBusStop]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);

    return () => subscription.remove();
  }, []);

  return {
    busStopArrivalError,
    busStopArrivalsUpdatedAt,
    closeBusStopDetails,
    fetchBusStopArrivals,
    hasLiveBusLocation,
    loadingBusStopArrivals,
    openBusStopDetails,
    selectedBusStop,
    selectedBusStopArrivals,
  };
}
