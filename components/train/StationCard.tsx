import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  formatDistance,
  getCodeLine,
  getStationDirections,
  getTrainTiming,
  lineColors,
  type TrainStation,
} from '@/data/train';
import type { BusStop, TrainColors } from './types';

type VisibleTrainStation = TrainStation & {
  distance: number | null;
};

type StationCardProps = {
  colors: TrainColors;
  favorite: boolean;
  nearbyBusStops: BusStop[];
  onOpenBusStop: (stop: BusStop) => void;
  onOpenStationDetails: (station: TrainStation) => void;
  onToggle: (stationId: string) => void;
  onToggleFavorite: (stationId: string) => void;
  opened: boolean;
  station: VisibleTrainStation;
};

export function StationCard({
  colors,
  favorite,
  nearbyBusStops,
  onOpenBusStop,
  onOpenStationDetails,
  onToggle,
  onToggleFavorite,
  opened,
  station,
}: StationCardProps) {
  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
      onPress={() => onToggle(station.id)}
    >
      <View style={styles.stationHeader}>
        <View style={styles.distanceBox}>
          <Ionicons name="train-outline" size={22} color="#ff3366" />
          <Text style={[styles.distanceText, { color: colors.subText }]}>
            {station.distance === null ? '-' : formatDistance(station.distance)}
          </Text>
        </View>

        <View style={styles.stationInfo}>
          <Text style={[styles.stationName, { color: colors.text }]}>{station.name}</Text>
          <Text style={[styles.stationArea, { color: colors.subText }]}>{station.area}</Text>

          <View style={styles.codeRow}>
            {station.codes.map((code) => (
              <Text
                key={code}
                style={[
                  styles.stationCode,
                  {
                    color: lineColors[getCodeLine(code)],
                    borderColor: lineColors[getCodeLine(code)],
                  },
                ]}
              >
                {code}
              </Text>
            ))}
          </View>
        </View>

        <Pressable
          style={styles.favoriteButton}
          onPress={(event) => {
            event.stopPropagation();
            onToggleFavorite(station.id);
          }}
        >
          <Ionicons
            name={favorite ? 'heart' : 'heart-outline'}
            size={30}
            color={favorite ? '#ff3366' : '#888'}
          />
        </Pressable>
      </View>

      {opened && (
        <View style={[styles.expandedArea, { borderTopColor: colors.border }]}>
          {getStationDirections(station).map((direction) => {
            const timing = getTrainTiming(station, direction);

            return (
              <View key={`${direction.line}-${direction.destination}`} style={styles.directionBlock}>
                <View style={styles.directionHeader}>
                  <Text
                    style={[
                      styles.stationCode,
                      styles.directionCode,
                      {
                        color: lineColors[direction.line],
                        borderColor: lineColors[direction.line],
                      },
                    ]}
                  >
                    {station.codes.find((code) => getCodeLine(code) === direction.line) ||
                      station.codes[0]}
                  </Text>

                  <View
                    style={[
                      styles.directionPill,
                      {
                        backgroundColor: colors.input,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={[styles.directionText, { color: colors.text }]}
                    >
                      {station.name} {'->'} {direction.destination}
                    </Text>
                  </View>

                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation();
                      onOpenStationDetails(station);
                    }}
                  >
                    <Ionicons name="information-circle-outline" size={22} color="#ff3366" />
                  </Pressable>
                </View>

                <View style={styles.timingHeader}>
                  <Text style={[styles.timingHeaderText, { color: colors.subText }]}>Day</Text>
                  <Text style={[styles.timingHeaderText, { color: colors.subText }]}>
                    First Train
                  </Text>
                  <Text style={[styles.timingHeaderText, { color: colors.subText }]}>
                    Last Train
                  </Text>
                </View>

                <View style={styles.timingRow}>
                  <Text style={[styles.timingText, { color: colors.text }]}>Weekday</Text>
                  <Text style={[styles.timingText, { color: colors.text }]}>
                    {timing.weekdayFirst}
                  </Text>
                  <Text style={[styles.timingText, { color: colors.text }]}>
                    {timing.weekdayLast}
                  </Text>
                </View>
                <View style={styles.timingRow}>
                  <Text style={[styles.timingText, { color: colors.text }]}>Weekends/PH</Text>
                  <Text style={[styles.timingText, { color: colors.text }]}>
                    {timing.weekendFirst}
                  </Text>
                  <Text style={[styles.timingText, { color: colors.text }]}>
                    {timing.weekendLast}
                  </Text>
                </View>

                <View style={[styles.directionDivider, { backgroundColor: colors.border }]} />
              </View>
            );
          })}

          <Text style={[styles.nearbyTitle, { color: colors.text }]}>Nearby Bus Stops</Text>
          {nearbyBusStops.length === 0 ? (
            <Text style={[styles.nearbyEmpty, { color: colors.subText }]}>
              Open Nearby once to cache bus stops
            </Text>
          ) : (
            nearbyBusStops.map((stop) => (
              <Pressable
                key={stop.busStopCode}
                style={styles.nearbyBusRow}
                onPress={(event) => {
                  event.stopPropagation();
                  onOpenBusStop(stop);
                }}
              >
                <Ionicons name="bus-outline" size={17} color="#ff3366" />
                <View style={styles.nearbyBusInfo}>
                  <Text style={[styles.nearbyBusName, { color: colors.text }]}>
                    {stop.description}
                  </Text>
                  <Text style={[styles.nearbyBusMeta, { color: colors.subText }]}>
                    {formatDistance(stop.distance)} | {stop.busStopCode} | {stop.roadName}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  stationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  distanceBox: {
    width: 56,
    alignItems: 'center',
    paddingTop: 6,
  },
  distanceText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  stationArea: {
    marginTop: 4,
    fontSize: 14,
  },
  codeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 10,
  },
  stationCode: {
    fontSize: 12,
    fontWeight: 'bold',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  favoriteButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedArea: {
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 14,
  },
  directionBlock: {
    paddingBottom: 12,
  },
  directionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  directionCode: {
    minWidth: 38,
    textAlign: 'center',
  },
  directionPill: {
    flex: 1,
    minHeight: 36,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  directionText: {
    width: '100%',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  timingHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timingHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  timingRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timingText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  directionDivider: {
    height: 1,
    marginTop: 8,
    marginBottom: 14,
  },
  nearbyTitle: {
    fontSize: 17,
    fontWeight: '900',
    marginTop: 0,
    marginBottom: 12,
  },
  nearbyEmpty: {
    fontSize: 12,
    fontWeight: '600',
  },
  nearbyBusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginBottom: 10,
  },
  nearbyBusInfo: {
    flex: 1,
  },
  nearbyBusName: {
    fontSize: 13,
    fontWeight: '800',
  },
  nearbyBusMeta: {
    fontSize: 12,
    marginTop: 2,
  },
});
