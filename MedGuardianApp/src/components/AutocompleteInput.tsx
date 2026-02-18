import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

interface AutocompleteInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  onSelect?: (item: string) => void;
  placeholder: string;
  localSuggestions?: string[];
  fetchSuggestions?: (query: string) => Promise<string[]>;
  accentColor?: string;
  autoFocus?: boolean;
  submitLabel?: string;
  showSubmitButton?: boolean;
  showAllOnFocus?: boolean;
  inputStyle?: object;
}

const PAGE_SIZE = 6;

export default function AutocompleteInput({
  value,
  onChangeText,
  onSubmit,
  onSelect,
  placeholder,
  localSuggestions = [],
  fetchSuggestions,
  accentColor = '#667eea',
  autoFocus = false,
  submitLabel = 'Add',
  showSubmitButton = true,
  showAllOnFocus = false,
  inputStyle,
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleFocus = useCallback(() => {
    if (showAllOnFocus && localSuggestions.length > 0 && !value) {
      setSuggestions(localSuggestions);
      setShowDropdown(true);
      setExpanded(false);
    }
  }, [showAllOnFocus, localSuggestions, value]);

  const updateSuggestions = useCallback(
    (query: string) => {
      if (query.length < 1) {
        if (showAllOnFocus && localSuggestions.length > 0) {
          setSuggestions(localSuggestions);
          setShowDropdown(true);
          setExpanded(false);
        } else {
          setSuggestions([]);
          setShowDropdown(false);
        }
        return;
      }

      // Filter local suggestions — prioritize prefix matches over substring
      const lower = query.toLowerCase();
      const prefixMatches = localSuggestions.filter((s) =>
        s.toLowerCase().startsWith(lower)
      );
      const substringMatches = localSuggestions.filter(
        (s) => !s.toLowerCase().startsWith(lower) && s.toLowerCase().includes(lower)
      );
      const localMatches = [...prefixMatches, ...substringMatches];

      if (query.length < 2) {
        setSuggestions(localMatches.slice(0, 6));
        setShowDropdown(localMatches.length > 0);
        return;
      }

      // Show local matches right away
      setSuggestions(localMatches.slice(0, 4));
      setShowDropdown(localMatches.length > 0);

      // Fetch remote suggestions with debounce
      if (fetchSuggestions) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (abortRef.current) abortRef.current.abort();

        debounceRef.current = setTimeout(async () => {
          setLoading(true);
          try {
            const remote = await fetchSuggestions(query);
            // Sort remote: prefix matches first
            const sortedRemote = [...remote].sort((a, b) => {
              const aPrefix = a.toLowerCase().startsWith(lower) ? 0 : 1;
              const bPrefix = b.toLowerCase().startsWith(lower) ? 0 : 1;
              return aPrefix - bPrefix;
            });
            // Merge local + remote, deduplicated
            const seen = new Set(localMatches.map((s) => s.toLowerCase()));
            const merged = [...localMatches.slice(0, 3)];
            for (const r of sortedRemote) {
              if (!seen.has(r.toLowerCase())) {
                seen.add(r.toLowerCase());
                merged.push(r);
              }
            }
            setSuggestions(merged.slice(0, 8));
            setShowDropdown(merged.length > 0);
          } catch {
            // Keep local results on error
          } finally {
            setLoading(false);
          }
        }, 300);
      }
    },
    [localSuggestions, fetchSuggestions, showAllOnFocus]
  );

  const handleChangeText = (text: string) => {
    onChangeText(text);
    updateSuggestions(text);
  };

  const handleSelect = (item: string) => {
    onChangeText(item);
    onSelect?.(item);
    setShowDropdown(false);
    setSuggestions([]);
    setExpanded(false);
  };

  const handleSubmit = () => {
    setShowDropdown(false);
    setSuggestions([]);
    setExpanded(false);
    onSubmit?.();
  };

  const visibleSuggestions = expanded ? suggestions : suggestions.slice(0, PAGE_SIZE);
  const hasMore = suggestions.length > PAGE_SIZE;

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { borderColor: accentColor }, !showSubmitButton && { flex: undefined }, inputStyle]}
          placeholder={placeholder}
          value={value}
          onChangeText={handleChangeText}
          autoFocus={autoFocus}
          onSubmitEditing={handleSubmit}
          onFocus={handleFocus}
          onBlur={() => setTimeout(() => { setShowDropdown(false); setExpanded(false); }, 150)}
          autoCapitalize="words"
        />
        {showSubmitButton && (
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: accentColor }]}
            onPress={handleSubmit}
          >
            <Text style={styles.submitText}>{submitLabel}</Text>
          </TouchableOpacity>
        )}
      </View>

      {showDropdown && suggestions.length > 0 && (
        <View style={[styles.dropdown, { borderColor: accentColor }]}>
          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={accentColor} />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          )}
          {visibleSuggestions.map((item, index) => (
            <TouchableOpacity
              key={`${item}-${index}`}
              style={[
                styles.suggestionItem,
                index < visibleSuggestions.length - 1 && styles.suggestionBorder,
              ]}
              onPress={() => handleSelect(item)}
            >
              <Text style={styles.suggestionText}>{item}</Text>
            </TouchableOpacity>
          ))}
          {hasMore && (
            <TouchableOpacity
              style={styles.showMoreBtn}
              onPress={() => setExpanded(!expanded)}
            >
              <Text style={styles.showMoreText}>
                {expanded ? 'Show less' : `Show all (${suggestions.length})`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', zIndex: 10 },
  inputRow: { flexDirection: 'row' },
  input: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#2d3748',
  },
  submitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
    justifyContent: 'center',
  },
  submitText: { color: '#fff', fontWeight: '600' },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },
  loadingText: { fontSize: 13, color: '#a0aec0' },
  suggestionItem: { padding: 12 },
  suggestionBorder: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  suggestionText: { fontSize: 14, color: '#2d3748' },
  showMoreBtn: {
    padding: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  showMoreText: { fontSize: 13, color: '#667eea', fontWeight: '600' },
});
