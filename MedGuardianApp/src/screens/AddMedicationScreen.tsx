import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useApp } from '../context/AppContext';
import AutocompleteInput from '../components/AutocompleteInput';
import ChipInput from '../components/ChipInput';
import { fetchDrugSuggestions } from '../services/rxnorm';

interface ScannedMed {
  name: string;
  dosage: string;
  doctor: string;
  refillDate?: string;
}

const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'As needed', 'Other'];
const COMMON_DOSAGES = [
  '5mg', '10mg', '20mg', '25mg', '50mg', '100mg', '200mg', '250mg', '500mg', '1000mg',
  '1g', '2.5mg', '5mL', '10mL', '15mL', '1 tablet', '2 tablets', '1 capsule',
];
const COMMON_REASONS = [
  'High blood pressure', 'Diabetes', 'Cholesterol', 'Pain', 'Infection',
  'Depression', 'Anxiety', 'Acid reflux', 'Thyroid', 'Heart failure',
  'Blood thinner', 'Kidney protection', 'Arthritis', 'Asthma', 'Allergies',
  'Seizures', 'Sleep', 'Inflammation',
];

export default function AddMedicationScreen({ navigation, route }: any) {
  const { addMedication, updateMedication, patients, getRecentMeds } = useApp();
  const editMed = route.params?.editMedication as import('../types').Medication | undefined;
  const scrollRef = useRef<ScrollView>(null);

  const allDoctorNames = useMemo(() => {
    const names = new Set<string>();
    Object.values(patients).forEach((patient) => {
      patient.medications.forEach((med) => {
        if (med.doctor?.trim()) names.add(med.doctor.trim());
      });
    });
    return Array.from(names).sort();
  }, [patients]);

  // Recent medications for quick-add
  const recentMeds = useMemo(() => getRecentMeds(), [getRecentMeds]);

  const handleQuickFill = (medName: string) => {
    setName(medName);
    // Scroll down to the form
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
  };

  // Scanned medications from ScannerScreen
  const [scannedMeds, setScannedMeds] = useState<ScannedMed[]>([]);
  const [activeScannedIndex, setActiveScannedIndex] = useState<number | null>(null);

  // Manual form fields — pre-fill when editing
  const [name, setName] = useState(editMed?.name || '');
  const [dosage, setDosage] = useState(editMed?.dosage || '');
  const [frequency, setFrequency] = useState(editMed?.frequency || 'Once daily');
  const [doctor, setDoctor] = useState(editMed?.doctor || '');
  const [reasonChips, setReasonChips] = useState<string[]>(
    editMed?.reason ? editMed.reason.split(',').map((r) => r.trim()).filter(Boolean) : []
  );
  const [refillDate, setRefillDate] = useState(editMed?.refillDate || '');

  // Receive scanned medications from ScannerScreen — auto-fill the first one
  useEffect(() => {
    if (route.params?.scannedMedications) {
      const meds: ScannedMed[] = route.params.scannedMedications;
      setScannedMeds(meds);
      // Auto-select first scanned med into the form
      if (meds.length > 0) {
        const first = meds[0];
        setActiveScannedIndex(0);
        setName(first.name || '');
        setDosage(first.dosage || '');
        setDoctor(first.doctor || '');
        setRefillDate(first.refillDate || '');
        setFrequency('Once daily');
        setReasonChips([]);
      } else {
        setActiveScannedIndex(null);
      }
      // Clear the param so it doesn't re-trigger
      navigation.setParams({ scannedMedications: undefined });
    }
  }, [route.params?.scannedMedications]);

  const handleScanBottles = () => {
    navigation.navigate('Scanner');
  };

  // Load a scanned med into the form for full editing
  const handleSelectScanned = (index: number) => {
    const med = scannedMeds[index];
    setActiveScannedIndex(index);
    setName(med.name || '');
    setDosage(med.dosage || '');
    setDoctor(med.doctor || '');
    setRefillDate(med.refillDate || '');
    setFrequency('Once daily');
    setReasonChips([]);
    // Scroll down to the form
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
  };

  // Deselect scanned med — clear the form
  const handleDeselectScanned = () => {
    setActiveScannedIndex(null);
    setName('');
    setDosage('');
    setDoctor('');
    setRefillDate('');
    setFrequency('Once daily');
    setReasonChips([]);
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
          refillDate: (med.refillDate || '').trim() || null,
        });
        addedCount++;
      }
    }
    if (addedCount > 0) {
      setScannedMeds([]);
      setActiveScannedIndex(null);
      navigation.popToTop();
    }
  };

  const handleRemoveScanned = (index: number) => {
    if (activeScannedIndex === index) {
      handleDeselectScanned();
    } else if (activeScannedIndex !== null && index < activeScannedIndex) {
      setActiveScannedIndex(activeScannedIndex - 1);
    }
    setScannedMeds((prev) => prev.filter((_, i) => i !== index));
  };

  const handleManualAdd = () => {
    if (!name.trim() || !dosage.trim()) {
      Alert.alert('Required Fields', 'Please enter medication name and dosage.');
      return;
    }

    const medData = {
      name: name.trim(),
      dosage: dosage.trim(),
      frequency,
      doctor: doctor.trim(),
      reason: reasonChips.join(', '),
      refillDate: refillDate || null,
    };

    if (editMed) {
      updateMedication(editMed.id, medData);
      navigation.popToTop();
      return;
    }

    addMedication(medData);

    // If we added from a scanned med, remove it from the list and continue
    if (activeScannedIndex !== null) {
      const remaining = scannedMeds.filter((_, i) => i !== activeScannedIndex);
      setScannedMeds(remaining);
      setActiveScannedIndex(null);
      // Clear form
      setName('');
      setDosage('');
      setDoctor('');
      setRefillDate('');
      setFrequency('Once daily');
      setReasonChips([]);
      // Scroll to top to show remaining scanned meds
      if (remaining.length > 0) {
        setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 100);
      } else {
        navigation.popToTop();
      }
    } else {
      navigation.popToTop();
    }
  };

  const isFormFromScan = activeScannedIndex !== null;
  const formTitle = editMed
    ? 'Edit Medication'
    : isFormFromScan
    ? `Editing: ${scannedMeds[activeScannedIndex]?.name || 'Scanned Medication'}`
    : scannedMeds.length > 0
    ? 'Or Add Manually'
    : 'Add Medication';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1 }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Scan Bottles Button — hide when editing existing */}
      {!editMed && (
        <TouchableOpacity style={styles.scanBottlesBtn} onPress={handleScanBottles}>
          <Text style={styles.scanBottlesIcon}>📷</Text>
          <View>
            <Text style={styles.scanBottlesTitle}>Scan Bottles</Text>
            <Text style={styles.scanBottlesSubtitle}>
              Point your camera at pill bottles for live scanning
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Quick Add from Recent — only show when not editing and have recent meds */}
      {!editMed && recentMeds.length > 0 && scannedMeds.length === 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>Recent Medications</Text>
          <Text style={styles.recentSubtitle}>Tap to pre-fill the name</Text>
          <View style={styles.recentChips}>
            {recentMeds.map((medName, idx) => (
              <TouchableOpacity
                key={`recent-${idx}`}
                style={[
                  styles.recentChip,
                  name.toLowerCase() === medName.toLowerCase() && styles.recentChipActive,
                ]}
                onPress={() => handleQuickFill(medName)}
              >
                <Text style={[
                  styles.recentChipText,
                  name.toLowerCase() === medName.toLowerCase() && styles.recentChipTextActive,
                ]}>
                  {medName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Scanned Medications List */}
      {scannedMeds.length > 0 && (
        <View style={styles.scannedSection}>
          <Text style={styles.scannedTitle}>
            Scanned Medications ({scannedMeds.length})
          </Text>
          <Text style={styles.scannedSubtitle}>
            Tap to review & customize before adding
          </Text>

          {scannedMeds.map((med, index) => (
            <TouchableOpacity
              key={`scanned-${index}`}
              style={[
                styles.scannedCard,
                activeScannedIndex === index && styles.scannedCardActive,
              ]}
              onPress={() =>
                activeScannedIndex === index
                  ? handleDeselectScanned()
                  : handleSelectScanned(index)
              }
              activeOpacity={0.7}
            >
              <View style={styles.scannedCardContent}>
                <View style={styles.scannedInfo}>
                  <Text style={[
                    styles.scannedName,
                    activeScannedIndex === index && styles.scannedNameActive,
                  ]}>
                    {med.name || 'Unknown'}{med.dosage ? ` ${med.dosage}` : ''}
                  </Text>
                  {med.doctor ? (
                    <Text style={styles.scannedDoctor}>Dr. {med.doctor}</Text>
                  ) : (
                    <Text style={styles.scannedNoDoctor}>No doctor info</Text>
                  )}
                  {med.refillDate ? (
                    <Text style={styles.scannedDoctor}>Refill: {med.refillDate}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={styles.removeScannedBtn}
                  onPress={() => handleRemoveScanned(index)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.removeScannedText}>x</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}

          {/* Quick actions */}
          <View style={styles.scannedActions}>
            <TouchableOpacity style={styles.scanMoreBtn} onPress={handleScanBottles}>
              <Text style={styles.scanMoreText}>Scan More</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addAllBtn} onPress={handleAddAllScanned}>
              <Text style={styles.addAllBtnText}>
                Quick Add All ({scannedMeds.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Divider — only when scanned meds exist and not editing one */}
      {scannedMeds.length > 0 && !isFormFromScan && (
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or add manually</Text>
          <View style={styles.dividerLine} />
        </View>
      )}

      {/* Form header when editing a scanned med */}
      {isFormFromScan && (
        <View style={styles.formHeader}>
          <Text style={styles.formHeaderTitle}>{formTitle}</Text>
          <Text style={styles.formHeaderSubtitle}>
            Customize frequency, reason, and other details before adding
          </Text>
        </View>
      )}

      {/* Form */}
      <View style={styles.form}>
        {!isFormFromScan && !editMed && scannedMeds.length === 0 && (
          <Text style={styles.formSectionTitle}>Add Medication</Text>
        )}
        {editMed && <Text style={styles.formSectionTitle}>Edit Medication</Text>}

        <View style={[styles.field, { zIndex: 10 }]}>
          <Text style={styles.label}>Medication Name *</Text>
          <AutocompleteInput
            value={name}
            onChangeText={setName}
            placeholder="e.g., Lisinopril"
            fetchSuggestions={fetchDrugSuggestions}
            accentColor="#e2e8f0"
            showSubmitButton={false}
            inputStyle={styles.medNameInput}
          />
        </View>

        <View style={[styles.field, { zIndex: 9 }]}>
          <Text style={styles.label}>Dosage *</Text>
          <AutocompleteInput
            value={dosage}
            onChangeText={setDosage}
            placeholder="e.g., 10mg"
            localSuggestions={COMMON_DOSAGES}
            accentColor="#e2e8f0"
            showSubmitButton={false}
            showAllOnFocus
            inputStyle={styles.input}
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

        <View style={[styles.field, { zIndex: 8 }]}>
          <Text style={styles.label}>Prescribing Doctor</Text>
          <AutocompleteInput
            value={doctor}
            onChangeText={setDoctor}
            placeholder="e.g., Dr. Smith"
            localSuggestions={allDoctorNames}
            accentColor="#e2e8f0"
            showSubmitButton={false}
            inputStyle={styles.input}
          />
        </View>

        <View style={[styles.field, { zIndex: 6 }]}>
          <Text style={styles.label}>What is this for? (optional)</Text>
          <ChipInput
            chips={reasonChips}
            onChipsChange={setReasonChips}
            placeholder="e.g., High blood pressure"
            localSuggestions={COMMON_REASONS}
            accentColor="#e2e8f0"
            inputStyle={styles.input}
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
          <Text style={styles.addBtnText}>
            {editMed
              ? 'Save Changes'
              : isFormFromScan
              ? `Add ${name || 'Medication'}`
              : 'Add Medication'}
          </Text>
        </TouchableOpacity>

        {isFormFromScan && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleDeselectScanned}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  content: { padding: 16, paddingBottom: 40 },

  // Recent medications quick-add
  recentSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 2,
  },
  recentSubtitle: {
    fontSize: 12,
    color: '#a0aec0',
    marginBottom: 10,
  },
  recentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#edf2f7',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  recentChipActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  recentChipText: {
    fontSize: 13,
    color: '#4a5568',
  },
  recentChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

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

  // Scanned medications list
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
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginBottom: 8,
    overflow: 'hidden',
  },
  scannedCardActive: {
    borderColor: '#667eea',
    backgroundColor: '#ebf0ff',
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
  scannedNameActive: {
    color: '#667eea',
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

  // Form header for scanned med editing
  formHeader: {
    marginBottom: 12,
  },
  formHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#667eea',
  },
  formHeaderSubtitle: {
    fontSize: 13,
    color: '#718096',
    marginTop: 2,
  },

  // Form
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 16,
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
    color: '#2d3748',
  },
  medNameInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#2d3748',
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
  cancelBtn: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelBtnText: { color: '#718096', fontSize: 14, fontWeight: '600' },
});
