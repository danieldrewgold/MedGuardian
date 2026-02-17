import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Medication, Interaction, AllergyConflict } from '../types';

interface Props {
  medication: Medication;
  interactions: Interaction[];
  allergyConflicts: AllergyConflict[];
  onDelete: (id: number) => void;
  onPress?: () => void;
}

export default function MedicationCard({ medication, interactions, allergyConflicts, onDelete, onPress }: Props) {
  const allergyConflict = allergyConflicts.find((c) => c.medication === medication.name);
  const hasInteraction = interactions.some(
    (i) => i.med1 === medication.name || i.med2 === medication.name
  );
  const criticalInteraction = interactions.find(
    (i) => (i.med1 === medication.name || i.med2 === medication.name) && i.severity === 'major'
  );

  const cardStyle = allergyConflict || criticalInteraction
    ? styles.critical
    : hasInteraction
    ? styles.warning
    : styles.normal;

  const handleDelete = () => {
    Alert.alert('Remove Medication', `Remove ${medication.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onDelete(medication.id) },
    ]);
  };

  const daysUntilRefill = medication.refillDate
    ? Math.ceil((new Date(medication.refillDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <TouchableOpacity style={[styles.card, cardStyle]} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{medication.name}</Text>
          <Text style={styles.dosage}>
            {medication.dosage} - {medication.frequency}
          </Text>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Remove</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        {medication.doctor ? <Text style={styles.infoRow}>Dr. {medication.doctor}</Text> : null}
        {medication.reason ? (
          <View style={styles.reasonRow}>
            <Text style={styles.infoRow}>For: </Text>
            {medication.reason.split(',').map((r, i) => (
              <View key={i} style={styles.reasonChip}>
                <Text style={styles.reasonChipText}>{r.trim()}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {medication.refillDate ? (
          <Text
            style={[
              styles.infoRow,
              daysUntilRefill !== null && daysUntilRefill < 0 && styles.overdue,
              daysUntilRefill !== null && daysUntilRefill >= 0 && daysUntilRefill <= 7 && styles.upcoming,
            ]}
          >
            Refill: {new Date(medication.refillDate).toLocaleDateString()}
            {daysUntilRefill !== null && daysUntilRefill < 0
              ? ` (${Math.abs(daysUntilRefill)} days overdue!)`
              : daysUntilRefill !== null && daysUntilRefill <= 7
              ? ` (in ${daysUntilRefill} days)`
              : ''}
          </Text>
        ) : null}
        <Text style={styles.dateAdded}>Added {new Date(medication.addedDate).toLocaleDateString()}</Text>
      </View>

      {allergyConflict ? (
        <View style={[styles.badge, styles.criticalBadge]}>
          <Text style={styles.badgeText}>ALLERGY NOTED - See Details Above</Text>
        </View>
      ) : criticalInteraction ? (
        <View style={[styles.badge, styles.criticalBadge]}>
          <Text style={styles.badgeText}>Interaction Info Available</Text>
        </View>
      ) : hasInteraction ? (
        <View style={[styles.badge, styles.warningBadge]}>
          <Text style={styles.badgeText}>Interaction Info</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
  },
  normal: { backgroundColor: '#fff', borderColor: '#e2e8f0' },
  warning: { backgroundColor: '#fff5f5', borderColor: '#fc8181' },
  critical: { backgroundColor: '#fff5f5', borderColor: '#f56565' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  name: { fontSize: 18, fontWeight: '700', color: '#2d3748' },
  dosage: { fontSize: 14, color: '#718096', marginTop: 2 },
  deleteBtn: { backgroundColor: '#fc8181', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  deleteBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  info: {},
  infoRow: { fontSize: 13, color: '#4a5568', lineHeight: 22 },
  overdue: { color: '#c53030', fontWeight: '600' },
  upcoming: { color: '#d69e2e', fontWeight: '600' },
  dateAdded: { fontSize: 12, color: '#a0aec0', marginTop: 4 },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, marginTop: 10, alignSelf: 'flex-start' },
  warningBadge: { backgroundColor: '#fc8181' },
  criticalBadge: { backgroundColor: '#f56565' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  reasonRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginTop: 2 },
  reasonChip: {
    backgroundColor: '#edf2f7',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reasonChipText: { fontSize: 12, color: '#4a5568' },
});
