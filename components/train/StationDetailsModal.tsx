import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  formatDistance,
  getCodeLine,
  getFacilitiesText,
  lineColors,
  type TrainStation,
} from '@/data/train';
import type { BusStop, TrainColors } from './types';

type StationDetailsModalProps = {
  colors: TrainColors;
  exits: string[];
  exitText: string;
  nearbyBusStops: BusStop[];
  onClose: () => void;
  onOpenBusStop: (stop: BusStop) => void;
  station: TrainStation | null;
};

export function StationDetailsModal({
  colors,
  exits,
  exitText,
  nearbyBusStops,
  onClose,
  onOpenBusStop,
  station,
}: StationDetailsModalProps) {
  return (
    <Modal visible={station !== null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.infoModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable style={styles.modalCloseButton} onPress={onClose}>
            <Ionicons name="close" size={26} color="#ff3366" />
          </Pressable>

          {station && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.infoModalScrollContent}
            >
              <Text style={[styles.modalStationName, { color: colors.text }]}>
                {station.name}
              </Text>
              <Text style={[styles.modalStationArea, { color: colors.subText }]}>
                {station.area}
              </Text>

              <View style={styles.modalCodeRow}>
                {station.codes.map((code) => (
                  <Text
                    key={code}
                    style={[
                      styles.stationCode,
                      { color: lineColors[getCodeLine(code)], borderColor: lineColors[getCodeLine(code)] },
                    ]}
                  >
                    {code}
                  </Text>
                ))}
              </View>

              <View style={[styles.modalSection, { borderTopColor: colors.border }]}>
                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Facilities</Text>
                <Text style={[styles.modalText, { color: colors.subText }]}>
                  {getFacilitiesText(station)}
                </Text>
              </View>

              <View style={[styles.modalSection, { borderTopColor: colors.border }]}>
                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Connected Lines</Text>
                <View style={styles.connectedLineRow}>
                  {station.lines.map((line) => (
                    <Text
                      key={line}
                      style={[
                        styles.connectedLineBadge,
                        { color: lineColors[line], borderColor: lineColors[line] },
                      ]}
                    >
                      {line}
                    </Text>
                  ))}
                </View>
              </View>

              <View style={[styles.modalSection, { borderTopColor: colors.border }]}>
                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Exits</Text>
                <Text style={[styles.modalText, { color: colors.subText }]}>{exitText}</Text>
                {exits.length > 0 && (
                  <View style={styles.exitChipRow}>
                    {exits.map((exit) => (
                      <Text key={exit} style={[styles.exitChip, { color: colors.text, borderColor: colors.border }]}>
                        {exit}
                      </Text>
                    ))}
                  </View>
                )}
              </View>

              <View style={[styles.modalSection, { borderTopColor: colors.border }]}>
                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Nearest Bus Stops</Text>
                {nearbyBusStops.map((stop) => (
                  <Pressable
                    key={stop.busStopCode}
                    style={styles.modalBusRow}
                    onPress={() => onOpenBusStop(stop)}
                  >
                    <Ionicons name="bus-outline" size={17} color="#ff3366" />
                    <View style={styles.modalBusInfo}>
                      <Text style={[styles.modalBusName, { color: colors.text }]}>
                        {stop.description}
                      </Text>
                      <Text style={[styles.modalBusMeta, { color: colors.subText }]}>
                        {formatDistance(stop.distance)} | {stop.busStopCode} | {stop.roadName}
                      </Text>
                    </View>
                  </Pressable>
                ))}
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
  infoModal: {
    maxHeight: '86%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
  },
  infoModalScrollContent: {
    paddingBottom: 8,
  },
  modalCloseButton: {
    position: 'absolute',
    right: 14,
    top: 14,
    zIndex: 10,
  },
  modalStationName: {
    fontSize: 30,
    fontWeight: '900',
    paddingRight: 36,
  },
  modalStationArea: {
    fontSize: 15,
    marginTop: 6,
  },
  modalCodeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  stationCode: {
    fontSize: 12,
    fontWeight: 'bold',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modalSection: {
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 14,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 6,
  },
  modalText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  connectedLineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  connectedLineBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  exitChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  exitChip: {
    fontSize: 12,
    fontWeight: '800',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modalBusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 10,
  },
  modalBusInfo: {
    flex: 1,
  },
  modalBusName: {
    fontSize: 13,
    fontWeight: '800',
  },
  modalBusMeta: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
});
