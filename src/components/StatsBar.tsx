import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';

export default function StatsBar() {
  const { getCurrentPatient, interactions, allergyConflicts } = useApp();
  const patient = getCurrentPatient();
  const totalInteractions = interactions.length + allergyConflicts.length;
  const majorCount = interactions.filter((i) => i.severity === 'major').length + allergyConflicts.length;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.number}>{patient.medications.length}</Text>
        <Text style={styles.label}>Medications</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.number}>{totalInteractions}</Text>
        <Text style={styles.label}>Interactions</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.number}>{majorCount}</Text>
        <Text style={styles.label}>Major</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  number: { fontSize: 24, fontWeight: '700', color: '#667eea' },
  label: { fontSize: 12, color: '#718096', marginTop: 4 },
});
