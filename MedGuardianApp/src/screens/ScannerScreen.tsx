import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { scanBase64Image, ScanResult } from '../services/scanner';

interface ScannedMed {
  id: string;
  name: string;
  dosage: string;
  doctor: string;
  justUpdated: boolean; // for green dot indicator
}

/**
 * Merge a field: fill blanks, prefer longer/more detailed values.
 */
function mergeField(current: string, incoming: string): string {
  const c = current.trim();
  const i = incoming.trim();
  if (!c) return i;
  if (!i) return c;
  return i.length > c.length ? i : c;
}

/**
 * Check if two medication names likely refer to the same medication.
 */
function isSameMedication(name1: string, name2: string): boolean {
  const a = name1.toLowerCase().trim();
  const b = name2.toLowerCase().trim();
  if (!a || !b) return false;
  if (a === b) return true;
  // Substring match: "Lisinopril" matches "Lisinopril Tablets"
  if (a.includes(b) || b.includes(a)) return true;
  // First word match: "Lisinopril 10mg" first word matches "Lisinopril Tablets"
  const aFirst = a.split(/\s+/)[0];
  const bFirst = b.split(/\s+/)[0];
  if (aFirst.length >= 4 && aFirst === bFirst) return true;
  return false;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ScannerScreen({ navigation }: any) {
  const cameraRef = useRef<any>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [scannedMeds, setScannedMeds] = useState<ScannedMed[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);

  // Animations
  const borderFlash = useRef(new Animated.Value(0)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  // Request camera permission on mount
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        Alert.alert(
          'Permission Needed',
          'Camera access is required for live scanning. Please enable it in your device settings.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    })();
  }, []);

  // Pulsing scanning indicator
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Show toast notification
  const showToast = useCallback((message: string) => {
    setToast(message);
    toastOpacity.setValue(1);
    Animated.timing(toastOpacity, {
      toValue: 0,
      duration: 2500,
      delay: 1500,
      useNativeDriver: true,
    }).start(() => setToast(null));
  }, []);

  // Flash green border
  const flashGreen = useCallback(() => {
    borderFlash.setValue(1);
    Animated.timing(borderFlash, {
      toValue: 0,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, []);

  // Merge new scan results into accumulated list
  const mergeResults = useCallback((results: ScanResult[]) => {
    setScannedMeds((prev) => {
      let updated = [...prev.map((m) => ({ ...m, justUpdated: false }))];
      let newFinds: string[] = [];
      let updatedFinds: string[] = [];

      for (const result of results) {
        if (!result.name && !result.dosage) continue;

        // Find existing match
        const matchIndex = updated.findIndex(
          (m) => result.name && isSameMedication(m.name, result.name)
        );

        if (matchIndex >= 0) {
          // Merge into existing
          const existing = updated[matchIndex];
          const mergedName = mergeField(existing.name, result.name);
          const mergedDosage = mergeField(existing.dosage, result.dosage);
          const mergedDoctor = mergeField(existing.doctor, result.doctor);

          // Only mark as updated if something actually changed
          const changed =
            mergedName !== existing.name ||
            mergedDosage !== existing.dosage ||
            mergedDoctor !== existing.doctor;

          if (changed) {
            updated[matchIndex] = {
              ...existing,
              name: mergedName,
              dosage: mergedDosage,
              doctor: mergedDoctor,
              justUpdated: true,
            };
            updatedFinds.push(mergedName);
          }
        } else if (result.name) {
          // New medication
          updated.push({
            id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: result.name,
            dosage: result.dosage || '',
            doctor: result.doctor || '',
            justUpdated: true,
          });
          newFinds.push(result.name);
        } else if (updated.length === 1 && (result.dosage || result.doctor)) {
          // Single-bottle hint: no name found but we only have one med, assume same bottle
          const existing = updated[0];
          const mergedDosage = mergeField(existing.dosage, result.dosage || '');
          const mergedDoctor = mergeField(existing.doctor, result.doctor || '');
          const changed = mergedDosage !== existing.dosage || mergedDoctor !== existing.doctor;
          if (changed) {
            updated[0] = { ...existing, dosage: mergedDosage, doctor: mergedDoctor, justUpdated: true };
            updatedFinds.push(existing.name);
          }
        }
      }

      // Show toast for what happened
      if (newFinds.length > 0) {
        showToast(`Found: ${newFinds.join(', ')}`);
        flashGreen();
      } else if (updatedFinds.length > 0) {
        showToast(`Updated: ${updatedFinds.join(', ')}`);
        flashGreen();
      }

      return updated;
    });
  }, [showToast, flashGreen]);

  // Auto-capture loop
  useEffect(() => {
    if (!ready || hasPermission !== true) return;

    const captureFrame = async () => {
      if (analyzing || !cameraRef.current) return;

      setAnalyzing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: true,
          shutterSound: false,
        });

        if (photo?.base64) {
          // Pass context of known medications for smarter matching
          const knownNames = scannedMeds
            .filter((m) => m.name)
            .map((m) => `${m.name}${m.dosage ? ' ' + m.dosage : ''}`);

          const results = await scanBase64Image(photo.base64, knownNames.length > 0 ? knownNames : undefined);
          setScanCount((c) => c + 1);

          if (results.length > 0) {
            mergeResults(results);
          }
        }
      } catch (error: any) {
        // Silently handle errors during continuous scanning — don't interrupt the user
        console.log('Scan frame error:', error.message);
      } finally {
        setAnalyzing(false);
      }
    };

    // Start first capture after a short delay, then repeat
    const initialDelay = setTimeout(captureFrame, 1500);
    const interval = setInterval(captureFrame, 5000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [ready, hasPermission, analyzing, scannedMeds, mergeResults]);

  const handleDone = () => {
    if (scannedMeds.length === 0) {
      navigation.goBack();
      return;
    }
    // Pass scanned medications back to AddMedicationScreen
    navigation.navigate('AddMedication', {
      scannedMedications: scannedMeds.map((m) => ({
        name: m.name,
        dosage: m.dosage,
        doctor: m.doctor,
      })),
    });
  };

  const handleRemoveMed = (id: string) => {
    setScannedMeds((prev) => prev.filter((m) => m.id !== id));
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Photo library access is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets?.[0]?.base64) return;

      setAnalyzing(true);
      const knownNames = scannedMeds.filter((m) => m.name).map((m) => m.name);
      const results = await scanBase64Image(result.assets[0].base64, knownNames.length > 0 ? knownNames : undefined);
      setScanCount((c) => c + 1);
      if (results.length > 0) {
        mergeResults(results);
      } else {
        showToast('No medication info found in image');
      }
    } catch (error: any) {
      showToast('Could not scan image');
    } finally {
      setAnalyzing(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permText}>Camera permission denied</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const borderColor = borderFlash.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', '#48bb78'],
  });

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        onCameraReady={() => setReady(true)}
      />

      {/* Green flash border */}
      <Animated.View
        style={[styles.flashBorder, { borderColor }]}
        pointerEvents="none"
      />

      {/* Top bar: close + scanning indicator */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.closeBtnText}>X</Text>
        </TouchableOpacity>

        <View style={styles.scanIndicator}>
          <Animated.View style={[styles.scanDot, { opacity: pulseAnim }]} />
          <Text style={styles.scanIndicatorText}>
            {analyzing ? 'Analyzing...' : 'Scanning'}
          </Text>
          {scanCount > 0 && (
            <Text style={styles.scanCountText}> ({scanCount} frames)</Text>
          )}
        </View>
      </View>

      {/* Toast notification */}
      {toast && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}

      {/* Bottom overlay: results + actions */}
      <View style={styles.bottomOverlay}>
        {scannedMeds.length === 0 ? (
          <View style={styles.emptyOverlay}>
            <Text style={styles.emptyText}>Point camera at pill bottles</Text>
            <Text style={styles.emptySubtext}>Medications will appear here as they're detected</Text>
          </View>
        ) : (
          <ScrollView style={styles.resultsList} nestedScrollEnabled>
            {scannedMeds.map((med) => (
              <View key={med.id} style={styles.resultCard}>
                {med.justUpdated && <View style={styles.greenDot} />}
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName} numberOfLines={1}>
                    {med.name || 'Unknown'}
                    {med.dosage ? ` ${med.dosage}` : ''}
                  </Text>
                  {med.doctor ? (
                    <Text style={styles.resultDoctor} numberOfLines={1}>{med.doctor}</Text>
                  ) : (
                    <Text style={styles.resultNoDoctor}>No doctor info yet</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemoveMed(med.id)}
                >
                  <Text style={styles.removeBtnText}>x</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.galleryBtn} onPress={handlePickImage}>
            <Text style={styles.galleryBtnText}>From Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.doneBtn, scannedMeds.length === 0 && styles.doneBtnDisabled]}
            onPress={handleDone}
          >
            <Text style={styles.doneBtnText}>
              {scannedMeds.length === 0
                ? 'Cancel'
                : `Done (${scannedMeds.length} found)`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  flashBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 4,
    borderRadius: 0,
  },
  centered: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permText: { color: '#fff', fontSize: 16 },
  backBtn: {
    marginTop: 20,
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backBtnText: { color: '#fff', fontWeight: '600' },

  // Top bar
  topBar: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  scanIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  scanDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#48bb78',
    marginRight: 6,
  },
  scanIndicatorText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  scanCountText: { color: '#a0aec0', fontSize: 12 },

  // Toast
  toast: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(72, 187, 120, 0.9)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // Bottom overlay
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 34, // account for home indicator
    paddingHorizontal: 16,
    maxHeight: SCREEN_HEIGHT * 0.45,
  },
  emptyOverlay: { alignItems: 'center', paddingVertical: 16 },
  emptyText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptySubtext: { color: '#a0aec0', fontSize: 13, marginTop: 4 },

  // Results list
  resultsList: { maxHeight: SCREEN_HEIGHT * 0.22, marginBottom: 12 },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#48bb78',
    marginRight: 10,
  },
  resultInfo: { flex: 1 },
  resultName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  resultDoctor: { color: '#a0aec0', fontSize: 12, marginTop: 2 },
  resultNoDoctor: { color: '#718096', fontSize: 12, marginTop: 2, fontStyle: 'italic' },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  removeBtnText: { color: '#fc8181', fontSize: 16, fontWeight: '600' },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  galleryBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
  },
  galleryBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  doneBtn: {
    flex: 2,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#48bb78',
    alignItems: 'center',
  },
  doneBtnDisabled: {
    backgroundColor: '#667eea',
  },
  doneBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
