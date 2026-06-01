import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

type TrainColors = {
  bg: string;
  text: string;
  subText: string;
};

type SystemMapModalProps = {
  colors: TrainColors;
  mapSource: any;
  onClose: () => void;
  visible: boolean;
};

export function SystemMapModal({
  colors,
  mapSource,
  onClose,
  visible,
}: SystemMapModalProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.systemMapModal, { backgroundColor: colors.bg }]}>
        <View style={styles.systemMapHeader}>
          <View>
            <Text style={[styles.systemMapTitle, { color: colors.text }]}>System Map</Text>
            <Text style={[styles.systemMapSubtitle, { color: colors.subText }]}>
              Pinch to zoom and drag to move
            </Text>
          </View>

          <Pressable style={styles.systemMapCloseButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="#ff3366" />
          </Pressable>
        </View>

        <View style={styles.systemMapViewer}>
          <View style={styles.systemMapFrame}>
            <WebView
              originWhitelist={['*']}
              source={mapSource}
              style={styles.systemMapWebView}
              scalesPageToFit
              setBuiltInZoomControls
              setDisplayZoomControls={false}
              startInLoadingState
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  systemMapModal: {
    flex: 1,
    paddingTop: 62,
  },
  systemMapHeader: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  systemMapTitle: {
    fontSize: 34,
    fontWeight: '900',
  },
  systemMapSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  systemMapCloseButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  systemMapViewer: {
    flex: 1,
    marginHorizontal: 12,
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  systemMapFrame: {
    width: '100%',
    maxHeight: '100%',
    aspectRatio: 1,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  systemMapWebView: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
