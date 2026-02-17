import { CriticalInteraction, Medication, Interaction, Allergy, AllergyConflict, RefillStatus } from '../types';

export const CRITICAL_INTERACTIONS: CriticalInteraction[] = [
  {
    drug1: 'warfarin',
    drug2: 'aspirin',
    severity: 'major',
    description: 'These medications may increase bleeding risk when taken together.',
    info: 'Consult your healthcare provider or pharmacist about taking these medications together.',
  },
  {
    drug1: 'lisinopril',
    drug2: 'spironolactone',
    severity: 'major',
    description: 'These medications may increase potassium levels, which could affect heart function.',
    info: 'Your healthcare provider should monitor potassium levels if taking both medications.',
  },
  {
    drug1: 'metformin',
    drug2: 'contrast dye',
    severity: 'major',
    description: 'Metformin may need to be stopped before procedures involving contrast dye.',
    info: 'Inform your doctor and radiologist if you take metformin before imaging procedures.',
  },
  {
    drug1: 'warfarin',
    drug2: 'nsaid',
    severity: 'moderate',
    description: 'NSAIDs (ibuprofen, naproxen) may increase bleeding risk with warfarin.',
    info: 'Discuss pain relief options with your healthcare provider.',
  },
  {
    drug1: 'lisinopril',
    drug2: 'ibuprofen',
    severity: 'moderate',
    description: 'NSAIDs may reduce effectiveness of blood pressure medications.',
    info: 'Ask your pharmacist about alternative pain relievers.',
  },
  {
    drug1: 'metformin',
    drug2: 'alcohol',
    severity: 'moderate',
    description: 'Alcohol may increase certain risks when combined with metformin.',
    info: 'Discuss alcohol consumption with your healthcare provider.',
  },
  {
    drug1: 'simvastatin',
    drug2: 'amlodipine',
    severity: 'moderate',
    description: 'Amlodipine may increase simvastatin levels in the body.',
    info: 'Your doctor may adjust dosages. Report any unusual muscle pain or weakness.',
  },
  {
    drug1: 'digoxin',
    drug2: 'furosemide',
    severity: 'moderate',
    description: 'These medications may affect potassium levels when taken together.',
    info: 'Your healthcare provider may monitor potassium levels regularly.',
  },
];

const rxnormCache: Record<string, string> = {};

export async function getRxCUI(drugName: string): Promise<string | null> {
  const key = drugName.toLowerCase();
  if (rxnormCache[key]) return rxnormCache[key];

  try {
    const url = `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(drugName)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.drugGroup?.conceptGroup) {
      for (const group of data.drugGroup.conceptGroup) {
        if (group.conceptProperties?.length > 0) {
          const rxcui = group.conceptProperties[0].rxcui;
          rxnormCache[key] = rxcui;
          return rxcui;
        }
      }
    }
  } catch (error) {
    console.error('RxNorm lookup error for', drugName, ':', error);
  }
  return null;
}

export async function checkRxNormInteractions(rxcui1: string, rxcui2: string): Promise<{ description: string; severity: string }[]> {
  try {
    const url = `https://rxnav.nlm.nih.gov/REST/interaction/interaction.json?rxcui=${rxcui1}&sources=DrugBank`;
    const response = await fetch(url);
    const data = await response.json();
    const interactions: { description: string; severity: string }[] = [];

    if (data.interactionTypeGroup) {
      for (const typeGroup of data.interactionTypeGroup) {
        if (typeGroup.interactionType) {
          for (const type of typeGroup.interactionType) {
            if (type.interactionPair) {
              for (const pair of type.interactionPair) {
                if (pair.interactionConcept) {
                  for (const concept of pair.interactionConcept) {
                    if (concept.minConceptItem?.rxcui === rxcui2) {
                      interactions.push({
                        description: pair.description || 'Interaction detected',
                        severity: pair.severity || 'moderate',
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return interactions;
  } catch (error) {
    console.error('RxNorm interaction check error:', error);
    return [];
  }
}

export async function checkInteractions(medications: Medication[]): Promise<Interaction[]> {
  const interactions: Interaction[] = [];

  // Check local critical list
  for (let i = 0; i < medications.length; i++) {
    for (let j = i + 1; j < medications.length; j++) {
      const name1 = medications[i].name.toLowerCase();
      const name2 = medications[j].name.toLowerCase();

      for (const interaction of CRITICAL_INTERACTIONS) {
        const match1 = name1.includes(interaction.drug1) && name2.includes(interaction.drug2);
        const match2 = name1.includes(interaction.drug2) && name2.includes(interaction.drug1);
        if (match1 || match2) {
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

  // Check RxNorm API
  try {
    for (let i = 0; i < medications.length; i++) {
      for (let j = i + 1; j < medications.length; j++) {
        const alreadyFound = interactions.some(
          (int) =>
            (int.med1 === medications[i].name && int.med2 === medications[j].name) ||
            (int.med1 === medications[j].name && int.med2 === medications[i].name)
        );
        if (alreadyFound) continue;

        const rxcui1 = await getRxCUI(medications[i].name);
        const rxcui2 = await getRxCUI(medications[j].name);

        if (rxcui1 && rxcui2) {
          const rxnormInteractions = await checkRxNormInteractions(rxcui1, rxcui2);
          for (const rxInt of rxnormInteractions) {
            interactions.push({
              med1: medications[i].name,
              med2: medications[j].name,
              severity: rxInt.severity === 'high' ? 'major' : 'moderate',
              description: rxInt.description,
              info: 'Consult your healthcare provider or pharmacist for more information about this interaction.',
              source: 'rxnorm',
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('RxNorm interaction checking error:', error);
  }

  return interactions;
}

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
