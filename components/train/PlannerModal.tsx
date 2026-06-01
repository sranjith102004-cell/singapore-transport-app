import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatFare, type TrainTripPlan } from '@/data/trainPlanner';
import { lineColors, type TrainStation } from '@/data/train';
import { stations } from '@/data/trainStations';
import type { RecentTrainTrip, TrainColors } from './types';

type PlannerModalProps = {
  colors: TrainColors;
  fromQuery: string;
  fromSuggestions: TrainStation[];
  noRoute: boolean;
  onClearFrom: () => void;
  onClearRecentTrips: () => void;
  onClearTo: () => void;
  onClose: () => void;
  onFromQueryChange: (text: string) => void;
  onRemoveRecentTrip: (trip: RecentTrainTrip) => void;
  onSelectRecentTrip: (trip: RecentTrainTrip) => void;
  onSelectStation: (station: TrainStation, field: 'from' | 'to') => void;
  onSwapStations: () => void;
  onToQueryChange: (text: string) => void;
  recentTrips: RecentTrainTrip[];
  result: TrainTripPlan | null;
  toQuery: string;
  toSuggestions: TrainStation[];
  visible: boolean;
};

export function PlannerModal({
  colors,
  fromQuery,
  fromSuggestions,
  noRoute,
  onClearFrom,
  onClearRecentTrips,
  onClearTo,
  onClose,
  onFromQueryChange,
  onRemoveRecentTrip,
  onSelectRecentTrip,
  onSelectStation,
  onSwapStations,
  onToQueryChange,
  recentTrips,
  result,
  toQuery,
  toSuggestions,
  visible,
}: PlannerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.plannerModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable style={styles.modalCloseButton} onPress={onClose}>
            <Ionicons name="close" size={26} color="#ff3366" />
          </Pressable>

          <Text style={[styles.modalStationName, { color: colors.text }]}>Plan Trip</Text>
          <Text style={[styles.modalStationArea, { color: colors.subText }]}>
            Estimate train time and transfers
          </Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.plannerScrollContent}
          >
            {recentTrips.length > 0 && (
              <View style={styles.recentTripsSection}>
                <View style={styles.recentTripsHeader}>
                  <Text style={[styles.plannerLabel, { color: colors.subText }]}>Recent Trips</Text>
                  <Pressable style={styles.clearRecentTripsButton} onPress={onClearRecentTrips}>
                    <Text style={styles.clearRecentTripsText}>Clear all</Text>
                  </Pressable>
                </View>
                <View style={styles.recentTripsRow}>
                  {recentTrips.map((trip) => {
                    const fromStation = stations.find((station) => station.id === trip.fromId);
                    const toStation = stations.find((station) => station.id === trip.toId);
                    if (!fromStation || !toStation) return null;

                    return (
                      <Pressable
                        key={`${trip.fromId}-${trip.toId}`}
                        style={[
                          styles.recentTripButton,
                          { backgroundColor: colors.input, borderColor: colors.border },
                        ]}
                        onPress={() => onSelectRecentTrip(trip)}
                      >
                        <Text style={[styles.recentTripText, { color: colors.text }]} numberOfLines={1}>
                          {fromStation.name} to {toStation.name}
                        </Text>
                        <Pressable
                          style={styles.recentTripClearButton}
                          onPress={(event) => {
                            event.stopPropagation();
                            onRemoveRecentTrip(trip);
                          }}
                        >
                          <Ionicons name="close-circle" size={19} color={colors.muted} />
                        </Pressable>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.plannerField}>
              <Text style={[styles.plannerLabel, { color: colors.subText }]}>From</Text>
              <View style={[styles.plannerInputBox, { backgroundColor: colors.input, borderColor: colors.border }]}>
                <Ionicons name="radio-button-on" size={18} color="#ff3366" />
                <TextInput
                  value={fromQuery}
                  onChangeText={onFromQueryChange}
                  placeholder="Choose origin station"
                  placeholderTextColor={colors.muted}
                  style={[styles.plannerInput, { color: colors.text }]}
                />
                {fromQuery.length > 0 && (
                  <Pressable style={styles.plannerClearButton} onPress={onClearFrom}>
                    <Ionicons name="close-circle" size={20} color={colors.muted} />
                  </Pressable>
                )}
              </View>
              {fromSuggestions.length > 0 && (
                <View style={[styles.plannerSuggestions, { borderColor: colors.border }]}>
                  {fromSuggestions.map((station) => (
                    <Pressable
                      key={station.id}
                      style={styles.plannerSuggestionRow}
                      onPress={() => onSelectStation(station, 'from')}
                    >
                      <Text style={[styles.plannerSuggestionName, { color: colors.text }]}>
                        {station.name}
                      </Text>
                      <Text style={[styles.plannerSuggestionCodes, { color: colors.subText }]}>
                        {station.codes.join(' / ')}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <Pressable style={[styles.swapButton, { borderColor: colors.border }]} onPress={onSwapStations}>
              <Ionicons name="swap-vertical" size={22} color="#ff3366" />
            </Pressable>

            <View style={styles.plannerField}>
              <Text style={[styles.plannerLabel, { color: colors.subText }]}>To</Text>
              <View style={[styles.plannerInputBox, { backgroundColor: colors.input, borderColor: colors.border }]}>
                <Ionicons name="location" size={18} color="#ff3366" />
                <TextInput
                  value={toQuery}
                  onChangeText={onToQueryChange}
                  placeholder="Choose destination station"
                  placeholderTextColor={colors.muted}
                  style={[styles.plannerInput, { color: colors.text }]}
                />
                {toQuery.length > 0 && (
                  <Pressable style={styles.plannerClearButton} onPress={onClearTo}>
                    <Ionicons name="close-circle" size={20} color={colors.muted} />
                  </Pressable>
                )}
              </View>
              {toSuggestions.length > 0 && (
                <View style={[styles.plannerSuggestions, { borderColor: colors.border }]}>
                  {toSuggestions.map((station) => (
                    <Pressable
                      key={station.id}
                      style={styles.plannerSuggestionRow}
                      onPress={() => onSelectStation(station, 'to')}
                    >
                      <Text style={[styles.plannerSuggestionName, { color: colors.text }]}>
                        {station.name}
                      </Text>
                      <Text style={[styles.plannerSuggestionCodes, { color: colors.subText }]}>
                        {station.codes.join(' / ')}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {noRoute && (
              <View style={[styles.plannerResult, { borderTopColor: colors.border }]}>
                <Text style={[styles.plannerSectionTitle, { color: colors.text }]}>No route found</Text>
                <Text style={[styles.modalText, { color: colors.subText }]}>
                  Try a different station pair or check that both stations are selected from the suggestions.
                </Text>
              </View>
            )}

            {result && (
              <View style={[styles.plannerResult, { borderTopColor: colors.border }]}>
                <View style={styles.plannerSummaryRow}>
                  <View style={[styles.plannerSummaryCard, { backgroundColor: colors.input }]}>
                    <Text style={[styles.plannerSummaryValue, { color: colors.text }]}>
                      {result.minutes}
                    </Text>
                    <Text style={[styles.plannerSummaryLabel, { color: colors.subText }]}>min</Text>
                  </View>
                  <View style={[styles.plannerSummaryCard, { backgroundColor: colors.input }]}>
                    <Text style={[styles.plannerSummaryValue, { color: colors.text }]}>
                      {result.stops}
                    </Text>
                    <Text style={[styles.plannerSummaryLabel, { color: colors.subText }]}>stops</Text>
                  </View>
                  <View style={[styles.plannerSummaryCard, { backgroundColor: colors.input }]}>
                    <Text style={[styles.plannerSummaryValue, { color: colors.text }]}>
                      {result.transfers}
                    </Text>
                    <Text style={[styles.plannerSummaryLabel, { color: colors.subText }]}>transfers</Text>
                  </View>
                </View>

                <View style={[styles.fareTable, { borderColor: colors.border }]}>
                  <View style={styles.fareTableHeader}>
                    <Text style={styles.fareTableHeaderText}>Fares</Text>
                  </View>
                  {[
                    ['Adult', result.fares.adult],
                    ['Senior Citizen / PWD #', result.fares.seniorPwd],
                    ['Student', result.fares.student],
                    ['WTCS #', result.fares.wtcs],
                  ].map(([label, fare]) => (
                    <View key={label} style={[styles.fareTableRow, { borderTopColor: colors.border }]}>
                      <Text style={[styles.fareTableLabel, { color: colors.text }]}>{label}</Text>
                      <View style={styles.fareTableValueWrap}>
                        <View style={styles.fareEstimateBadge}>
                          <View style={styles.fareEstimateDot} />
                          <Text style={styles.fareEstimateBadgeText}>Est.</Text>
                        </View>
                        <Text style={[styles.fareTableValue, { color: colors.text }]}>
                          {formatFare(Number(fare))}
                        </Text>
                      </View>
                    </View>
                  ))}
                  <Text style={[styles.fareEstimateMeta, { color: colors.subText }]}>
                    Approx. {result.distanceKm.toFixed(1)} km | all other timings
                  </Text>
                  <Text style={[styles.fareEstimateNote, { color: colors.subText }]}>
                    Estimated fares only. Actual fares may vary by fare rules and travel time.
                  </Text>
                </View>

                <Text style={[styles.plannerSectionTitle, { color: colors.text }]}>Route</Text>
                {result.segments.length === 0 ? (
                  <Text style={[styles.modalText, { color: colors.subText }]}>
                    You are already at the destination.
                  </Text>
                ) : (
                  result.segments.map((segment, index) => (
                    <View key={`${segment.line}-${index}`}>
                      {index > 0 && (
                        <View style={styles.transferRow}>
                          <Ionicons name="walk-outline" size={16} color="#ff3366" />
                          <Text style={[styles.transferText, { color: colors.subText }]}>
                            Transfer at {segment.from.name}
                          </Text>
                        </View>
                      )}

                      <View style={styles.routeSegmentRow}>
                        <Text
                          style={[
                            styles.connectedLineBadge,
                            { color: lineColors[segment.line], borderColor: lineColors[segment.line] },
                          ]}
                        >
                          {segment.line}
                        </Text>
                        <View style={styles.routeSegmentTextWrap}>
                          <Text style={[styles.routeSegmentText, { color: colors.text }]}>
                            Take {segment.line} from {segment.from.name} to {segment.to.name}
                          </Text>
                          <Text style={[styles.routeSegmentMeta, { color: colors.subText }]}>
                            {segment.stops} {segment.stops === 1 ? 'stop' : 'stops'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}

                <Text style={[styles.plannerPathText, { color: colors.subText }]} numberOfLines={3}>
                  {result.path.map((station) => station.name).join(' -> ')}
                </Text>
              </View>
            )}
          </ScrollView>
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
  plannerModal: {
    maxHeight: '88%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
  },
  plannerScrollContent: {
    paddingTop: 18,
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
  modalText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  plannerField: {
    gap: 8,
  },
  plannerLabel: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  recentTripsSection: {
    marginBottom: 16,
    gap: 8,
  },
  recentTripsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearRecentTripsButton: {
    minHeight: 28,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  clearRecentTripsText: {
    color: '#ff3366',
    fontSize: 12,
    fontWeight: '900',
  },
  recentTripsRow: {
    gap: 8,
  },
  recentTripButton: {
    minHeight: 38,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  recentTripText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
  },
  recentTripClearButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plannerInputBox: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  plannerInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
    fontWeight: '700',
  },
  plannerClearButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plannerSuggestions: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  plannerSuggestionRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  plannerSuggestionName: {
    fontSize: 14,
    fontWeight: '800',
  },
  plannerSuggestionCodes: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  swapButton: {
    alignSelf: 'center',
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  plannerResult: {
    borderTopWidth: 1,
    marginTop: 18,
    paddingTop: 16,
  },
  plannerSummaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  plannerSummaryCard: {
    flex: 1,
    minHeight: 72,
    borderRadius: 14,
    padding: 10,
    justifyContent: 'center',
  },
  plannerSummaryValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  plannerSummaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  fareTable: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 10,
  },
  fareTableHeader: {
    minHeight: 38,
    backgroundColor: '#ff3366',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  fareTableHeaderText: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
  fareTableRow: {
    minHeight: 38,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  fareTableLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  fareTableValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    flex: 1,
  },
  fareEstimateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fareEstimateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff3366',
  },
  fareEstimateBadgeText: {
    color: '#ff3366',
    fontSize: 12,
    fontWeight: '900',
  },
  fareTableValue: {
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'right',
  },
  fareEstimateMeta: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: 2,
  },
  fareEstimateNote: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
    paddingHorizontal: 12,
    paddingBottom: 9,
  },
  plannerSectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 18,
    marginBottom: 10,
  },
  routeSegmentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  routeSegmentTextWrap: {
    flex: 1,
  },
  routeSegmentText: {
    fontSize: 14,
    fontWeight: '800',
  },
  routeSegmentMeta: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  transferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    marginLeft: 4,
  },
  transferText: {
    fontSize: 12,
    fontWeight: '800',
  },
  plannerPathText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 8,
  },
  connectedLineBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
