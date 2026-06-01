import axios from 'axios';

import { getLtaHeaders } from './lta';

export type LtaNextBus = {
  EstimatedArrival?: string;
  Load?: string;
  Feature?: string;
  Type?: string;
  Latitude?: string;
  Longitude?: string;
};

export type LtaBusArrival = {
  ServiceNo: string;
  NextBus?: LtaNextBus;
  NextBus2?: LtaNextBus;
  NextBus3?: LtaNextBus;
};

export const fetchBusArrivals = async (busStopCode: string): Promise<LtaBusArrival[]> => {
  const response = await axios.get(
    'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival',
    {
      params: { BusStopCode: busStopCode },
      headers: getLtaHeaders(),
    }
  );

  return Array.isArray(response.data?.Services) ? response.data.Services : [];
};

export const getArrivalMinutes = (time?: string) => {
  if (!time) return '-';
  const diff = Math.round((new Date(time).getTime() - Date.now()) / 60000);
  return diff <= 0 ? 'Arr' : `${diff} min`;
};

export const getLoadColor = (load?: string) => {
  if (load === 'SEA') return '#16a34a';
  if (load === 'SDA') return '#f59e0b';
  if (load === 'LSD') return '#dc2626';
  return '#555';
};

export const getBusTypeLabel = (type?: string) => {
  if (type === 'DD') return 'Double';
  if (type === 'BD') return 'Bendy';
  return 'Single';
};
