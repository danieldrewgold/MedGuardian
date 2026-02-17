import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AutocompleteInput from './AutocompleteInput';

interface ChipInputProps {
  chips: string[];
  onChipsChange: (chips: string[]) => void;
  placeholder: string;
  localSuggestions?: string[];
  accentColor?: string;
  inputStyle?: object;
}

export default function ChipInput({
  chips,
  onChipsChange,
  placeholder,
  localSuggestions = [],
  accentColor = '#667eea',
  inputStyle,
}: ChipInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addChip = (value?: string) => {
    const trimmed = (value ?? inputValue).trim();
    if (trimmed && !chips.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      onChipsChange([...chips, trimmed]);
    }
    setInputValue('');
  };

  const removeChip = (index: number) => {
    onChipsChange(chips.filter((_, i) => i !== index));
  };

  // Filter out already-selected items from suggestions
  const filteredSuggestions = localSuggestions.filter(
    (s) => !chips.some((c) => c.toLowerCase() === s.toLowerCase())
  );

  return (
    <View>
      {chips.length > 0 && (
        <View style={styles.chipRow}>
          {chips.map((chip, i) => (
            <View key={`${chip}-${i}`} style={styles.chip}>
              <Text style={styles.chipText}>{chip}</Text>
              <TouchableOpacity onPress={() => removeChip(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.chipRemove}>x</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      <AutocompleteInput
        value={inputValue}
        onChangeText={setInputValue}
        onSubmit={() => addChip()}
        onSelect={(item) => addChip(item)}
        placeholder={chips.length > 0 ? 'Add another...' : placeholder}
        localSuggestions={filteredSuggestions}
        accentColor={accentColor}
        showSubmitButton={false}
        inputStyle={inputStyle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#edf2f7',
    paddingVertical: 6,
    paddingLeft: 10,
    paddingRight: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  chipText: { fontSize: 13, color: '#4a5568' },
  chipRemove: { color: '#a0aec0', fontSize: 14, fontWeight: '600', paddingHorizontal: 4 },
});
