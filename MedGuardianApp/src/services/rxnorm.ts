/**
 * Drug and allergy autocomplete using NLM Clinical Tables API (prefix search)
 * and RxNorm spelling suggestions (fuzzy/typo handling).
 * Both are public NIH APIs — no key required.
 */

/** Strip form info like "(Oral Pill)" and title-case ALL CAPS names */
function cleanDrugName(display: string): string {
  let name = display.replace(/\s*\(.*?\)\s*$/, '').trim();
  // API returns brand names in ALL CAPS (e.g. "TYLENOL") — convert to Title Case
  if (name === name.toUpperCase() && name.length > 1) {
    name = name.split(/[\s-]+/).map((w) => {
      if (w.length <= 2) return w; // keep "XR", "XL", "CR" etc uppercase
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(' ');
  }
  return name;
}

/** Common brand name → generic name mapping for instant local matching */
const BRAND_TO_GENERIC: Record<string, string> = {
  'tylenol': 'Acetaminophen',
  'advil': 'Ibuprofen',
  'motrin': 'Ibuprofen',
  'aleve': 'Naproxen',
  'lipitor': 'Atorvastatin',
  'crestor': 'Rosuvastatin',
  'zocor': 'Simvastatin',
  'norvasc': 'Amlodipine',
  'prinivil': 'Lisinopril',
  'zestril': 'Lisinopril',
  'glucophage': 'Metformin',
  'coumadin': 'Warfarin',
  'xanax': 'Alprazolam',
  'valium': 'Diazepam',
  'ativan': 'Lorazepam',
  'ambien': 'Zolpidem',
  'synthroid': 'Levothyroxine',
  'levoxyl': 'Levothyroxine',
  'nexium': 'Esomeprazole',
  'prilosec': 'Omeprazole',
  'protonix': 'Pantoprazole',
  'zoloft': 'Sertraline',
  'lexapro': 'Escitalopram',
  'prozac': 'Fluoxetine',
  'cymbalta': 'Duloxetine',
  'plavix': 'Clopidogrel',
  'eliquis': 'Apixaban',
  'xarelto': 'Rivaroxaban',
  'lasix': 'Furosemide',
  'toprol': 'Metoprolol',
  'lopressor': 'Metoprolol',
  'tenormin': 'Atenolol',
  'diovan': 'Valsartan',
  'cozaar': 'Losartan',
  'hyzaar': 'Losartan/HCTZ',
  'januvia': 'Sitagliptin',
  'jardiance': 'Empagliflozin',
  'ozempic': 'Semaglutide',
  'trulicity': 'Dulaglutide',
  'humira': 'Adalimumab',
  'viagra': 'Sildenafil',
  'cialis': 'Tadalafil',
  'adderall': 'Amphetamine/Dextroamphetamine',
  'concerta': 'Methylphenidate',
  'ritalin': 'Methylphenidate',
  'vicodin': 'Hydrocodone/Acetaminophen',
  'percocet': 'Oxycodone/Acetaminophen',
  'oxycontin': 'Oxycodone',
  'lyrica': 'Pregabalin',
  'neurontin': 'Gabapentin',
  'singulair': 'Montelukast',
  'ventolin': 'Albuterol',
  'proair': 'Albuterol',
  'flovent': 'Fluticasone',
  'flonase': 'Fluticasone',
  'zyrtec': 'Cetirizine',
  'claritin': 'Loratadine',
  'benadryl': 'Diphenhydramine',
  'pepcid': 'Famotidine',
  'zantac': 'Ranitidine',
  'rogaine': 'Minoxidil',
  'loniten': 'Minoxidil',
  'prednisone': 'Prednisone',
  'medrol': 'Methylprednisolone',
  'augmentin': 'Amoxicillin/Clavulanate',
  'keflex': 'Cephalexin',
  'cipro': 'Ciprofloxacin',
  'levaquin': 'Levofloxacin',
  'zithromax': 'Azithromycin',
  'z-pack': 'Azithromycin',
};

export async function fetchDrugSuggestions(query: string): Promise<string[]> {
  try {
    const encoded = encodeURIComponent(query);
    const lower = query.toLowerCase().trim();

    // Check if the query matches a known brand name — show generic equivalent first
    const seen = new Set<string>();
    const merged: string[] = [];

    const addUnique = (name: string) => {
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(name);
      }
    };

    // If it's a known brand name, add the generic equivalent first
    const genericMatch = BRAND_TO_GENERIC[lower];
    if (genericMatch) {
      addUnique(`${genericMatch} (${query.charAt(0).toUpperCase() + query.slice(1).toLowerCase()})`);
      addUnique(genericMatch);
    }

    // Also check partial brand name matches
    for (const [brand, generic] of Object.entries(BRAND_TO_GENERIC)) {
      if (brand.startsWith(lower) && brand !== lower) {
        const brandTitle = brand.charAt(0).toUpperCase() + brand.slice(1);
        addUnique(`${generic} (${brandTitle})`);
      }
    }

    // Clinical Tables API + spelling suggestions
    const [autoRes, spellRes] = await Promise.all([
      fetch(
        `https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=${encoded}&ef=DISPLAY_NAME&maxList=10`
      ),
      fetch(
        `https://rxnav.nlm.nih.gov/REST/spellingsuggestions.json?name=${encoded}`
      ),
    ]);

    // Clinical Tables results
    if (autoRes.ok) {
      const data: any = await autoRes.json();
      const displayNames: string[] = data[1] || [];
      for (const d of displayNames) {
        addUnique(cleanDrugName(d));
      }
    }

    // Spelling suggestions for typo handling
    if (spellRes.ok) {
      const data: any = await spellRes.json();
      const suggestions: string[] = data.suggestionGroup?.suggestionList?.suggestion || [];
      for (const name of suggestions) addUnique(name);
    }

    return merged.slice(0, 10);
  } catch {
    return [];
  }
}

export async function fetchAllergySuggestions(query: string): Promise<string[]> {
  try {
    const encoded = encodeURIComponent(query);
    const [autoRes, spellRes] = await Promise.all([
      fetch(
        `https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=${encoded}&ef=DISPLAY_NAME&maxList=6`
      ),
      fetch(
        `https://rxnav.nlm.nih.gov/REST/spellingsuggestions.json?name=${encoded}`
      ),
    ]);

    const seen = new Set<string>();
    const merged: string[] = [];

    const addUnique = (name: string) => {
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(name);
      }
    };

    if (autoRes.ok) {
      const data: any = await autoRes.json();
      const displayNames: string[] = data[1] || [];
      for (const d of displayNames) addUnique(cleanDrugName(d));
    }

    if (spellRes.ok) {
      const data: any = await spellRes.json();
      const suggestions: string[] = data.suggestionGroup?.suggestionList?.suggestion || [];
      for (const name of suggestions) addUnique(name);
    }

    return merged.slice(0, 6);
  } catch {
    return [];
  }
}

/**
 * Resolve a drug name to its generic equivalent.
 * If it's a known brand name, returns the generic.
 * Also handles "Generic (Brand)" format from autocomplete.
 * Returns the original name if no match found.
 */
export function resolveGenericName(name: string): string {
  // Handle "Acetaminophen (Tylenol)" format — extract just the generic part
  const parenMatch = name.match(/^(.+?)\s*\(.*\)$/);
  if (parenMatch) return parenMatch[1].trim();

  const lower = name.toLowerCase().trim();
  return BRAND_TO_GENERIC[lower] || name;
}

export const COMMON_ALLERGENS = [
  'Amoxicillin',
  'Penicillin',
  'Sulfa / Sulfonamide',
  'Cephalosporin',
  'Aspirin',
  'NSAIDs',
  'Codeine',
  'Opioids',
  'Tetracycline',
  'Fluoroquinolone',
  'Macrolide',
  'Erythromycin',
  'Latex',
  'Iodine',
  'Contrast dye',
  'ACE Inhibitor',
  'Statin',
  'Benzodiazepine',
  'SSRI',
  'Beta Blocker',
];
