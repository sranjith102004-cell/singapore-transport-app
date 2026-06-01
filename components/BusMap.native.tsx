import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Platform, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import MapView, { Marker, Polyline, type LatLng, type Region } from 'react-native-maps';

type Stop = {
  busStopCode: string;
  roadName: string;
  description: string;
  latitude: number;
  longitude: number;
};

type RoutePoint = Stop & {
  stopSequence: number;
};

type Place = {
  name: string;
  latitude: number;
  longitude: number;
};

type LiveBusMarker = {
  id: string;
  serviceNo: string;
  latitude: number;
  longitude: number;
};

export type BusMapRef = {
  animateToRegion: (region: Region, duration?: number) => void;
  fitToCoordinates: (
    coordinates: LatLng[],
    options?: {
      edgePadding?: { top: number; right: number; bottom: number; left: number };
      animated?: boolean;
    }
  ) => void;
};

type BusMapProps = {
  style?: StyleProp<ViewStyle>;
  location: {
    latitude: number;
    longitude: number;
  };
  searchedPlace: Place | null;
  nearbyStops: Stop[];
  routeStops: RoutePoint[];
  liveBusMarkers: LiveBusMarker[];
  selectedBus: string | null;
};

const BusMap = forwardRef<BusMapRef, BusMapProps>(
  ({ style, location, searchedPlace, nearbyStops, routeStops, liveBusMarkers, selectedBus }, ref) => {
    const mapRef = useRef<MapView>(null);

    useImperativeHandle(ref, () => ({
      animateToRegion: (region, duration) => {
        mapRef.current?.animateToRegion(region, duration);
      },
      fitToCoordinates: (coordinates, options) => {
        mapRef.current?.fitToCoordinates(coordinates, options);
      },
    }));

    return (
      <MapView
        ref={mapRef}
        style={style}
        provider={Platform.OS === 'android' ? 'google' : undefined}
        showsUserLocation
        showsMyLocationButton={false}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {searchedPlace && (
          <Marker
            coordinate={{
              latitude: searchedPlace.latitude,
              longitude: searchedPlace.longitude,
            }}
            title="Searched place"
            description={searchedPlace.name}
            pinColor="#2563eb"
          />
        )}

        {nearbyStops.slice(0, 12).map((stop) => (
          <Marker
            key={stop.busStopCode}
            coordinate={{
              latitude: stop.latitude,
              longitude: stop.longitude,
            }}
            title={stop.description}
            description={stop.busStopCode}
          />
        ))}

        {routeStops.map((stop) => (
          <Marker
            key={`route-${stop.busStopCode}-${stop.stopSequence}`}
            coordinate={{
              latitude: stop.latitude,
              longitude: stop.longitude,
            }}
            title={`${stop.stopSequence}. ${stop.description}`}
            pinColor="#ff3366"
          />
        ))}

        {liveBusMarkers.map((bus) => (
          <Marker
            key={bus.id}
            coordinate={{
              latitude: bus.latitude,
              longitude: bus.longitude,
            }}
            title={`Bus ${bus.serviceNo}`}
            description="Live bus location"
          >
            <View style={styles.liveBusMarker}>
              <Text style={styles.liveBusText}>BUS</Text>
            </View>
          </Marker>
        ))}

        {routeStops.length > 1 && (
          <Polyline
            key={`${selectedBus || 'route'}-${routeStops[0].busStopCode}-${
              routeStops[routeStops.length - 1].busStopCode
            }-${routeStops.length}`}
            coordinates={routeStops.map((stop) => ({
              latitude: stop.latitude,
              longitude: stop.longitude,
            }))}
            strokeColor="red"
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
            geodesic
          />
        )}
      </MapView>
    );
  }
);

BusMap.displayName = 'BusMap';

const styles = StyleSheet.create({
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

export default BusMap;
