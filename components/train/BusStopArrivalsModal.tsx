import { Ionicons } from '@expo/vector-icons';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  getArrivalMinutes,
  getBusTypeLabel,
  getLoadColor,
  type LtaBusArrival,
} from '@/data/busArrivals';
import { formatDistance } from '@/data/train';
import type { BusStop, TrainColors } from './types';

type BusStopArrivalsModalProps = {
  arrivals: LtaBusArrival[];
  colors: TrainColors;
  error: string;
  hasLiveBusLocation: (nextBus?: LtaBusArrival['NextBus']) => boolean;
  loading: boolean;
  onClose: () => void;
  onRefresh: (stop: BusStop) => void;
  stop: BusStop | null;
  updatedAt: string;
  wheelchairSymbol: number;
};

export function BusStopArrivalsModal({
  arrivals,
  colors,
  error,
  hasLiveBusLocation,
  loading,
  onClose,
  onRefresh,
  stop,
  updatedAt,
  wheelchairSymbol,
}: BusStopArrivalsModalProps) {
  return (
    <Modal
      visible={stop !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.busStopModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable style={styles.modalCloseButton} onPress={onClose}>
            <Ionicons name="close" size={26} color="#ff3366" />
          </Pressable>

          {stop && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.busStopModalIcon}>
                <Ionicons name="bus-outline" size={26} color="#ff3366" />
              </View>
              <Text style={[styles.busStopModalName, { color: colors.text }]}>
                {stop.description}
              </Text>
              <Text style={[styles.busStopModalMeta, { color: colors.subText }]}>
                {formatDistance(stop.distance)} | {stop.busStopCode}
              </Text>
              <Text style={[styles.busStopModalRoad, { color: colors.subText }]}>
                {stop.roadName}
              </Text>

              <View style={[styles.busStopArrivalSection, { borderTopColor: colors.border }]}>
                <View style={styles.busStopArrivalHeader}>
                  <Text style={[styles.busStopArrivalTitle, { color: colors.text }]}>Bus Arrivals</Text>
                  <Pressable style={styles.busStopRefreshButton} onPress={() => onRefresh(stop)}>
                    <Ionicons name="refresh" size={20} color="#ff3366" />
                  </Pressable>
                </View>
                {updatedAt.length > 0 && (
                  <Text style={[styles.busStopUpdatedText, { color: colors.subText }]}>
                    Updated: {updatedAt}
                  </Text>
                )}
                {error.length > 0 && <Text style={styles.busStopArrivalErrorText}>{error}</Text>}
                {loading ? (
                  <Text style={[styles.busStopArrivalMessage, { color: colors.subText }]}>
                    Loading arrivals...
                  </Text>
                ) : arrivals.length === 0 ? (
                  <Text style={[styles.busStopArrivalMessage, { color: colors.subText }]}>
                    No arrival timing available
                  </Text>
                ) : (
                  arrivals.map((bus) => (
                    <View key={bus.ServiceNo} style={[styles.busArrivalRow, { borderColor: colors.border }]}>
                      <Text style={[styles.busArrivalNumber, { color: colors.text }]}>
                        Bus {bus.ServiceNo}
                      </Text>

                      <View style={styles.busArrivalCards}>
                        {[bus.NextBus, bus.NextBus2, bus.NextBus3].map((nextBus, index) => (
                          <View
                            key={index}
                            style={[
                              styles.busArrivalCard,
                              {
                                backgroundColor: colors.input,
                                borderColor: getLoadColor(nextBus?.Load),
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.busArrivalTime,
                                { color: getLoadColor(nextBus?.Load) },
                              ]}
                            >
                              {getArrivalMinutes(nextBus?.EstimatedArrival)}
                            </Text>
                            <View style={styles.busArrivalMetaRow}>
                              {nextBus?.Feature === 'WAB' && (
                                <Image
                                  source={wheelchairSymbol}
                                  style={styles.busArrivalFeatureIcon}
                                  accessibilityLabel="Wheelchair accessible bus"
                                />
                              )}
                              {hasLiveBusLocation(nextBus) && (
                                <Ionicons name="navigate" size={11} color="#ff3366" />
                              )}
                              <Text style={[styles.busArrivalType, { color: colors.subText }]}>
                                {getBusTypeLabel(nextBus?.Type)}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCloseButton: {
    position: 'absolute',
    right: 14,
    top: 14,
    zIndex: 10,
  },
  busStopModal: {
    maxHeight: '82%',
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
  },
  busStopModalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,51,102,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  busStopModalName: {
    fontSize: 22,
    fontWeight: '900',
    paddingRight: 34,
  },
  busStopModalMeta: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
  },
  busStopModalRoad: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  busStopArrivalSection: {
    borderTopWidth: 1,
    marginTop: 18,
    paddingTop: 16,
  },
  busStopArrivalHeader: {
    minHeight: 32,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  busStopArrivalTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  busStopRefreshButton: {
    width: 40,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  busStopUpdatedText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: -4,
    marginBottom: 10,
  },
  busStopArrivalErrorText: {
    color: '#ff3366',
    fontSize: 12,
    fontWeight: '700',
    marginTop: -4,
    marginBottom: 10,
  },
  busStopArrivalMessage: {
    fontSize: 13,
    fontWeight: '600',
  },
  busArrivalRow: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  busArrivalNumber: {
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 8,
  },
  busArrivalCards: {
    flexDirection: 'row',
    gap: 8,
  },
  busArrivalCard: {
    flex: 1,
    alignItems: 'center',
    minHeight: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  busArrivalTime: {
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  busArrivalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  busArrivalType: {
    fontSize: 10,
    fontWeight: '700',
  },
  busArrivalFeatureIcon: {
    width: 13,
    height: 13,
  },
});
