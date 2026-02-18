export type MedStatus = 'prescribed' | 'sent_to_pharmacy' | 'picked_up' | 'active' | 'discontinued';

export interface Medication {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  doctor: string;
  reason: string;
  refillDate: string | null;
  addedDate: string;
  schedule: string;
  status?: MedStatus;
  statusUpdatedAt?: string;
}

export interface Allergy {
  id: number;
  name: string;
  addedDate: string;
}

export interface VisitNote {
  id: number;
  timestamp: string;
  text: string;
}

export interface Patient {
  name: string;
  medications: Medication[];
  allergies: Allergy[];
  notes?: string;
  visitNotes?: VisitNote[];
  recentMeds?: string[]; // tracks recently added med names for quick-add
}

export interface Patients {
  [key: string]: Patient;
}

export interface Interaction {
  med1: string;
  med2: string;
  severity: 'major' | 'moderate';
  description: string;
  info: string;
  source: 'reference_database' | 'openfda';
}

export interface AllergyConflict {
  medication: string;
  allergy: string;
}

export interface RefillStatus {
  upcoming: (Medication & { daysUntil: number })[];
  overdue: (Medication & { daysOverdue: number })[];
}

export interface CriticalInteraction {
  drug1: string;
  drug2: string;
  severity: 'major' | 'moderate';
  description: string;
  info: string;
}
