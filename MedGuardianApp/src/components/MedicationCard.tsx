import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Medication, MedStatus, Interaction, AllergyConflict } from '../types';
import { getSideEffectsFromDB } from '../services/sideEffects';

const STATUS_CONFIG: Record<MedStatus, { label: string; color: string; bg: string }> = {
  prescribed: { label: 'Prescribed', color: '#667eea', bg: '#eef2ff' },
  sent_to_pharmacy: { label: 'At Pharmacy', color: '#d69e2e', bg: '#fefce8' },
  picked_up: { label: 'Picked Up', color: '#38a169', bg: '#f0fff4' },
  active: { label: 'Active', color: '#0d9488', bg: '#f0fdfa' },
  discontinued: { label: 'Discontinued', color: '#a0aec0', bg: '#f7fafc' },
};

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
  const hasSideEffects = useMemo(() => !!getSideEffectsFromDB(medication.name), [medication.name]);

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

      {medication.status && medication.status !== 'active' && (
        <View style={[styles.statusRow, { backgroundColor: STATUS_CONFIG[medication.status].bg }]}>
          <View style={[styles.statusDot, { backgroundColor: STATUS_CONFIG[medication.status].color }]} />
          <Text style={[styles.statusText, { color: STATUS_CONFIG[medication.status].color }]}>
            {STATUS_CONFIG[medication.status].label}
          </Text>
        </View>
      )}

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

      <View style={styles.badgeRow}>
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
        {hasSideEffects && (
          <View style={[styles.badge, styles.sideEffectBadge]}>
            <Text style={styles.seBadgeText}>Side Effects Info</Text>
          </View>
        )}
      </View>
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  info: {},
  infoRow: { fontSize: 13, color: '#4a5568', lineHeight: 22 },
  overdue: { color: '#c53030', fontWeight: '600' },
  upcoming: { color: '#d69e2e', fontWeight: '600' },
  dateAdded: { fontSize: 12, color: '#a0aec0', marginTop: 4 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, alignSelf: 'flex-start' },
  warningBadge: { backgroundColor: '#fc8181' },
  criticalBadge: { backgroundColor: '#f56565' },
  sideEffectBadge: { backgroundColor: '#eef2ff', borderWidth: 1, borderColor: '#c7d2fe' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  seBadgeText: { color: '#667eea', fontSize: 12, fontWeight: '600' },
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
