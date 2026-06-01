import { Image, StyleSheet, Text, View } from 'react-native';

import { getArrivalMinutes, getBusTypeLabel, getLoadColor } from '@/data/busArrivals';

const wheelchairSymbol = require('@/assets/images/wheelchair-symbol.png');

export type NextBusArrival = {
  EstimatedArrival?: string;
  Load?: string;
  Feature?: string;
  Type?: string;
};

type BusArrivalCardsProps = {
  arrivals: (NextBusArrival | undefined)[];
  arrivalBg: string;
  subTextColor: string;
};

export function BusArrivalCards({
  arrivals,
  arrivalBg,
  subTextColor,
}: BusArrivalCardsProps) {
  return (
    <View style={styles.arrivalContainer}>
      {arrivals.map((nextBus, index) => (
        <View
          key={index}
          style={[
            styles.arrivalCard,
            {
              backgroundColor: arrivalBg,
              borderColor: getLoadColor(nextBus?.Load),
            },
          ]}
        >
          <Text style={[styles.arrivalTime, { color: getLoadColor(nextBus?.Load) }]}>
            {getArrivalMinutes(nextBus?.EstimatedArrival)}
          </Text>

          <View style={styles.arrivalBottom}>
            {nextBus?.Feature === 'WAB' && (
              <Image
                source={wheelchairSymbol}
                style={styles.busFeatureIcon}
                accessibilityLabel="Wheelchair accessible bus"
              />
            )}

            <Text style={[styles.busType, { color: subTextColor }]}>
              {getBusTypeLabel(nextBus?.Type)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  arrivalContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  arrivalCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    minHeight: 60,
  },
  arrivalTime: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  arrivalBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
  },
  busType: {
    fontSize: 11,
  },
  busFeatureIcon: {
    width: 14,
    height: 14,
  },
});
