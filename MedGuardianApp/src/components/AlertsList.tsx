import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';

export default function AlertsList() {
  const { interactions, allergyConflicts, refillStatus } = useApp();

  if (
    interactions.length === 0 &&
    allergyConflicts.length === 0 &&
    refillStatus.overdue.length === 0 &&
    refillStatus.upcoming.length === 0
  ) {
    return null;
  }

  return (
    <View>
      {refillStatus.overdue.map((med) => (
        <View key={`overdue-${med.id}`} style={[styles.alert, styles.critical]}>
          <Text style={styles.title}>REFILL REMINDER: {med.name}</Text>
          <Text style={styles.text}>Refill date was {med.daysOverdue} days ago</Text>
          <Text style={styles.text}>
            Contact your pharmacy or healthcare provider to refill this medication if needed.
          </Text>
        </View>
      ))}

      {refillStatus.upcoming.map((med) => (
        <View key={`upcoming-${med.id}`} style={[styles.alert, styles.warning]}>
          <Text style={styles.title}>UPCOMING REFILL: {med.name}</Text>
          <Text style={styles.text}>
            Refill date in {med.daysUntil} days ({new Date(med.refillDate!).toLocaleDateString()})
          </Text>
          <Text style={styles.text}>You may want to contact your pharmacy to arrange a refill.</Text>
        </View>
      ))}

      {allergyConflicts.map((conflict, i) => {
        const isInteraction = conflict.allergy.includes('(known interaction:');
        const isCrossReactivity = conflict.allergy.includes('(cross-reactivity)') || conflict.allergy.includes('(same drug class)');
        const isDirect = !isInteraction && !isCrossReactivity;

        return (
          <View key={`allergy-${i}`} style={[styles.alert, styles.critical]}>
            {isDirect ? (
              <>
                <Text style={styles.title}>ALLERGY ALERT: {conflict.medication}</Text>
                <Text style={styles.text}>Patient has documented allergy to: {conflict.allergy}</Text>
                <Text style={styles.text}>
                  Taking medications you're allergic to may cause serious reactions. Consult your healthcare
                  provider immediately if this medication was prescribed to you.
                </Text>
              </>
            ) : isCrossReactivity ? (
              <>
                <Text style={styles.title}>ALLERGY ALERT (RELATED DRUG): {conflict.medication}</Text>
                <Text style={styles.text}>Patient has documented allergy to: {conflict.allergy}</Text>
                <Text style={styles.text}>
                  {conflict.medication} belongs to the same drug class or a cross-reactive class. Discuss with
                  your healthcare provider before taking this medication.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.title}>ALLERGY-DRUG INTERACTION: {conflict.medication}</Text>
                <Text style={styles.text}>Patient is allergic to: {conflict.allergy.split(' (known interaction:')[0]}</Text>
                <Text style={styles.text}>
                  {conflict.allergy.match(/\(known interaction: (.+)\)/)?.[1] || 'Known interaction between this allergy and current medication.'}
                </Text>
                <Text style={styles.text}>
                  Even though the patient is not taking {conflict.allergy.split(' (known interaction:')[0]}, this allergy may be clinically relevant
                  to {conflict.medication}. Discuss with your healthcare provider.
                </Text>
              </>
            )}
            <Text style={styles.footnote}>
              This is an informational alert based on your allergy list. Always verify medications with your
              healthcare provider.
            </Text>
          </View>
        );
      })}

      {interactions.map((interaction, i) => (
        <View
          key={`interaction-${i}`}
          style={[styles.alert, interaction.severity === 'major' ? styles.critical : styles.warning]}
        >
          <Text style={styles.title}>
            INTERACTION INFORMATION*: {interaction.med1} + {interaction.med2}
          </Text>
          <Text style={styles.text}>Severity: {interaction.severity === 'major' ? 'Major' : 'Moderate'}</Text>
          <Text style={styles.text}>Information: {interaction.description}</Text>
          <Text style={styles.text}>Guidance: {interaction.info}</Text>
          <Text style={styles.footnote}>
            {interaction.source === 'openfda' ? 'Source: OpenFDA Drug Label Database' : 'Source: Medical Reference Database'}
            {'\n'}This is general drug information. For medical advice specific to your situation, consult your
            healthcare provider.
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  alert: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
  },
  warning: {
    backgroundColor: '#fff5f5',
    borderColor: '#fc8181',
  },
  critical: {
    backgroundColor: '#ffe5e5',
    borderColor: '#f56565',
  },
  title: {
    color: '#c53030',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  text: {
    color: '#742a2a',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 4,
  },
  footnote: {
    fontSize: 12,
    color: '#718096',
    marginTop: 8,
    lineHeight: 18,
  },
});
