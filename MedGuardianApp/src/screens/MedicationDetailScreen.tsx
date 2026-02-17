import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Medication } from '../types';
import { fetchDrugLabel, DrugLabelInfo } from '../services/openfda';

interface Section {
  title: string;
  key: keyof DrugLabelInfo;
}

const SECTIONS: Section[] = [
  { title: 'Description', key: 'description' },
  { title: 'Indications & Usage', key: 'indicationsAndUsage' },
  { title: 'Dosage & Administration', key: 'dosageAndAdministration' },
  { title: 'Warnings', key: 'warnings' },
  { title: 'Adverse Reactions', key: 'adverseReactions' },
  { title: 'Drug Interactions', key: 'drugInteractions' },
];

export default function MedicationDetailScreen({ route, navigation }: any) {
  const medication: Medication = route.params.medication;
  const [labelInfo, setLabelInfo] = useState<DrugLabelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const info = await fetchDrugLabel(medication.name);
      setLabelInfo(info);
      setLoading(false);
    })();
  }, [medication.name]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const daysUntilRefill = medication.refillDate
    ? Math.ceil((new Date(medication.refillDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const reasons = medication.reason ? medication.reason.split(',').map((r) => r.trim()).filter(Boolean) : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Medication Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.medName}>{medication.name}</Text>
        <Text style={styles.medDosage}>{medication.dosage} - {medication.frequency}</Text>

        {medication.doctor ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Prescribing Doctor</Text>
            <Text style={styles.detailValue}>Dr. {medication.doctor}</Text>
          </View>
        ) : null}

        {reasons.length > 0 ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Prescribed For</Text>
            <View style={styles.reasonChips}>
              {reasons.map((r, i) => (
                <View key={i} style={styles.reasonChip}>
                  <Text style={styles.reasonChipText}>{r}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {medication.refillDate ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Next Refill</Text>
            <Text style={[
              styles.detailValue,
              daysUntilRefill !== null && daysUntilRefill < 0 && { color: '#c53030' },
              daysUntilRefill !== null && daysUntilRefill >= 0 && daysUntilRefill <= 7 && { color: '#d69e2e' },
            ]}>
              {new Date(medication.refillDate).toLocaleDateString()}
              {daysUntilRefill !== null && daysUntilRefill < 0
                ? ` (${Math.abs(daysUntilRefill)} days overdue)`
                : daysUntilRefill !== null && daysUntilRefill <= 7
                ? ` (in ${daysUntilRefill} days)`
                : ''}
            </Text>
          </View>
        ) : null}

        <Text style={styles.addedDate}>
          Added {new Date(medication.addedDate).toLocaleDateString()}
        </Text>

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('AddMedication', { editMedication: medication })}
        >
          <Text style={styles.editBtnText}>Edit Medication</Text>
        </TouchableOpacity>
      </View>

      {/* Education Section */}
      <Text style={styles.sectionHeader}>Drug Information (FDA)</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading drug information...</Text>
        </View>
      ) : !labelInfo ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No FDA label information available for "{medication.name}".
          </Text>
          <Text style={styles.emptySubtext}>
            Try using the generic drug name if you used a brand name.
          </Text>
        </View>
      ) : (
        SECTIONS.map((section) => {
          const text = labelInfo[section.key];
          if (!text) return null;
          const isExpanded = expandedSections.has(section.key);

          return (
            <View key={section.key} style={styles.accordion}>
              <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => toggleSection(section.key)}
                activeOpacity={0.7}
              >
                <Text style={styles.accordionTitle}>{section.title}</Text>
                <Text style={styles.accordionArrow}>{isExpanded ? '-' : '+'}</Text>
              </TouchableOpacity>
              {isExpanded && (
                <View style={styles.accordionBody}>
                  <Text style={styles.accordionText} selectable>{text}</Text>
                </View>
              )}
            </View>
          );
        })
      )}

      <Text style={styles.disclaimer}>
        * General drug information from FDA-approved labeling. Not medical advice. Consult your healthcare provider.
      </Text>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  content: { padding: 16 },

  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  medName: { fontSize: 22, fontWeight: '700', color: '#2d3748' },
  medDosage: { fontSize: 15, color: '#718096', marginTop: 4, marginBottom: 16 },
  detailRow: { marginBottom: 12 },
  detailLabel: { fontSize: 12, fontWeight: '600', color: '#a0aec0', textTransform: 'uppercase', marginBottom: 2 },
  detailValue: { fontSize: 15, color: '#2d3748' },
  reasonChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  reasonChip: {
    backgroundColor: '#edf2f7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reasonChipText: { fontSize: 13, color: '#4a5568' },
  addedDate: { fontSize: 12, color: '#a0aec0', marginTop: 4 },
  editBtn: {
    marginTop: 14,
    backgroundColor: '#667eea',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  editBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 12,
  },

  loadingContainer: { alignItems: 'center', padding: 40 },
  loadingText: { fontSize: 14, color: '#a0aec0', marginTop: 12 },
  emptyContainer: { alignItems: 'center', padding: 30, backgroundColor: '#fff', borderRadius: 12 },
  emptyText: { fontSize: 15, color: '#718096', textAlign: 'center' },
  emptySubtext: { fontSize: 13, color: '#a0aec0', textAlign: 'center', marginTop: 8 },

  accordion: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  accordionTitle: { fontSize: 15, fontWeight: '600', color: '#2d3748', flex: 1 },
  accordionArrow: { fontSize: 18, color: '#667eea', fontWeight: '700', marginLeft: 8 },
  accordionBody: {
    padding: 14,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  accordionText: { fontSize: 14, color: '#4a5568', lineHeight: 22 },

  disclaimer: {
    fontSize: 11,
    color: '#a0aec0',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 10,
  },
});
