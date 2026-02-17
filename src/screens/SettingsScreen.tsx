import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useApp } from '../context/AppContext';

export default function SettingsScreen() {
  const { exportData, clearAllData } = useApp();

  const handleExport = async () => {
    const data = exportData();
    try {
      if (Platform.OS !== 'web') {
        const fileName = `medguardian_backup_${new Date().toISOString().split('T')[0]}.json`;
        const file = new File(Paths.cache, fileName);
        file.write(data);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(file.uri, { mimeType: 'application/json' });
        } else {
          await Share.share({ message: data });
        }
      } else {
        await Share.share({ message: data });
      }
    } catch (e) {
      await Share.share({ message: data });
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete ALL patients and medications. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Are you sure?', 'Really delete all data? This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Yes, Delete All',
                style: 'destructive',
                onPress: async () => {
                  await clearAllData();
                  Alert.alert('Done', 'All data has been cleared.');
                },
              },
            ]);
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Data Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>

        <TouchableOpacity style={[styles.btn, styles.exportBtn]} onPress={handleExport}>
          <Text style={styles.btnText}>Export All Data</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.dangerBtn]} onPress={handleClearAll}>
          <Text style={styles.btnText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerTitle}>Medical Disclaimer</Text>
        <Text style={styles.disclaimerText}>
          MedGuardian is an informational tool that displays general medication information from publicly
          available medical databases including RxNorm (NIH) and FDA resources. This app does not provide
          medical advice, diagnosis, or treatment recommendations. It does not replace consultation with
          qualified healthcare providers. All medication decisions should be made in consultation with your
          doctor or pharmacist. By using this app, you acknowledge sole responsibility for all healthcare
          decisions. MedGuardian and its developers assume no liability for medical outcomes.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  content: { padding: 16 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#2d3748', marginBottom: 16 },
  btn: {
    backgroundColor: '#667eea',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  exportBtn: { backgroundColor: '#48bb78' },
  dangerBtn: { backgroundColor: '#fc8181' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  disclaimerBox: {
    backgroundColor: '#f7fafc',
    borderRadius: 8,
    padding: 15,
  },
  disclaimerTitle: { fontWeight: '700', fontSize: 14, color: '#4a5568', marginBottom: 8 },
  disclaimerText: { fontSize: 12, lineHeight: 20, color: '#4a5568' },
});
