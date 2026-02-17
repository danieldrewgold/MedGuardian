import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Patients } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  patients: Patients;
  currentPatient: string;
  onSelectPatient: (id: string) => void;
  onAddPatient: (name: string) => void;
  onRenamePatient?: (id: string, newName: string) => void;
}

export default function PatientSelectorModal({
  visible,
  onClose,
  patients,
  currentPatient,
  onSelectPatient,
  onAddPatient,
  onRenamePatient,
}: Props) {
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  const entries = Object.entries(patients).filter(([_, p]) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (id: string) => {
    onSelectPatient(id);
    setSearch('');
  };

  const handleAdd = () => {
    if (newName.trim()) {
      onAddPatient(newName.trim());
      setNewName('');
      setShowAdd(false);
      setSearch('');
    }
  };

  const handleClose = () => {
    setSearch('');
    setShowAdd(false);
    setNewName('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Select Patient</Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Search patients..."
            value={search}
            onChangeText={setSearch}
            autoFocus
          />

          <FlatList
            data={entries}
            keyExtractor={([id]) => id}
            style={styles.list}
            renderItem={({ item: [id, patient] }) => (
              renamingId === id ? (
                <View style={[styles.row, styles.renameRow]}>
                  <TextInput
                    style={styles.renameInput}
                    value={renameText}
                    onChangeText={setRenameText}
                    autoFocus
                    onSubmitEditing={() => {
                      if (renameText.trim()) onRenamePatient?.(id, renameText.trim());
                      setRenamingId(null);
                    }}
                  />
                  <TouchableOpacity
                    style={styles.renameSaveBtn}
                    onPress={() => {
                      if (renameText.trim()) onRenamePatient?.(id, renameText.trim());
                      setRenamingId(null);
                    }}
                  >
                    <Text style={styles.renameSaveText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setRenamingId(null)}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.row, id === currentPatient && styles.rowActive]}
                  onPress={() => handleSelect(id)}
                  onLongPress={() => {
                    if (onRenamePatient) {
                      setRenamingId(id);
                      setRenameText(patient.name);
                    }
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowName, id === currentPatient && styles.rowNameActive]}>
                      {patient.name}
                    </Text>
                    <Text style={styles.rowMeta}>
                      {patient.medications.length} medication{patient.medications.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  {id === currentPatient && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No patients match "{search}"</Text>
            }
          />

          {showAdd ? (
            <View style={styles.addRow}>
              <TextInput
                style={styles.addInput}
                placeholder="Patient name..."
                value={newName}
                onChangeText={setNewName}
                autoFocus
                onSubmitEditing={handleAdd}
              />
              <TouchableOpacity style={styles.addSaveBtn} onPress={handleAdd}>
                <Text style={styles.addSaveText}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowAdd(false); setNewName(''); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addPatientBtn} onPress={() => setShowAdd(true)}>
              <Text style={styles.addPatientText}>+ Add New Patient</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1 },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: '70%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#2d3748', marginBottom: 12 },
  searchInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#f7fafc',
    marginBottom: 12,
  },
  list: { maxHeight: 300 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 4,
  },
  rowActive: { backgroundColor: '#eef2ff' },
  rowName: { fontSize: 15, fontWeight: '600', color: '#2d3748' },
  rowNameActive: { color: '#667eea' },
  rowMeta: { fontSize: 12, color: '#a0aec0', marginTop: 2 },
  checkmark: { fontSize: 18, color: '#667eea', fontWeight: '700' },
  emptyText: { fontSize: 14, color: '#a0aec0', textAlign: 'center', padding: 20 },
  addRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  addInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  addSaveBtn: {
    backgroundColor: '#667eea',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  addSaveText: { color: '#fff', fontWeight: '600' },
  cancelText: { color: '#a0aec0', fontSize: 14, marginLeft: 10 },
  addPatientBtn: {
    borderWidth: 2,
    borderColor: '#667eea',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  addPatientText: { color: '#667eea', fontSize: 15, fontWeight: '600' },
  renameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  renameInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#667eea',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  renameSaveBtn: {
    backgroundColor: '#667eea',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  renameSaveText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
