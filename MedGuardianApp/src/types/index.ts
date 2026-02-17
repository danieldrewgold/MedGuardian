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
}

export interface Allergy {
  id: number;
  name: string;
  addedDate: string;
}

export interface Patient {
  name: string;
  medications: Medication[];
  allergies: Allergy[];
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
