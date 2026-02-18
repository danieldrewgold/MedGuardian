/**
 * Side effects service — combines a built-in database of common side effects
 * with parsed FDA adverse reaction data for comprehensive coverage.
 */

export interface SideEffect {
  name: string;
  frequency: 'very common' | 'common' | 'uncommon' | 'rare';
}

export interface SideEffectProfile {
  common: string[];     // >10% of patients
  lessCommon: string[]; // 1-10%
  rare: string[];       // <1% but notable
  serious: string[];    // seek medical attention
}

// ── Built-in database for commonly prescribed medications ──────────────
// Covers the most frequently prescribed drugs so side effects show instantly
// without waiting for FDA API. Names are lowercased for matching.

const SIDE_EFFECTS_DB: Record<string, SideEffectProfile> = {
  // ─── Blood Pressure / Heart ───
  lisinopril: {
    common: ['Dry cough', 'Dizziness', 'Headache', 'Fatigue'],
    lessCommon: ['Nausea', 'Diarrhea', 'Low blood pressure', 'Rash'],
    rare: ['Angioedema (face/lip swelling)', 'High potassium'],
    serious: ['Severe swelling of face/throat', 'Difficulty breathing', 'Chest pain'],
  },
  amlodipine: {
    common: ['Swelling in ankles/feet', 'Dizziness', 'Flushing', 'Fatigue'],
    lessCommon: ['Headache', 'Nausea', 'Palpitations', 'Drowsiness'],
    rare: ['Gum overgrowth', 'Mood changes'],
    serious: ['Severe dizziness', 'Rapid/irregular heartbeat', 'Fainting'],
  },
  losartan: {
    common: ['Dizziness', 'Fatigue', 'Nasal congestion'],
    lessCommon: ['Back pain', 'Diarrhea', 'Low blood pressure'],
    rare: ['High potassium', 'Kidney function changes'],
    serious: ['Severe dizziness/fainting', 'Signs of high potassium'],
  },
  metoprolol: {
    common: ['Fatigue', 'Dizziness', 'Slow heartbeat', 'Diarrhea'],
    lessCommon: ['Cold hands/feet', 'Depression', 'Shortness of breath', 'Weight gain'],
    rare: ['Wheezing', 'Vivid dreams', 'Hair loss'],
    serious: ['Very slow heartbeat', 'Severe dizziness', 'Difficulty breathing'],
  },
  atenolol: {
    common: ['Fatigue', 'Cold hands/feet', 'Slow heartbeat'],
    lessCommon: ['Dizziness', 'Depression', 'Nausea', 'Diarrhea'],
    rare: ['Wheezing', 'Dry eyes', 'Vivid dreams'],
    serious: ['Very slow heartbeat', 'Fainting', 'Difficulty breathing'],
  },
  hydrochlorothiazide: {
    common: ['Frequent urination', 'Dizziness', 'Lightheadedness'],
    lessCommon: ['Low potassium', 'Muscle cramps', 'Nausea', 'Increased blood sugar'],
    rare: ['Gout flare', 'Skin sensitivity to sun', 'Erectile dysfunction'],
    serious: ['Severe dehydration', 'Irregular heartbeat', 'Allergic reaction'],
  },

  // ─── Cholesterol ───
  atorvastatin: {
    common: ['Muscle aches', 'Joint pain', 'Diarrhea', 'Nausea'],
    lessCommon: ['Headache', 'Insomnia', 'Cold symptoms', 'Gas'],
    rare: ['Liver enzyme elevation', 'Memory issues', 'Increased blood sugar'],
    serious: ['Severe muscle pain/weakness (rhabdomyolysis)', 'Dark urine', 'Yellowing skin'],
  },
  simvastatin: {
    common: ['Muscle pain', 'Headache', 'Nausea'],
    lessCommon: ['Constipation', 'Stomach pain', 'Dizziness'],
    rare: ['Liver problems', 'Memory changes', 'Increased blood sugar'],
    serious: ['Severe muscle pain/weakness', 'Dark urine', 'Yellowing of eyes/skin'],
  },
  rosuvastatin: {
    common: ['Headache', 'Muscle pain', 'Nausea', 'Weakness'],
    lessCommon: ['Stomach pain', 'Constipation', 'Dizziness'],
    rare: ['Memory problems', 'Liver enzyme elevation'],
    serious: ['Severe muscle pain (rhabdomyolysis)', 'Dark urine', 'Jaundice'],
  },

  // ─── Diabetes ───
  metformin: {
    common: ['Nausea', 'Diarrhea', 'Stomach upset', 'Metallic taste'],
    lessCommon: ['Bloating', 'Gas', 'Loss of appetite', 'Headache'],
    rare: ['Vitamin B12 deficiency', 'Lactic acidosis'],
    serious: ['Severe nausea/vomiting', 'Muscle pain', 'Difficulty breathing', 'Unusual fatigue'],
  },
  glipizide: {
    common: ['Low blood sugar', 'Dizziness', 'Nausea', 'Diarrhea'],
    lessCommon: ['Headache', 'Weight gain', 'Skin rash'],
    rare: ['Liver problems', 'Blood disorders'],
    serious: ['Severe low blood sugar (confusion, seizures)', 'Yellowing skin'],
  },

  // ─── Pain / Anti-inflammatory ───
  ibuprofen: {
    common: ['Stomach upset', 'Nausea', 'Dizziness', 'Headache'],
    lessCommon: ['Heartburn', 'Bloating', 'Gas', 'Constipation'],
    rare: ['Stomach ulcer', 'Kidney problems', 'High blood pressure'],
    serious: ['Black/bloody stools', 'Vomiting blood', 'Chest pain', 'Severe stomach pain'],
  },
  naproxen: {
    common: ['Stomach upset', 'Nausea', 'Headache', 'Dizziness'],
    lessCommon: ['Heartburn', 'Drowsiness', 'Ringing in ears'],
    rare: ['Stomach ulcer', 'Kidney problems', 'Fluid retention'],
    serious: ['Black/bloody stools', 'Severe stomach pain', 'Chest pain'],
  },
  acetaminophen: {
    common: ['Nausea (at higher doses)'],
    lessCommon: ['Headache', 'Insomnia'],
    rare: ['Liver damage (with overuse)', 'Skin reaction'],
    serious: ['Severe allergic reaction', 'Signs of liver damage (dark urine, yellowing skin)'],
  },
  gabapentin: {
    common: ['Drowsiness', 'Dizziness', 'Fatigue', 'Unsteadiness'],
    lessCommon: ['Nausea', 'Blurred vision', 'Weight gain', 'Swelling'],
    rare: ['Mood changes', 'Depression', 'Memory issues'],
    serious: ['Severe dizziness', 'Difficulty breathing', 'Suicidal thoughts'],
  },
  pregabalin: {
    common: ['Dizziness', 'Drowsiness', 'Dry mouth', 'Swelling in hands/feet'],
    lessCommon: ['Weight gain', 'Blurred vision', 'Constipation', 'Difficulty concentrating'],
    rare: ['Mood changes', 'Muscle pain'],
    serious: ['Severe allergic reaction', 'Suicidal thoughts', 'Vision changes'],
  },

  // ─── Acid Reflux / GI ───
  omeprazole: {
    common: ['Headache', 'Stomach pain', 'Nausea', 'Diarrhea'],
    lessCommon: ['Gas', 'Constipation', 'Dizziness'],
    rare: ['Vitamin B12 deficiency', 'Magnesium deficiency', 'Bone fracture risk'],
    serious: ['Severe diarrhea (C. diff)', 'Kidney problems', 'Lupus-like symptoms'],
  },
  pantoprazole: {
    common: ['Headache', 'Diarrhea', 'Nausea', 'Stomach pain'],
    lessCommon: ['Gas', 'Dizziness', 'Joint pain'],
    rare: ['Low magnesium', 'Bone fracture risk', 'Vitamin deficiency'],
    serious: ['Severe diarrhea', 'Kidney problems', 'Allergic reaction'],
  },

  // ─── Antidepressants / Mental Health ───
  sertraline: {
    common: ['Nausea', 'Diarrhea', 'Insomnia', 'Drowsiness', 'Dry mouth'],
    lessCommon: ['Dizziness', 'Tremor', 'Decreased appetite', 'Sexual dysfunction', 'Sweating'],
    rare: ['Serotonin syndrome', 'Bleeding', 'Low sodium'],
    serious: ['Suicidal thoughts (especially in young adults)', 'Serotonin syndrome', 'Severe allergic reaction'],
  },
  fluoxetine: {
    common: ['Nausea', 'Headache', 'Insomnia', 'Drowsiness', 'Anxiety'],
    lessCommon: ['Tremor', 'Diarrhea', 'Dry mouth', 'Sexual dysfunction', 'Weight loss'],
    rare: ['Serotonin syndrome', 'Seizures', 'Low sodium'],
    serious: ['Suicidal thoughts', 'Serotonin syndrome', 'Severe allergic reaction'],
  },
  escitalopram: {
    common: ['Nausea', 'Insomnia', 'Drowsiness', 'Sweating', 'Fatigue'],
    lessCommon: ['Dry mouth', 'Dizziness', 'Sexual dysfunction', 'Diarrhea'],
    rare: ['Serotonin syndrome', 'Low sodium', 'Bleeding'],
    serious: ['Suicidal thoughts', 'Serotonin syndrome', 'QT prolongation'],
  },
  bupropion: {
    common: ['Dry mouth', 'Insomnia', 'Headache', 'Nausea', 'Agitation'],
    lessCommon: ['Dizziness', 'Tremor', 'Sweating', 'Weight loss', 'Constipation'],
    rare: ['Seizures', 'High blood pressure', 'Psychosis'],
    serious: ['Seizures', 'Severe allergic reaction', 'Suicidal thoughts'],
  },
  trazodone: {
    common: ['Drowsiness', 'Dizziness', 'Dry mouth', 'Nausea'],
    lessCommon: ['Headache', 'Blurred vision', 'Constipation', 'Fatigue'],
    rare: ['Priapism', 'Irregular heartbeat', 'Serotonin syndrome'],
    serious: ['Prolonged painful erection', 'Fainting', 'Suicidal thoughts'],
  },

  // ─── Anxiety / Sleep ───
  alprazolam: {
    common: ['Drowsiness', 'Dizziness', 'Fatigue', 'Memory impairment'],
    lessCommon: ['Slurred speech', 'Blurred vision', 'Appetite changes', 'Constipation'],
    rare: ['Paradoxical agitation', 'Depression'],
    serious: ['Severe drowsiness', 'Difficulty breathing', 'Dependence/withdrawal'],
  },
  lorazepam: {
    common: ['Drowsiness', 'Dizziness', 'Weakness', 'Unsteadiness'],
    lessCommon: ['Depression', 'Memory impairment', 'Nausea'],
    rare: ['Paradoxical reactions', 'Respiratory depression'],
    serious: ['Severe sedation', 'Difficulty breathing', 'Dependence/withdrawal'],
  },
  zolpidem: {
    common: ['Drowsiness', 'Dizziness', 'Headache', 'Diarrhea'],
    lessCommon: ['Memory problems', 'Nausea', 'Dry mouth'],
    rare: ['Sleepwalking', 'Sleep-driving', 'Complex sleep behaviors'],
    serious: ['Severe allergic reaction', 'Complex sleep behaviors', 'Dependence'],
  },

  // ─── Thyroid ───
  levothyroxine: {
    common: ['Headache', 'Insomnia', 'Nervousness (if dose too high)'],
    lessCommon: ['Tremor', 'Increased appetite', 'Weight loss', 'Sweating'],
    rare: ['Hair loss (temporary)', 'Chest pain', 'Irregular heartbeat'],
    serious: ['Chest pain', 'Rapid/irregular heartbeat', 'Signs of thyroid storm'],
  },

  // ─── Blood Thinners ───
  warfarin: {
    common: ['Bleeding (bruising easily)', 'Nausea'],
    lessCommon: ['Stomach pain', 'Bloating', 'Altered taste', 'Hair loss'],
    rare: ['Skin necrosis', 'Purple toe syndrome'],
    serious: ['Severe/uncontrollable bleeding', 'Blood in urine/stool', 'Coughing blood'],
  },
  apixaban: {
    common: ['Bruising', 'Minor bleeding (nosebleeds, gum bleeding)'],
    lessCommon: ['Nausea', 'Anemia', 'Rash'],
    rare: ['Spinal/epidural hematoma'],
    serious: ['Severe bleeding', 'Blood in urine/stool', 'Coughing blood'],
  },
  clopidogrel: {
    common: ['Bruising', 'Minor bleeding'],
    lessCommon: ['Stomach pain', 'Diarrhea', 'Indigestion', 'Headache'],
    rare: ['TTP (blood clotting disorder)', 'Liver problems'],
    serious: ['Severe bleeding', 'Black/bloody stools', 'Signs of TTP'],
  },

  // ─── Antibiotics ───
  amoxicillin: {
    common: ['Diarrhea', 'Nausea', 'Stomach upset', 'Rash'],
    lessCommon: ['Vomiting', 'Headache', 'Vaginal yeast infection'],
    rare: ['C. diff colitis', 'Liver problems', 'Seizures'],
    serious: ['Severe allergic reaction (anaphylaxis)', 'Severe diarrhea', 'Yellowing skin'],
  },
  azithromycin: {
    common: ['Diarrhea', 'Nausea', 'Stomach pain', 'Vomiting'],
    lessCommon: ['Headache', 'Dizziness', 'Rash'],
    rare: ['Liver problems', 'Hearing loss', 'Heart rhythm changes'],
    serious: ['Severe allergic reaction', 'QT prolongation', 'Liver failure'],
  },
  ciprofloxacin: {
    common: ['Nausea', 'Diarrhea', 'Dizziness', 'Headache'],
    lessCommon: ['Rash', 'Abdominal pain', 'Insomnia'],
    rare: ['Tendon rupture', 'Peripheral neuropathy', 'Aortic aneurysm'],
    serious: ['Tendon rupture/swelling', 'Nerve damage', 'Severe allergic reaction'],
  },

  // ─── Respiratory ───
  albuterol: {
    common: ['Tremor', 'Nervousness', 'Headache', 'Rapid heartbeat'],
    lessCommon: ['Dizziness', 'Throat irritation', 'Muscle cramps'],
    rare: ['Paradoxical bronchospasm', 'Low potassium'],
    serious: ['Chest pain', 'Irregular heartbeat', 'Worsening breathing'],
  },
  montelukast: {
    common: ['Headache', 'Stomach pain', 'Fatigue'],
    lessCommon: ['Dizziness', 'Cough', 'Dental pain', 'Rash'],
    rare: ['Mood changes', 'Depression', 'Suicidal thoughts'],
    serious: ['Neuropsychiatric events (agitation, depression, suicidal thoughts)', 'Severe allergic reaction'],
  },
  prednisone: {
    common: ['Increased appetite', 'Weight gain', 'Insomnia', 'Mood changes'],
    lessCommon: ['Stomach upset', 'Increased blood sugar', 'Acne', 'Fluid retention'],
    rare: ['Osteoporosis (long-term)', 'Cataracts', 'Adrenal suppression'],
    serious: ['Severe infection signs', 'Vision changes', 'Severe mood swings'],
  },

  // ─── Opioids ───
  tramadol: {
    common: ['Nausea', 'Dizziness', 'Constipation', 'Headache', 'Drowsiness'],
    lessCommon: ['Vomiting', 'Sweating', 'Dry mouth', 'Fatigue'],
    rare: ['Seizures', 'Serotonin syndrome', 'Respiratory depression'],
    serious: ['Seizures', 'Difficulty breathing', 'Serotonin syndrome', 'Dependence'],
  },
  oxycodone: {
    common: ['Constipation', 'Nausea', 'Drowsiness', 'Dizziness'],
    lessCommon: ['Vomiting', 'Headache', 'Itching', 'Dry mouth', 'Sweating'],
    rare: ['Respiratory depression', 'Adrenal insufficiency'],
    serious: ['Severe breathing problems', 'Severe constipation', 'Dependence/addiction'],
  },
  hydrocodone: {
    common: ['Constipation', 'Nausea', 'Drowsiness', 'Dizziness', 'Vomiting'],
    lessCommon: ['Headache', 'Fatigue', 'Stomach pain', 'Itching'],
    rare: ['Respiratory depression', 'Adrenal insufficiency'],
    serious: ['Severe breathing problems', 'Dependence/addiction', 'Severe allergic reaction'],
  },
};

// ── Lookup function ───────────────────────────────────────────────────

const sideEffectCache: Record<string, SideEffectProfile | null> = {};

/**
 * Get side effects for a medication.
 * First checks built-in database, falls back to parsing FDA adverse reactions text.
 */
export function getSideEffectsFromDB(medName: string): SideEffectProfile | null {
  const key = medName.toLowerCase().trim();

  // Direct match
  if (SIDE_EFFECTS_DB[key]) return SIDE_EFFECTS_DB[key];

  // Try matching first word (handles "Lisinopril 10mg" etc.)
  const firstWord = key.split(/\s+/)[0];
  if (SIDE_EFFECTS_DB[firstWord]) return SIDE_EFFECTS_DB[firstWord];

  // Try partial match (handles brand vs generic)
  for (const [dbKey, profile] of Object.entries(SIDE_EFFECTS_DB)) {
    if (key.includes(dbKey) || dbKey.includes(key)) {
      return profile;
    }
  }

  return null;
}

/**
 * Parse FDA adverse reactions text into a structured side effect profile.
 * FDA text is often messy — this extracts the most useful info.
 */
export function parseFDAAdverseReactions(text: string): SideEffectProfile | null {
  if (!text || text.length < 20) return null;

  const effects: string[] = [];

  // Common patterns in FDA text:
  // "The most common adverse reactions (≥5%) are X, Y, Z"
  // "Common side effects include X, Y, and Z"
  const commonPattern = /(?:most common|most frequent|commonly reported|common adverse|≥\s*\d+%)[^.]*?(?:include|are|were|:)\s*([^.]+)/gi;
  let match;
  while ((match = commonPattern.exec(text)) !== null) {
    const items = match[1]
      .split(/,|;|\band\b/)
      .map(s => s.replace(/\([^)]*\)/g, '').trim())
      .filter(s => s.length > 2 && s.length < 60 && !s.match(/^\d/));
    effects.push(...items);
  }

  // Also try to extract items from percentage patterns: "headache (15%)"
  const pctPattern = /([a-zA-Z][a-zA-Z\s/]+?)\s*\(\s*\d+\.?\d*\s*%/g;
  while ((match = pctPattern.exec(text)) !== null) {
    const item = match[1].trim();
    if (item.length > 2 && item.length < 50) {
      effects.push(item.charAt(0).toUpperCase() + item.slice(1));
    }
  }

  if (effects.length === 0) {
    // Last resort: look for bullet-like patterns
    const bulletPattern = /(?:^|\n)\s*[-•]\s*([A-Za-z][^,\n]{2,40})/g;
    while ((match = bulletPattern.exec(text)) !== null) {
      effects.push(match[1].trim());
    }
  }

  // Deduplicate
  const unique = [...new Set(effects.map(e => e.charAt(0).toUpperCase() + e.slice(1).toLowerCase()))];

  if (unique.length === 0) return null;

  return {
    common: unique.slice(0, 6),
    lessCommon: unique.slice(6, 12),
    rare: [],
    serious: [],
  };
}

/**
 * Get the best available side effects for a medication.
 * Prioritizes built-in database, falls back to FDA parsing.
 */
export function getSideEffects(
  medName: string,
  fdaAdverseReactions?: string
): SideEffectProfile | null {
  const cacheKey = medName.toLowerCase();
  if (cacheKey in sideEffectCache) return sideEffectCache[cacheKey];

  // Try built-in database first (instant, curated)
  const dbResult = getSideEffectsFromDB(medName);
  if (dbResult) {
    sideEffectCache[cacheKey] = dbResult;
    return dbResult;
  }

  // Fall back to parsing FDA text
  if (fdaAdverseReactions) {
    const parsed = parseFDAAdverseReactions(fdaAdverseReactions);
    sideEffectCache[cacheKey] = parsed;
    return parsed;
  }

  sideEffectCache[cacheKey] = null;
  return null;
}
