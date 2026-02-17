import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Patients, Medication, Allergy, Interaction, AllergyConflict, RefillStatus } from '../types';
import { checkInteractions, checkAllergyConflicts, checkRefillReminders } from '../services/interactions';

interface AppState {
  patients: Patients;
  currentPatient: string;
  currentUserType: 'caregiver' | 'provider';
  interactions: Interaction[];
  allergyConflicts: AllergyConflict[];
  refillStatus: RefillStatus;
  loading: boolean;
}

interface AppContextType extends AppState {
  setCurrentUserType: (type: 'caregiver' | 'provider') => void;
  setCurrentPatient: (id: string) => void;
  addPatient: (name: string) => string;
  addMedication: (med: Omit<Medication, 'id' | 'addedDate' | 'schedule'>) => void;
  deleteMedication: (id: number) => void;
  addAllergy: (name: string) => void;
  deleteAllergy: (id: number) => void;
  clearAllData: () => Promise<void>;
  exportData: () => string;
  refreshInteractions: () => Promise<void>;
  getCurrentPatient: () => { medications: Medication[]; allergies: Allergy[]; name: string };
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  patients: 'medguardian_patients',
  current: 'medguardian_current',
};

const defaultPatients: Patients = {
  default: { name: 'Default Patient', medications: [], allergies: [] },
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patients>(defaultPatients);
  const [currentPatient, setCurrentPatientState] = useState('default');
  const [currentUserType, setCurrentUserType] = useState<'caregiver' | 'provider'>('caregiver');
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

  const addMedication = useCallback(
    (med: Omit<Medication, 'id' | 'addedDate' | 'schedule'>) => {
      const medication: Medication = {
        ...med,
        id: Date.now(),
        addedDate: new Date().toISOString(),
        schedule: 'morning',
      };
      const newPatients = { ...patients };
      newPatients[currentPatient] = {
        ...newPatients[currentPatient],
        medications: [...newPatients[currentPatient].medications, medication],
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

  const clearAllData = useCallback(async () => {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    setPatients(defaultPatients);
    setCurrentPatientState('default');
    setInteractions([]);
    setAllergyConflicts([]);
    setRefillStatus({ upcoming: [], overdue: [] });
  }, []);

  const exportData = useCallback(() => {
    return JSON.stringify(patients, null, 2);
  }, [patients]);

  const getCurrentPatient = useCallback(() => {
    return patients[currentPatient] || defaultPatients.default;
  }, [patients, currentPatient]);

  return (
    <AppContext.Provider
      value={{
        patients,
        currentPatient,
        currentUserType,
        interactions,
        allergyConflicts,
        refillStatus,
        loading,
        setCurrentUserType,
        setCurrentPatient,
        addPatient,
        addMedication,
        deleteMedication,
        addAllergy,
        deleteAllergy,
        clearAllData,
        exportData,
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
