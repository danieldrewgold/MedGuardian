import { File } from 'expo-file-system';
import { API_URL } from '../config';

interface ScanResult {
  name: string;
  dosage: string;
  doctor: string;
}

export async function extractMedicationFromImage(imageUri: string): Promise<ScanResult | null> {
  try {
    // Convert image to base64
    const file = new File(imageUri);
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    // Send to our backend proxy
    const response = await fetch(`${API_URL}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64 }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Server error (${response.status})` }));
      throw new Error(errorData.error || `Server error (${response.status})`);
    }

    const result: ScanResult = await response.json();
    if (result.name || result.dosage || result.doctor) return result;

    throw new Error('Could not extract medication info from image');
  } catch (error: any) {
    console.error('Scan error:', error);
    throw error;
  }
}
