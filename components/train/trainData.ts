import AsyncStorage from '@react-native-async-storage/async-storage';

import type { TrainStation } from '@/data/train';
import { stations } from '@/data/trainStations';

import type { BusStop } from './types';

const BUS_STOPS_CACHE_KEY = 'cached_bus_stops';
const TRAIN_EXITS_CACHE_KEY = 'cached_train_exits';
const TRAIN_EXITS_CACHE_TIME_KEY = 'cached_train_exits_time';
const TRAIN_EXITS_DATASET_ID = 'd_b39d3a0871985372d7e1637193335da5';
const TRAIN_EXITS_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

type CachedBusStop = {
  BusStopCode: string;
  RoadName: string;
  Description: string;
  Latitude: number;
  Longitude: number;
};

type TrainExitFeature = {
  properties?: {
    STATION_NA?: string;
    EXIT_CODE?: string;
  };
};

export const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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

const normalizeStationName = (name: string) => {
  return name
    .toUpperCase()
    .replace(/\b(MRT|LRT)\b/g, '')
    .replace(/\bSTATION\b/g, '')
    .replace(/[^A-Z0-9]/g, '');
};

export const loadNearbyBusStopsByStation = async () => {
  const cachedStops = await AsyncStorage.getItem(BUS_STOPS_CACHE_KEY);
  if (!cachedStops) return {};

  const busStops: BusStop[] = (JSON.parse(cachedStops) as CachedBusStop[]).map((stop) => ({
    busStopCode: stop.BusStopCode,
    roadName: stop.RoadName,
    description: stop.Description,
    latitude: stop.Latitude,
    longitude: stop.Longitude,
    distance: 0,
  }));

  return stations.reduce<Record<string, BusStop[]>>((result, station) => {
    result[station.id] = busStops
      .map((stop) => ({
        ...stop,
        distance: getDistance(station.latitude, station.longitude, stop.latitude, stop.longitude),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 6);

    return result;
  }, {});
};

export const loadStationExitsById = async () => {
  const cachedExits = await AsyncStorage.getItem(TRAIN_EXITS_CACHE_KEY);
  const cachedTime = await AsyncStorage.getItem(TRAIN_EXITS_CACHE_TIME_KEY);
  const now = Date.now();

  if (cachedExits && cachedTime && now - Number(cachedTime) < TRAIN_EXITS_CACHE_DURATION) {
    return JSON.parse(cachedExits) as Record<string, string[]>;
  }

  const downloadResponse = await fetch(
    `https://api-open.data.gov.sg/v1/public/api/datasets/${TRAIN_EXITS_DATASET_ID}/poll-download`
  );
  const downloadJson = await downloadResponse.json();
  const downloadUrl = downloadJson?.data?.url;
  if (!downloadUrl) return {};

  const geoJsonResponse = await fetch(downloadUrl);
  const geoJson = await geoJsonResponse.json();
  const features: TrainExitFeature[] = Array.isArray(geoJson?.features) ? geoJson.features : [];

  const exitsByStationName = features.reduce<Record<string, Set<string>>>((result, feature) => {
    const stationName = feature.properties?.STATION_NA;
    const exitCode = feature.properties?.EXIT_CODE;
    if (!stationName || !exitCode) return result;

    const normalizedName = normalizeStationName(stationName);
    result[normalizedName] = result[normalizedName] || new Set<string>();
    result[normalizedName].add(exitCode.trim());
    return result;
  }, {});

  const exitsByStationId = stations.reduce<Record<string, string[]>>((result, station: TrainStation) => {
    const exits = Array.from(exitsByStationName[normalizeStationName(station.name)] || []);
    result[station.id] = exits.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    return result;
  }, {});

  await AsyncStorage.setItem(TRAIN_EXITS_CACHE_KEY, JSON.stringify(exitsByStationId));
  await AsyncStorage.setItem(TRAIN_EXITS_CACHE_TIME_KEY, String(now));

  return exitsByStationId;
};
