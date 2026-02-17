import { CriticalInteraction, Medication, Interaction, Allergy, AllergyConflict, RefillStatus } from '../types';

// ─── Expanded offline interaction database (45+ entries) ─────────────────────
// Sources: ONC High-Priority DDI list, FDA drug labels, clinical references.
// This is general reference information, not medical advice.

export const CRITICAL_INTERACTIONS: CriticalInteraction[] = [
  // ── Anticoagulant interactions (bleeding risk) ──
  { drug1: 'warfarin', drug2: 'aspirin', severity: 'major', description: 'May significantly increase bleeding risk when combined.', info: 'Consult your healthcare provider about taking these together.' },
  { drug1: 'warfarin', drug2: 'ibuprofen', severity: 'major', description: 'NSAIDs may increase bleeding risk with warfarin.', info: 'Discuss alternative pain relievers with your provider.' },
  { drug1: 'warfarin', drug2: 'naproxen', severity: 'major', description: 'NSAIDs may increase bleeding risk with warfarin.', info: 'Discuss alternative pain relievers with your provider.' },
  { drug1: 'warfarin', drug2: 'fluconazole', severity: 'major', description: 'Fluconazole may increase warfarin levels, raising bleeding risk.', info: 'Your provider may need to adjust warfarin dosage and monitor INR closely.' },
  { drug1: 'warfarin', drug2: 'amiodarone', severity: 'major', description: 'Amiodarone may increase warfarin levels significantly.', info: 'Warfarin dose may need to be reduced. Close INR monitoring required.' },
  { drug1: 'warfarin', drug2: 'metronidazole', severity: 'major', description: 'Metronidazole may increase warfarin effect and bleeding risk.', info: 'INR should be monitored closely during and after treatment.' },
  { drug1: 'warfarin', drug2: 'omeprazole', severity: 'moderate', description: 'Omeprazole may affect warfarin metabolism.', info: 'Monitor INR when starting or stopping omeprazole.' },
  { drug1: 'apixaban', drug2: 'ketoconazole', severity: 'major', description: 'Ketoconazole may significantly increase apixaban levels.', info: 'This combination should generally be avoided. Consult your provider.' },
  { drug1: 'rivaroxaban', drug2: 'ketoconazole', severity: 'major', description: 'Ketoconazole may significantly increase rivaroxaban levels.', info: 'This combination should generally be avoided. Consult your provider.' },

  // ── ACE inhibitor / ARB interactions ──
  { drug1: 'lisinopril', drug2: 'spironolactone', severity: 'major', description: 'May increase potassium levels, which could affect heart function.', info: 'Your provider should monitor potassium levels if taking both.' },
  { drug1: 'lisinopril', drug2: 'potassium', severity: 'major', description: 'ACE inhibitors with potassium supplements may cause dangerously high potassium.', info: 'Do not take potassium supplements without your provider\'s guidance.' },
  { drug1: 'lisinopril', drug2: 'ibuprofen', severity: 'moderate', description: 'NSAIDs may reduce effectiveness of blood pressure medications.', info: 'Ask your pharmacist about alternative pain relievers.' },
  { drug1: 'lisinopril', drug2: 'naproxen', severity: 'moderate', description: 'NSAIDs may reduce effectiveness of blood pressure medications.', info: 'Ask your pharmacist about alternative pain relievers.' },
  { drug1: 'losartan', drug2: 'spironolactone', severity: 'major', description: 'May increase potassium levels, which could affect heart function.', info: 'Your provider should monitor potassium levels if taking both.' },
  { drug1: 'losartan', drug2: 'potassium', severity: 'major', description: 'ARBs with potassium supplements may cause dangerously high potassium.', info: 'Do not take potassium supplements without your provider\'s guidance.' },
  { drug1: 'enalapril', drug2: 'spironolactone', severity: 'major', description: 'May increase potassium levels, which could affect heart function.', info: 'Your provider should monitor potassium levels if taking both.' },

  // ── Statin interactions ──
  { drug1: 'simvastatin', drug2: 'amlodipine', severity: 'moderate', description: 'Amlodipine may increase simvastatin levels in the body.', info: 'Your doctor may adjust dosages. Report any unusual muscle pain.' },
  { drug1: 'simvastatin', drug2: 'amiodarone', severity: 'major', description: 'Amiodarone may significantly increase simvastatin levels, raising risk of muscle damage.', info: 'Simvastatin dose should not exceed 20mg with amiodarone.' },
  { drug1: 'simvastatin', drug2: 'clarithromycin', severity: 'major', description: 'Clarithromycin may greatly increase statin levels, risking muscle damage.', info: 'This combination should generally be avoided during antibiotic treatment.' },
  { drug1: 'atorvastatin', drug2: 'clarithromycin', severity: 'major', description: 'Clarithromycin may greatly increase statin levels, risking muscle damage.', info: 'Your provider may temporarily pause the statin during antibiotic treatment.' },
  { drug1: 'lovastatin', drug2: 'erythromycin', severity: 'major', description: 'Erythromycin may greatly increase statin levels, risking muscle damage.', info: 'This combination should generally be avoided.' },

  // ── Diabetes medication interactions ──
  { drug1: 'metformin', drug2: 'contrast dye', severity: 'major', description: 'Metformin may need to be stopped before procedures involving contrast dye.', info: 'Inform your doctor and radiologist if you take metformin.' },
  { drug1: 'metformin', drug2: 'alcohol', severity: 'moderate', description: 'Alcohol may increase certain risks when combined with metformin.', info: 'Discuss alcohol consumption with your healthcare provider.' },
  { drug1: 'glipizide', drug2: 'fluconazole', severity: 'major', description: 'Fluconazole may increase glipizide levels, causing dangerously low blood sugar.', info: 'Blood sugar should be monitored closely during treatment.' },
  { drug1: 'insulin', drug2: 'glipizide', severity: 'moderate', description: 'Using both may increase risk of low blood sugar.', info: 'Monitor blood sugar closely and know signs of hypoglycemia.' },

  // ── Heart / cardiac interactions ──
  { drug1: 'digoxin', drug2: 'furosemide', severity: 'moderate', description: 'Furosemide may lower potassium, increasing digoxin toxicity risk.', info: 'Your provider may monitor potassium and digoxin levels.' },
  { drug1: 'digoxin', drug2: 'amiodarone', severity: 'major', description: 'Amiodarone may increase digoxin levels significantly.', info: 'Digoxin dose typically needs to be reduced by half.' },
  { drug1: 'digoxin', drug2: 'verapamil', severity: 'major', description: 'Verapamil may increase digoxin levels.', info: 'Your provider should monitor digoxin levels closely.' },
  { drug1: 'metoprolol', drug2: 'verapamil', severity: 'major', description: 'Both slow heart rate and combining them may cause dangerously slow heartbeat.', info: 'This combination requires close cardiac monitoring.' },
  { drug1: 'atenolol', drug2: 'verapamil', severity: 'major', description: 'Both slow heart rate and combining them may cause dangerously slow heartbeat.', info: 'This combination requires close cardiac monitoring.' },

  // ── SSRI / antidepressant interactions ──
  { drug1: 'sertraline', drug2: 'tramadol', severity: 'major', description: 'Combining SSRIs with tramadol may increase risk of serotonin syndrome.', info: 'Watch for agitation, rapid heartbeat, fever, or muscle rigidity.' },
  { drug1: 'fluoxetine', drug2: 'tramadol', severity: 'major', description: 'Combining SSRIs with tramadol may increase risk of serotonin syndrome.', info: 'Watch for agitation, rapid heartbeat, fever, or muscle rigidity.' },
  { drug1: 'sertraline', drug2: 'sumatriptan', severity: 'moderate', description: 'SSRIs with triptans may increase serotonin syndrome risk.', info: 'Report any unusual symptoms to your provider immediately.' },
  { drug1: 'fluoxetine', drug2: 'sumatriptan', severity: 'moderate', description: 'SSRIs with triptans may increase serotonin syndrome risk.', info: 'Report any unusual symptoms to your provider immediately.' },
  { drug1: 'fluoxetine', drug2: 'warfarin', severity: 'moderate', description: 'Fluoxetine may increase warfarin levels and bleeding risk.', info: 'INR should be monitored when starting or stopping fluoxetine.' },

  // ── Opioid interactions ──
  { drug1: 'oxycodone', drug2: 'alprazolam', severity: 'major', description: 'Combining opioids with benzodiazepines may cause dangerous sedation and breathing problems.', info: 'FDA warns against combining these medications when possible.' },
  { drug1: 'hydrocodone', drug2: 'alprazolam', severity: 'major', description: 'Combining opioids with benzodiazepines may cause dangerous sedation and breathing problems.', info: 'FDA warns against combining these medications when possible.' },
  { drug1: 'oxycodone', drug2: 'diazepam', severity: 'major', description: 'Combining opioids with benzodiazepines may cause dangerous sedation and breathing problems.', info: 'FDA warns against combining these medications when possible.' },
  { drug1: 'tramadol', drug2: 'alprazolam', severity: 'major', description: 'Combining tramadol with benzodiazepines may cause dangerous sedation.', info: 'FDA warns against combining these medications when possible.' },

  // ── Antibiotic interactions ──
  { drug1: 'ciprofloxacin', drug2: 'tizanidine', severity: 'major', description: 'Ciprofloxacin may dramatically increase tizanidine levels, causing severe low blood pressure.', info: 'This combination should be avoided.' },
  { drug1: 'ciprofloxacin', drug2: 'theophylline', severity: 'major', description: 'Ciprofloxacin may increase theophylline levels to toxic range.', info: 'Theophylline levels should be monitored closely.' },
  { drug1: 'metronidazole', drug2: 'alcohol', severity: 'major', description: 'Alcohol with metronidazole may cause severe nausea, vomiting, and flushing.', info: 'Avoid all alcohol during treatment and for 3 days after.' },

  // ── Thyroid interactions ──
  { drug1: 'levothyroxine', drug2: 'calcium', severity: 'moderate', description: 'Calcium may reduce levothyroxine absorption.', info: 'Take levothyroxine at least 4 hours apart from calcium supplements.' },
  { drug1: 'levothyroxine', drug2: 'omeprazole', severity: 'moderate', description: 'Omeprazole may reduce levothyroxine absorption.', info: 'Thyroid levels may need monitoring when starting omeprazole.' },
  { drug1: 'levothyroxine', drug2: 'iron', severity: 'moderate', description: 'Iron supplements may reduce levothyroxine absorption.', info: 'Take levothyroxine at least 4 hours apart from iron supplements.' },
];

// ─── OpenFDA label-based interaction checking ────────────────────────────────

const fdaCache: Record<string, string[]> = {};

async function getFDAInteractionDrugs(drugName: string): Promise<string[]> {
  const key = drugName.toLowerCase();
  if (fdaCache[key]) return fdaCache[key];

  try {
    const url = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(drugName)}"&limit=1`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const data: any = await response.json();
    const label = data.results?.[0];
    const interactionText = label?.drug_interactions?.[0] || '';

    if (!interactionText) return [];

    // Extract drug names mentioned in the interaction text
    const mentionedDrugs: string[] = [];
    const commonDrugs = [
      'warfarin', 'aspirin', 'ibuprofen', 'naproxen', 'acetaminophen',
      'metformin', 'insulin', 'glipizide', 'glyburide',
      'lisinopril', 'enalapril', 'losartan', 'valsartan', 'amlodipine',
      'metoprolol', 'atenolol', 'propranolol', 'carvedilol',
      'simvastatin', 'atorvastatin', 'rosuvastatin', 'lovastatin', 'pravastatin',
      'omeprazole', 'pantoprazole', 'esomeprazole', 'lansoprazole',
      'sertraline', 'fluoxetine', 'paroxetine', 'citalopram', 'escitalopram',
      'amiodarone', 'digoxin', 'verapamil', 'diltiazem',
      'furosemide', 'hydrochlorothiazide', 'spironolactone',
      'alprazolam', 'diazepam', 'lorazepam', 'clonazepam',
      'oxycodone', 'hydrocodone', 'tramadol', 'morphine', 'codeine',
      'gabapentin', 'pregabalin', 'carbamazepine', 'phenytoin', 'valproic acid',
      'ciprofloxacin', 'levofloxacin', 'azithromycin', 'amoxicillin',
      'clarithromycin', 'erythromycin', 'metronidazole', 'fluconazole',
      'ketoconazole', 'itraconazole',
      'prednisone', 'prednisolone', 'dexamethasone',
      'levothyroxine', 'lithium', 'theophylline', 'cyclosporine',
      'rivaroxaban', 'apixaban', 'dabigatran', 'clopidogrel',
      'sumatriptan', 'tizanidine',
    ];

    const lowerText = interactionText.toLowerCase();
    for (const drug of commonDrugs) {
      if (drug !== key && lowerText.includes(drug)) {
        mentionedDrugs.push(drug);
      }
    }

    fdaCache[key] = mentionedDrugs;
    return mentionedDrugs;
  } catch (error) {
    console.error('OpenFDA lookup error for', drugName, ':', error);
    return [];
  }
}

// ─── Main interaction checking logic ─────────────────────────────────────────

export async function checkInteractions(medications: Medication[]): Promise<Interaction[]> {
  const interactions: Interaction[] = [];
  const foundPairs = new Set<string>();

  const pairKey = (a: string, b: string) => [a, b].sort().join('|||').toLowerCase();

  // 1. Check local offline database first (instant, no network needed)
  for (let i = 0; i < medications.length; i++) {
    for (let j = i + 1; j < medications.length; j++) {
      const name1 = medications[i].name.toLowerCase();
      const name2 = medications[j].name.toLowerCase();

      for (const interaction of CRITICAL_INTERACTIONS) {
        const match1 = name1.includes(interaction.drug1) && name2.includes(interaction.drug2);
        const match2 = name1.includes(interaction.drug2) && name2.includes(interaction.drug1);
        if (match1 || match2) {
          const key = pairKey(medications[i].name, medications[j].name);
          if (!foundPairs.has(key)) {
            foundPairs.add(key);
            interactions.push({
              med1: medications[i].name,
              med2: medications[j].name,
              severity: interaction.severity,
              description: interaction.description,
              info: interaction.info,
              source: 'reference_database',
            });
          }
        }
      }
    }
  }

  // 2. Check OpenFDA labels for additional interactions not in offline DB
  try {
    for (let i = 0; i < medications.length; i++) {
      const mentionedDrugs = await getFDAInteractionDrugs(medications[i].name);

      for (let j = 0; j < medications.length; j++) {
        if (i === j) continue;
        const key = pairKey(medications[i].name, medications[j].name);
        if (foundPairs.has(key)) continue;

        const otherName = medications[j].name.toLowerCase();
        if (mentionedDrugs.some((d) => otherName.includes(d) || d.includes(otherName))) {
          foundPairs.add(key);
          interactions.push({
            med1: medications[i].name,
            med2: medications[j].name,
            severity: 'moderate',
            description: `FDA labeling for ${medications[i].name} mentions a potential interaction with ${medications[j].name}.`,
            info: 'Review the full drug label or ask your pharmacist for details about this interaction.',
            source: 'openfda',
          });
        }
      }
    }
  } catch (error) {
    console.error('OpenFDA interaction checking error:', error);
  }

  return interactions;
}

// ─── Allergy conflict checking ───────────────────────────────────────────────

export function checkAllergyConflicts(medications: Medication[], allergies: Allergy[]): AllergyConflict[] {
  const conflicts: AllergyConflict[] = [];
  for (const med of medications) {
    for (const allergy of allergies) {
      const medName = med.name.toLowerCase();
      const allergyName = allergy.name.toLowerCase();
      if (medName.includes(allergyName) || allergyName.includes(medName)) {
        conflicts.push({ medication: med.name, allergy: allergy.name });
      }
    }
  }
  return conflicts;
}

// ─── Refill reminder checking ────────────────────────────────────────────────

export function checkRefillReminders(medications: Medication[]): RefillStatus {
  const upcoming: RefillStatus['upcoming'] = [];
  const overdue: RefillStatus['overdue'] = [];

  for (const med of medications) {
    if (med.refillDate) {
      const daysUntil = Math.ceil((new Date(med.refillDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntil < 0) {
        overdue.push({ ...med, daysOverdue: Math.abs(daysUntil) });
      } else if (daysUntil <= 7) {
        upcoming.push({ ...med, daysUntil });
      }
    }
  }

  return { upcoming, overdue };
}
