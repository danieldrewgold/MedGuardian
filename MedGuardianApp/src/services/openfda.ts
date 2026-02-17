// NDC barcode lookup
export interface NDCResult {
  name: string;
  dosage: string;
  manufacturer: string;
}

const ndcCache: Record<string, NDCResult | null> = {};

export async function lookupNDC(ndc: string): Promise<NDCResult | null> {
  // Normalize NDC — remove dashes, spaces
  const clean = ndc.replace(/[-\s]/g, '');
  if (clean in ndcCache) return ndcCache[clean];

  try {
    // Try openFDA product lookup by NDC
    const url = `https://api.fda.gov/drug/ndc.json?search=product_ndc:"${ndc}"+package_ndc:"${ndc}"&limit=1`;
    const response = await fetch(url);

    if (response.ok) {
      const data: any = await response.json();
      const product = data.results?.[0];
      if (product) {
        const name = product.generic_name || product.brand_name || '';
        const strengths = product.active_ingredients
          ?.map((i: any) => `${i.strength}`)
          .join(', ') || '';
        const result: NDCResult = {
          name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
          dosage: strengths,
          manufacturer: product.labeler_name || '',
        };
        ndcCache[clean] = result;
        return result;
      }
    }

    // Fallback: try openFDA drug label search by package_ndc
    const labelUrl = `https://api.fda.gov/drug/label.json?search=openfda.package_ndc:"${ndc}"&limit=1`;
    const labelResponse = await fetch(labelUrl);
    if (labelResponse.ok) {
      const labelData: any = await labelResponse.json();
      const label = labelData.results?.[0];
      if (label) {
        const openfda = label.openfda || {};
        const name = openfda.generic_name?.[0] || openfda.brand_name?.[0] || '';
        const result: NDCResult = {
          name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
          dosage: openfda.substance_name?.[0] || '',
          manufacturer: openfda.manufacturer_name?.[0] || '',
        };
        ndcCache[clean] = result;
        return result;
      }
    }

    ndcCache[clean] = null;
    return null;
  } catch {
    ndcCache[clean] = null;
    return null;
  }
}

export interface DrugLabelInfo {
  description: string;
  indicationsAndUsage: string;
  dosageAndAdministration: string;
  warnings: string;
  adverseReactions: string;
  drugInteractions: string;
}

const labelCache: Record<string, DrugLabelInfo | null> = {};

export async function fetchDrugLabel(drugName: string): Promise<DrugLabelInfo | null> {
  const key = drugName.toLowerCase();
  if (key in labelCache) return labelCache[key];

  try {
    const encoded = encodeURIComponent(drugName);
    const url = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encoded}"+openfda.brand_name:"${encoded}"&limit=1`;
    const response = await fetch(url);
    if (!response.ok) {
      labelCache[key] = null;
      return null;
    }

    const data: any = await response.json();
    const label = data.results?.[0];
    if (!label) {
      labelCache[key] = null;
      return null;
    }

    const info: DrugLabelInfo = {
      description: label.description?.[0] || '',
      indicationsAndUsage: label.indications_and_usage?.[0] || '',
      dosageAndAdministration: label.dosage_and_administration?.[0] || '',
      warnings: label.warnings?.[0] || label.warnings_and_cautions?.[0] || '',
      adverseReactions: label.adverse_reactions?.[0] || '',
      drugInteractions: label.drug_interactions?.[0] || '',
    };

    labelCache[key] = info;
    return info;
  } catch {
    labelCache[key] = null;
    return null;
  }
}
