import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useApp } from '../context/AppContext';

interface ScannedMed {
  name: string;
  dosage: string;
  doctor: string;
}

const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'As needed', 'Other'];

export default function AddMedicationScreen({ navigation, route }: any) {
  const { addMedication } = useApp();

  // Scanned medications from ScannerScreen
  const [scannedMeds, setScannedMeds] = useState<ScannedMed[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Manual form fields
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  const [doctor, setDoctor] = useState('');
  const [reason, setReason] = useState('');
  const [refillDate, setRefillDate] = useState('');

  // Receive scanned medications from ScannerScreen
  useEffect(() => {
    if (route.params?.scannedMedications) {
      setScannedMeds(route.params.scannedMedications);
      // Clear the param so it doesn't re-trigger
      navigation.setParams({ scannedMedications: undefined });
    }
  }, [route.params?.scannedMedications]);

  const handleScanBottles = () => {
    navigation.navigate('Scanner');
  };

  const handleAddAllScanned = () => {
    let addedCount = 0;
    for (const med of scannedMeds) {
      if (med.name || med.dosage) {
        addMedication({
          name: (med.name || '').trim(),
          dosage: (med.dosage || '').trim(),
          frequency: 'Once daily',
          doctor: (med.doctor || '').trim(),
          reason: '',
          refillDate: null,
        });
        addedCount++;
      }
    }

    if (addedCount > 0) {
      setScannedMeds([]);
      Alert.alert(
        'Added!',
        `${addedCount} medication${addedCount > 1 ? 's' : ''} added to your list.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  const handleRemoveScanned = (index: number) => {
    setScannedMeds((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditScanned = (index: number, field: keyof ScannedMed, value: string) => {
    setScannedMeds((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleManualAdd = () => {
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
      {/* Scan Bottles Button */}
      <TouchableOpacity style={styles.scanBottlesBtn} onPress={handleScanBottles}>
        <Text style={styles.scanBottlesIcon}>📷</Text>
        <View>
          <Text style={styles.scanBottlesTitle}>Scan Bottles</Text>
          <Text style={styles.scanBottlesSubtitle}>
            Point your camera at pill bottles for live scanning
          </Text>
        </View>
      </TouchableOpacity>

      {/* Scanned Medications Review */}
      {scannedMeds.length > 0 && (
        <View style={styles.scannedSection}>
          <Text style={styles.scannedTitle}>
            Scanned Medications ({scannedMeds.length})
          </Text>
          <Text style={styles.scannedSubtitle}>
            Tap to edit, then add all when ready
          </Text>

          {scannedMeds.map((med, index) => (
            <View key={`scanned-${index}`} style={styles.scannedCard}>
              {editingIndex === index ? (
                // Editing mode
                <View style={styles.editFields}>
                  <TextInput
                    style={styles.editInput}
                    value={med.name}
                    onChangeText={(v) => handleEditScanned(index, 'name', v)}
                    placeholder="Medication name"
                    autoCapitalize="words"
                  />
                  <TextInput
                    style={styles.editInput}
                    value={med.dosage}
                    onChangeText={(v) => handleEditScanned(index, 'dosage', v)}
                    placeholder="Dosage (e.g., 10mg)"
                  />
                  <TextInput
                    style={styles.editInput}
                    value={med.doctor}
                    onChangeText={(v) => handleEditScanned(index, 'doctor', v)}
                    placeholder="Doctor name"
                    autoCapitalize="words"
                  />
                  <TouchableOpacity
                    style={styles.editDoneBtn}
                    onPress={() => setEditingIndex(null)}
                  >
                    <Text style={styles.editDoneBtnText}>Done Editing</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Display mode
                <TouchableOpacity
                  style={styles.scannedCardContent}
                  onPress={() => setEditingIndex(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.scannedInfo}>
                    <Text style={styles.scannedName}>
                      {med.name || 'Unknown'}{med.dosage ? ` ${med.dosage}` : ''}
                    </Text>
                    {med.doctor ? (
                      <Text style={styles.scannedDoctor}>{med.doctor}</Text>
                    ) : (
                      <Text style={styles.scannedNoDoctor}>Tap to add doctor info</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.removeScannedBtn}
                    onPress={() => handleRemoveScanned(index)}
                  >
                    <Text style={styles.removeScannedText}>x</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* Scan more + Add all buttons */}
          <View style={styles.scannedActions}>
            <TouchableOpacity style={styles.scanMoreBtn} onPress={handleScanBottles}>
              <Text style={styles.scanMoreText}>Scan More</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addAllBtn} onPress={handleAddAllScanned}>
              <Text style={styles.addAllBtnText}>
                Add {scannedMeds.length} Medication{scannedMeds.length > 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or add manually</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Manual Form */}
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

        <TouchableOpacity style={styles.addBtn} onPress={handleManualAdd}>
          <Text style={styles.addBtnText}>Add Medication</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  content: { padding: 16 },

  // Scan Bottles button
  scanBottlesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    padding: 18,
    borderRadius: 12,
    marginBottom: 16,
    gap: 14,
  },
  scanBottlesIcon: { fontSize: 28 },
  scanBottlesTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  scanBottlesSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 2,
  },

  // Scanned medications review section
  scannedSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#48bb78',
  },
  scannedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 2,
  },
  scannedSubtitle: {
    fontSize: 13,
    color: '#718096',
    marginBottom: 12,
  },
  scannedCard: {
    backgroundColor: '#f7fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
    overflow: 'hidden',
  },
  scannedCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  scannedInfo: { flex: 1 },
  scannedName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3748',
  },
  scannedDoctor: {
    fontSize: 13,
    color: '#718096',
    marginTop: 2,
  },
  scannedNoDoctor: {
    fontSize: 12,
    color: '#a0aec0',
    fontStyle: 'italic',
    marginTop: 2,
  },
  removeScannedBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fed7d7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeScannedText: { color: '#e53e3e', fontSize: 16, fontWeight: '600' },

  // Edit mode
  editFields: { padding: 12, gap: 8 },
  editInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  editDoneBtn: {
    backgroundColor: '#667eea',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  editDoneBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  // Scanned action buttons
  scannedActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  scanMoreBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#667eea',
    alignItems: 'center',
  },
  scanMoreText: { color: '#667eea', fontSize: 14, fontWeight: '600' },
  addAllBtn: {
    flex: 2,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#48bb78',
    alignItems: 'center',
  },
  addAllBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    fontSize: 13,
    color: '#a0aec0',
  },

  // Manual form
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
