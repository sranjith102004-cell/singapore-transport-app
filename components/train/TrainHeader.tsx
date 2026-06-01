import { Ionicons } from '@expo/vector-icons';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { lineColors, trainLineFilters, type LineFilter } from '@/data/train';

import type { TrainColors } from './types';

type TrainHeaderProps = {
  colors: TrainColors;
  onClearTrainDetails: () => void;
  onOpenMap: () => void;
  onOpenPlanner: () => void;
  onSearchSubmit: () => void;
  searchText: string;
  selectedLine: LineFilter;
  setSearchText: (text: string) => void;
  setSelectedLine: (line: LineFilter) => void;
  setShowFavoritesOnly: (updater: (current: boolean) => boolean) => void;
  showFavoritesOnly: boolean;
};

export function TrainHeader({
  colors,
  onClearTrainDetails,
  onOpenMap,
  onOpenPlanner,
  onSearchSubmit,
  searchText,
  selectedLine,
  setSearchText,
  setSelectedLine,
  setShowFavoritesOnly,
  showFavoritesOnly,
}: TrainHeaderProps) {
  return (
    <>
      <Text style={[styles.title, { color: colors.text }]}>MRT/LRT</Text>

      <View
        style={[
          styles.searchBox,
          {
            backgroundColor: colors.input,
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons name="search" size={22} color={colors.muted} />
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search station, line, or code"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          onSubmitEditing={onSearchSubmit}
          style={[styles.searchInput, { color: colors.text }]}
        />
        {searchText.length > 0 && (
          <Pressable style={styles.clearButton} onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={22} color={colors.muted} />
          </Pressable>
        )}
      </View>

      <View style={styles.quickActions}>
        <Pressable
          style={[
            styles.actionButton,
            { borderColor: colors.border },
            showFavoritesOnly && styles.activeActionButton,
          ]}
          onPress={() => setShowFavoritesOnly((current) => !current)}
        >
          <Ionicons name="heart" size={17} color={showFavoritesOnly ? '#fff' : '#ff3366'} />
          <Text style={[styles.actionText, { color: showFavoritesOnly ? '#fff' : colors.subText }]}>
            Favorites
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.actionButton,
            { borderColor: colors.border },
          ]}
          onPress={onOpenMap}
        >
          <Ionicons name="map" size={17} color="#ff3366" />
          <Text style={[styles.actionText, { color: colors.subText }]}>Map</Text>
        </Pressable>

        <Pressable
          style={[
            styles.actionButton,
            { borderColor: colors.border },
          ]}
          onPress={onOpenPlanner}
        >
          <Ionicons name="navigate" size={17} color="#ff3366" />
          <Text style={[styles.actionText, { color: colors.subText }]}>Plan Trip</Text>
        </Pressable>
      </View>

      <View style={styles.lineFilterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.lineFilterContent}
        >
          {trainLineFilters.map((line) => {
            const isSelected = selectedLine === line;

            return (
              <Pressable
                key={line}
                style={[
                  styles.lineFilter,
                  {
                    borderColor: line === 'ALL' ? colors.border : lineColors[line],
                    backgroundColor: isSelected
                      ? line === 'ALL'
                        ? '#ff3366'
                        : lineColors[line]
                      : colors.card,
                  },
                ]}
                onPress={() => {
                  onClearTrainDetails();
                  setSelectedLine(line);
                  setSearchText('');
                  Keyboard.dismiss();
                }}
              >
                <Text style={[styles.lineFilterText, { color: isSelected ? '#fff' : colors.text }]}>
                  {line}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 18,
  },
  searchBox: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  clearButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  actionButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 19,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeActionButton: {
    backgroundColor: '#ff3366',
    borderColor: '#ff3366',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  lineFilterSection: {
    height: 56,
    marginBottom: 8,
  },
  lineFilterContent: {
    gap: 8,
    alignItems: 'center',
    paddingBottom: 6,
  },
  lineFilter: {
    minHeight: 38,
    minWidth: 58,
    borderRadius: 19,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
  lineFilterText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
