import { forwardRef, useImperativeHandle } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

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

const BusMap = forwardRef<BusMapRef, BusMapProps>(
  ({ style, location, searchedPlace, nearbyStops, routeStops, liveBusMarkers, selectedBus }, ref) => {
    useImperativeHandle(ref, () => ({
      animateToRegion: () => {},
      fitToCoordinates: () => {},
    }));

    const focusText = searchedPlace?.name || 'Current location';
    const markerCount = routeStops.length || nearbyStops.length;

    return (
      <View style={[style, styles.fallback]}>
        <View style={styles.headerRow}>
          <Text style={styles.label}>Map preview unavailable on web</Text>
          <Text style={styles.badge}>Web</Text>
        </View>
        <Text style={styles.focusText} numberOfLines={2}>
          {focusText}
        </Text>
        <Text style={styles.metaText}>
          {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{markerCount}</Text>
            <Text style={styles.statLabel}>{routeStops.length ? 'Route stops' : 'Nearby stops'}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{liveBusMarkers.length}</Text>
            <Text style={styles.statLabel}>Live buses</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{selectedBus || '-'}</Text>
            <Text style={styles.statLabel}>Selected</Text>
          </View>
        </View>
      </View>
    );
  }
);

BusMap.displayName = 'BusMap';

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: '#151515',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  badge: {
    color: '#fff',
    backgroundColor: '#ff3366',
    borderRadius: 12,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '900',
  },
  focusText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 12,
  },
  metaText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  stat: {
    flex: 1,
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 10,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
});

export default BusMap;
