import { File } from 'expo-file-system';
import { API_URL } from '../config';

export interface ScanResult {
  name: string;
  dosage: string;
  doctor: string;
}

/**
 * Parse the server response into validated ScanResult array.
 */
function parseResponse(data: any): ScanResult[] {
  if (data.medications && Array.isArray(data.medications)) {
    const valid = data.medications.filter(
      (item: any) => item.name || item.dosage
    );
    if (valid.length > 0) return valid;
  }
  return [];
}

/**
 * Scans a pill bottle image from a file URI.
 * Used for gallery picks where we have a file path.
 */
export async function extractMedicationsFromImage(imageUri: string): Promise<ScanResult[]> {
  try {
    const file = new File(imageUri);
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    return await scanBase64Image(base64);
  } catch (error: any) {
    console.error('Scan error:', error);
    throw error;
  }
}

/**
 * Scans a base64-encoded image directly.
 * Used by the live scanner (CameraView takePictureAsync returns base64).
 * Optionally passes context of already-found medications for smarter matching.
 */
export async function scanBase64Image(
  base64: string,
  knownMedications?: string[]
): Promise<ScanResult[]> {
  const body: any = { image: base64 };
  if (knownMedications && knownMedications.length > 0) {
    body.context = knownMedications;
  }

  const response = await fetch(`${API_URL}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: `Server error (${response.status})` }));
    throw new Error(errorData.error || `Server error (${response.status})`);
  }

  const data: any = await response.json();
  return parseResponse(data);
}
