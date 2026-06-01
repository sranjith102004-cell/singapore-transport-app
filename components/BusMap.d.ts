import { ForwardRefExoticComponent, RefAttributes } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

type Coordinate = {
  latitude: number;
  longitude: number;
};

type Stop = Coordinate & {
  busStopCode: string;
  roadName: string;
  description: string;
};

type RoutePoint = Stop & {
  stopSequence: number;
};

type Place = Coordinate & {
  name: string;
};

type LiveBusMarker = Coordinate & {
  id: string;
  serviceNo: string;
};

export type BusMapRef = {
  animateToRegion: (
    region: Coordinate & {
      latitudeDelta: number;
      longitudeDelta: number;
    },
    duration?: number
  ) => void;
  fitToCoordinates: (
    coordinates: Coordinate[],
    options?: {
      edgePadding?: { top: number; right: number; bottom: number; left: number };
      animated?: boolean;
    }
  ) => void;
};

type BusMapProps = {
  style?: StyleProp<ViewStyle>;
  location: Coordinate;
  searchedPlace: Place | null;
  nearbyStops: Stop[];
  routeStops: RoutePoint[];
  liveBusMarkers: LiveBusMarker[];
  selectedBus: string | null;
};

declare const BusMap: ForwardRefExoticComponent<BusMapProps & RefAttributes<BusMapRef>>;

export default BusMap;
