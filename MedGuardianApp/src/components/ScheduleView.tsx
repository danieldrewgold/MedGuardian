import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Medication } from '../types';

interface Props {
  medications: Medication[];
  onPressMedication?: (medication: Medication) => void;
}

const TIME_SLOTS = [
  { key: 'morning', icon: '🌅', label: 'Morning (8am)', filter: (f: string) => f.includes('once') || f.includes('daily') || f.includes('morning') },
  { key: 'afternoon', icon: '☀️', label: 'Afternoon (2pm)', filter: (f: string) => f.includes('afternoon') },
  { key: 'evening', icon: '🌆', label: 'Evening (6pm)', filter: (f: string) => f.includes('twice') || f.includes('evening') },
  { key: 'bedtime', icon: '🌙', label: 'Bedtime (10pm)', filter: (f: string) => f.includes('bedtime') || f.includes('night') },
  { key: 'asneeded', icon: '💊', label: 'As Needed', filter: (f: string) => f.includes('as needed') },
];

export default function ScheduleView({ medications, onPressMedication }: Props) {
  if (medications.length === 0) return null;

  const slots = TIME_SLOTS.map((slot) => ({
    ...slot,
    meds: medications.filter((m) => slot.filter(m.frequency.toLowerCase())),
  })).filter((slot) => slot.meds.length > 0);

  if (slots.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Daily Medication Schedule</Text>
      {slots.map((slot) => (
        <View key={slot.key} style={styles.slot}>
          <Text style={styles.slotLabel}>
            {slot.icon} {slot.label}
          </Text>
          {slot.meds.map((med) => (
            <TouchableOpacity
              key={med.id}
              onPress={() => onPressMedication?.(med)}
              activeOpacity={onPressMedication ? 0.6 : 1}
            >
              <Text style={styles.medText}>
                • {med.name} - {med.dosage}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  header: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 15,
  },
  slot: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#f7fafc',
    borderRadius: 8,
  },
  slotLabel: {
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 6,
  },
  medText: {
    padding: 4,
    color: '#667eea',
    textDecorationLine: 'underline',
  },
});
