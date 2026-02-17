/**
 * Drug and allergy autocomplete using NLM Clinical Tables API (prefix search)
 * and RxNorm spelling suggestions (fuzzy/typo handling).
 * Both are public NIH APIs — no key required.
 */

/** Strip form info like "(Oral Pill)" and extract just the drug name */
function cleanDrugName(display: string): string {
  return display.replace(/\s*\(.*?\)\s*$/, '').trim();
}

export async function fetchDrugSuggestions(query: string): Promise<string[]> {
  try {
    const encoded = encodeURIComponent(query);
    // Clinical Tables API: excellent prefix autocomplete
    // Spelling suggestions: handles typos/misspellings
    const [autoRes, spellRes] = await Promise.all([
      fetch(
        `https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=${encoded}&ef=DISPLAY_NAME&maxList=10`
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

    // Clinical Tables results first — these are the best prefix matches
    if (autoRes.ok) {
      const data: any = await autoRes.json();
      // Response format: [count, [names...], {DISPLAY_NAME: [...]}, [[...]...]]
      const displayNames: string[] = data[1] || [];
      for (const d of displayNames) {
        addUnique(cleanDrugName(d));
      }
    }

    // Then spelling suggestions for typo handling
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
