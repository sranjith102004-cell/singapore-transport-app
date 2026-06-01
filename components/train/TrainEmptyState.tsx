import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { LineFilter } from '@/data/train';

import type { TrainColors } from './types';

type TrainEmptyStateProps = {
  colors: TrainColors;
  loadingLocation: boolean;
  locationUnavailable: boolean;
  onClearFilters: () => void;
  searchText: string;
  selectedLine: LineFilter;
  showFavoritesOnly: boolean;
};

export function TrainEmptyState({
  colors,
  loadingLocation,
  locationUnavailable,
  onClearFilters,
  searchText,
  selectedLine,
  showFavoritesOnly,
}: TrainEmptyStateProps) {
  if (loadingLocation) {
    return (
      <View style={styles.emptyState}>
        <ActivityIndicator color="#ff3366" />
        <Text style={[styles.emptyText, { color: colors.subText, marginTop: 12 }]}>
          Finding nearest stations...
        </Text>
      </View>
    );
  }

  const showLocationFallback =
    locationUnavailable && !searchText && selectedLine === 'ALL' && !showFavoritesOnly;

  return (
    <View style={styles.emptyState}>
      {showLocationFallback && (
        <Text style={[styles.emptyText, { color: colors.subText, marginBottom: 12 }]}>
          Location unavailable. Showing stations alphabetically.
        </Text>
      )}
      <Text style={[styles.emptyText, { color: colors.subText }]}>No stations found</Text>
      <Pressable style={styles.clearFiltersButton} onPress={onClearFilters}>
        <Text style={styles.clearFiltersText}>Clear filters</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    marginTop: 30,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
  },
  clearFiltersButton: {
    minHeight: 38,
    marginTop: 14,
    paddingHorizontal: 18,
    borderRadius: 19,
    backgroundColor: '#ff3366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearFiltersText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
});
