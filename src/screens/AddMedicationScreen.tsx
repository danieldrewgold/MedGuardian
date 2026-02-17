import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import { extractMedicationFromImage } from '../services/scanner';

const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'As needed', 'Other'];

export default function AddMedicationScreen({ navigation }: any) {
  const { addMedication } = useApp();

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  const [doctor, setDoctor] = useState('');
  const [reason, setReason] = useState('');
  const [refillDate, setRefillDate] = useState('');
  const [scanning, setScanning] = useState(false);

  const handleScan = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Camera access is required to scan pill bottles. Please enable it in your device settings.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) return;

      setScanning(true);
      const extracted = await extractMedicationFromImage(result.assets[0].uri);

      if (extracted) {
        if (extracted.name) setName(extracted.name);
        if (extracted.dosage) setDosage(extracted.dosage);
        if (extracted.doctor) setDoctor(extracted.doctor);
        Alert.alert('Scanned!', 'Please review and edit the information before adding.');
      }
    } catch (error: any) {
      Alert.alert('Scan Error', error.message || 'Could not scan the bottle.');
    } finally {
      setScanning(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Photo library access is required to select images. Please enable it in your device settings.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) return;

      setScanning(true);
      const extracted = await extractMedicationFromImage(result.assets[0].uri);

      if (extracted) {
        if (extracted.name) setName(extracted.name);
        if (extracted.dosage) setDosage(extracted.dosage);
        if (extracted.doctor) setDoctor(extracted.doctor);
        Alert.alert('Scanned!', 'Please review and edit the information before adding.');
      }
    } catch (error: any) {
      Alert.alert('Scan Error', error.message || 'Could not scan the image.');
    } finally {
      setScanning(false);
    }
  };

  const handleAdd = () => {
    if (!name.trim() || !dosage.trim()) {
      Alert.alert('Required Fields', 'Please enter medication name and dosage.');
      return;
    }

    addMedication({
      name: name.trim(),
      dosage: dosage.trim(),
      frequency,
      doctor: doctor.trim(),
      reason: reason.trim(),
      refillDate: refillDate || null,
    });

    Alert.alert('Added!', `${name} has been added to your medications.`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Scan Buttons */}
      <View style={styles.scanRow}>
        <TouchableOpacity style={styles.scanBtn} onPress={handleScan} disabled={scanning}>
          {scanning ? (
            <ActivityIndicator color="#667eea" />
          ) : (
            <>
              <Text style={styles.scanIcon}>📷</Text>
              <Text style={styles.scanText}>Take Photo</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.scanBtn} onPress={handlePickImage} disabled={scanning}>
          <Text style={styles.scanIcon}>🖼️</Text>
          <Text style={styles.scanText}>From Gallery</Text>
        </TouchableOpacity>
      </View>

      {scanning && (
        <View style={styles.scanningBanner}>
          <ActivityIndicator color="#fff" size="small" />
          <Text style={styles.scanningText}>Analyzing pill bottle...</Text>
        </View>
      )}

      {/* Form */}
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Medication Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Lisinopril"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Dosage *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 10mg"
            value={dosage}
            onChangeText={setDosage}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Frequency</Text>
          <View style={styles.freqRow}>
            {FREQUENCIES.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.freqChip, frequency === f && styles.freqChipActive]}
                onPress={() => setFrequency(f)}
              >
                <Text style={[styles.freqText, frequency === f && styles.freqTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Prescribing Doctor</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Dr. Smith"
            value={doctor}
            onChangeText={setDoctor}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>What is this for? (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., High blood pressure"
            value={reason}
            onChangeText={setReason}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Next Refill Date (optional, YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 2026-03-15"
            value={refillDate}
            onChangeText={setRefillDate}
            keyboardType={Platform.OS === 'ios' ? 'default' : 'default'}
          />
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addBtnText}>Add Medication</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  content: { padding: 16 },
  scanRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  scanBtn: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#cbd5e0',
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
  },
  scanIcon: { fontSize: 24, marginBottom: 4 },
  scanText: { fontSize: 14, color: '#4a5568' },
  scanningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#667eea',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  scanningText: { color: '#fff', fontWeight: '600' },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  field: { marginBottom: 16 },
  label: { fontWeight: '600', fontSize: 14, color: '#4a5568', marginBottom: 6 },
  input: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  freqRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  freqChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  freqChipActive: { backgroundColor: '#667eea', borderColor: '#667eea' },
  freqText: { fontSize: 13, color: '#4a5568' },
  freqTextActive: { color: '#fff', fontWeight: '600' },
  addBtn: {
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
