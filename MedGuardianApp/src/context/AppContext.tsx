import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Patients, Medication, MedStatus, Allergy, Interaction, AllergyConflict, RefillStatus, VisitNote } from '../types';
import { checkInteractions, checkAllergyConflicts, checkRefillReminders } from '../services/interactions';

interface AppState {
  patients: Patients;
  currentPatient: string;
  interactions: Interaction[];
  allergyConflicts: AllergyConflict[];
  refillStatus: RefillStatus;
  loading: boolean;
}

interface AppContextType extends AppState {
  setCurrentPatient: (id: string) => void;
  addPatient: (name: string) => string;
  renamePatient: (id: string, newName: string) => void;
  reorderPatients: (orderedIds: string[]) => void;
  addMedication: (med: Omit<Medication, 'id' | 'addedDate' | 'schedule'>) => void;
  updateMedication: (id: number, med: Omit<Medication, 'id' | 'addedDate' | 'schedule'>) => void;
  deleteMedication: (id: number) => void;
  addAllergy: (name: string) => void;
  deleteAllergy: (id: number) => void;
  updatePatientNotes: (notes: string) => void;
  updateMedStatus: (id: number, status: MedStatus) => void;
  addVisitNote: (text: string) => void;
  deleteVisitNote: (id: number) => void;
  getRecentMeds: () => string[];
  refreshInteractions: () => Promise<void>;
  getCurrentPatient: () => { medications: Medication[]; allergies: Allergy[]; name: string; notes?: string; visitNotes?: VisitNote[]; recentMeds?: string[] };
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  patients: 'medguardian_patients',
  current: 'medguardian_current',
};

const defaultPatients: Patients = {
  default: { name: 'My Medications', medications: [], allergies: [] },
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patients>(defaultPatients);
  const [currentPatient, setCurrentPatientState] = useState('default');
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [allergyConflicts, setAllergyConflicts] = useState<AllergyConflict[]>([]);
  const [refillStatus, setRefillStatus] = useState<RefillStatus>({ upcoming: [], overdue: [] });
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    (async () => {
      try {
        const [savedPatients, savedCurrent] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.patients),
          AsyncStorage.getItem(STORAGE_KEYS.current),
        ]);

        if (savedPatients) {
          const parsed = JSON.parse(savedPatients);
          Object.keys(parsed).forEach((key) => {
            if (!parsed[key].allergies) parsed[key].allergies = [];
          });
          setPatients(parsed);
        }
        if (savedCurrent) setCurrentPatientState(savedCurrent);
      } catch (e) {
        console.error('Error loading data:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const savePatients = useCallback(async (newPatients: Patients) => {
    setPatients(newPatients);
    await AsyncStorage.setItem(STORAGE_KEYS.patients, JSON.stringify(newPatients));
  }, []);

  const refreshInteractions = useCallback(async () => {
    const patient = patients[currentPatient];
    if (!patient) return;

    const [newInteractions] = await Promise.all([
      checkInteractions(patient.medications),
    ]);
    const newConflicts = checkAllergyConflicts(patient.medications, patient.allergies);
    const newRefills = checkRefillReminders(patient.medications);

    setInteractions(newInteractions);
    setAllergyConflicts(newConflicts);
    setRefillStatus(newRefills);
  }, [patients, currentPatient]);

  // Refresh interactions when patient data changes
  useEffect(() => {
    if (!loading) refreshInteractions();
  }, [patients, currentPatient, loading, refreshInteractions]);

  const setCurrentPatient = useCallback(async (id: string) => {
    setCurrentPatientState(id);
    await AsyncStorage.setItem(STORAGE_KEYS.current, id);
  }, []);

  const addPatient = useCallback(
    (name: string) => {
      const id = 'patient_' + Date.now();
      const newPatients = {
        ...patients,
        [id]: { name, medications: [], allergies: [] },
      };
      savePatients(newPatients);
      setCurrentPatient(id);
      return id;
    },
    [patients, savePatients, setCurrentPatient]
  );

  const renamePatient = useCallback(
    (id: string, newName: string) => {
      if (!patients[id] || !newName.trim()) return;
      const newPatients = { ...patients };
      newPatients[id] = { ...newPatients[id], name: newName.trim() };
      savePatients(newPatients);
    },
    [patients, savePatients]
  );

  const reorderPatients = useCallback(
    (orderedIds: string[]) => {
      const newPatients: Patients = {};
      for (const id of orderedIds) {
        if (patients[id]) newPatients[id] = patients[id];
      }
      // Include any ids not in the ordered list (shouldn't happen but safety)
      for (const id of Object.keys(patients)) {
        if (!newPatients[id]) newPatients[id] = patients[id];
      }
      savePatients(newPatients);
    },
    [patients, savePatients]
  );

  const addMedication = useCallback(
    (med: Omit<Medication, 'id' | 'addedDate' | 'schedule'>) => {
      const medication: Medication = {
        ...med,
        id: Date.now(),
        addedDate: new Date().toISOString(),
        schedule: 'morning',
      };
      const newPatients = { ...patients };
      const patient = newPatients[currentPatient];
      // Track recently added med names (across all patients, max 20, no duplicates)
      const prevRecent = patient.recentMeds || [];
      const updatedRecent = [med.name, ...prevRecent.filter((n) => n.toLowerCase() !== med.name.toLowerCase())].slice(0, 20);
      newPatients[currentPatient] = {
        ...patient,
        medications: [...patient.medications, medication],
        recentMeds: updatedRecent,
      };
      savePatients(newPatients);
    },
    [patients, currentPatient, savePatients]
  );

  const updateMedication = useCallback(
    (id: number, med: Omit<Medication, 'id' | 'addedDate' | 'schedule'>) => {
      const newPatients = { ...patients };
      newPatients[currentPatient] = {
        ...newPatients[currentPatient],
        medications: newPatients[currentPatient].medications.map((m) =>
          m.id === id ? { ...m, ...med } : m
        ),
      };
      savePatients(newPatients);
    },
    [patients, currentPatient, savePatients]
  );

  const deleteMedication = useCallback(
    (id: number) => {
      const newPatients = { ...patients };
      newPatients[currentPatient] = {
        ...newPatients[currentPatient],
        medications: newPatients[currentPatient].medications.filter((m) => m.id !== id),
      };
      savePatients(newPatients);
    },
    [patients, currentPatient, savePatients]
  );

  const updateMedStatus = useCallback(
    (id: number, status: MedStatus) => {
      const newPatients = { ...patients };
      newPatients[currentPatient] = {
        ...newPatients[currentPatient],
        medications: newPatients[currentPatient].medications.map((m) =>
          m.id === id ? { ...m, status, statusUpdatedAt: new Date().toISOString() } : m
        ),
      };
      savePatients(newPatients);
    },
    [patients, currentPatient, savePatients]
  );

  const addAllergy = useCallback(
    (name: string) => {
      const allergy: Allergy = {
        id: Date.now(),
        name,
        addedDate: new Date().toISOString(),
      };
      const newPatients = { ...patients };
      newPatients[currentPatient] = {
        ...newPatients[currentPatient],
        allergies: [...(newPatients[currentPatient].allergies || []), allergy],
      };
      savePatients(newPatients);
    },
    [patients, currentPatient, savePatients]
  );

  const deleteAllergy = useCallback(
    (id: number) => {
      const newPatients = { ...patients };
      newPatients[currentPatient] = {
        ...newPatients[currentPatient],
        allergies: newPatients[currentPatient].allergies.filter((a) => a.id !== id),
      };
      savePatients(newPatients);
    },
    [patients, currentPatient, savePatients]
  );

  const updatePatientNotes = useCallback(
    (notes: string) => {
      const newPatients = { ...patients };
      newPatients[currentPatient] = {
        ...newPatients[currentPatient],
        notes,
      };
      savePatients(newPatients);
    },
    [patients, currentPatient, savePatients]
  );

  const addVisitNote = useCallback(
    (text: string) => {
      const note: VisitNote = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        text: text.trim(),
      };
      const newPatients = { ...patients };
      const patient = newPatients[currentPatient];
      newPatients[currentPatient] = {
        ...patient,
        visitNotes: [note, ...(patient.visitNotes || [])],
      };
      savePatients(newPatients);
    },
    [patients, currentPatient, savePatients]
  );

  const deleteVisitNote = useCallback(
    (id: number) => {
      const newPatients = { ...patients };
      const patient = newPatients[currentPatient];
      newPatients[currentPatient] = {
        ...patient,
        visitNotes: (patient.visitNotes || []).filter((n) => n.id !== id),
      };
      savePatients(newPatients);
    },
    [patients, currentPatient, savePatients]
  );

  const getRecentMeds = useCallback(() => {
    // Gather recent meds across ALL patients for the PA
    const allRecent: string[] = [];
    const seen = new Set<string>();
    Object.values(patients).forEach((p) => {
      (p.recentMeds || []).forEach((name) => {
        const lower = name.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          allRecent.push(name);
        }
      });
    });
    return allRecent.slice(0, 30);
  }, [patients]);

  const getCurrentPatient = useCallback(() => {
    return patients[currentPatient] || defaultPatients.default;
  }, [patients, currentPatient]);

  return (
    <AppContext.Provider
      value={{
        patients,
        currentPatient,
        interactions,
        allergyConflicts,
        refillStatus,
        loading,
        setCurrentPatient,
        addPatient,
        renamePatient,
        reorderPatients,
        addMedication,
        updateMedication,
        deleteMedication,
        updateMedStatus,
        addAllergy,
        deleteAllergy,
        updatePatientNotes,
        addVisitNote,
        deleteVisitNote,
        getRecentMeds,
        refreshInteractions,
        getCurrentPatient,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
