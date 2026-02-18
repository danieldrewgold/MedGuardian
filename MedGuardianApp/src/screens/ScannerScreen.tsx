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
import { CameraView, BarcodeScanningResult } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { scanBase64Image, ScanResult, identifyPills, PillIdResult } from '../services/scanner';
import { lookupNDC } from '../services/openfda';

type ScanMode = 'label' | 'pill';

interface ScannedMed {
  id: string;
  name: string;
  dosage: string;
  doctor: string;
  refillDate: string;
  justUpdated: boolean; // for green dot indicator
}

interface IdentifiedPill {
  id: string;
  name: string;
  brandName: string;
  dosage: string;
  imprint: string;
  shape: string;
  color: string;
  confidence: 'high' | 'medium' | 'low';
  description: string;
  fdaVerified?: boolean;
  manufacturer?: string;
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
  const scannedBarcodes = useRef<Set<string>>(new Set());
  const [barcodeLooking, setBarcodeLooking] = useState(false);

  // Pill ID mode state
  const [scanMode, setScanMode] = useState<ScanMode>('label');
  const [identifiedPills, setIdentifiedPills] = useState<IdentifiedPill[]>([]);
  const [pillAnalyzing, setPillAnalyzing] = useState(false);

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
        if (!result.name && !result.dosage && !result.doctor && !result.refillDate) continue;

        // Find existing match by name
        let matchIndex = -1;
        if (result.name) {
          matchIndex = updated.findIndex((m) => isSameMedication(m.name, result.name));
        }

        // If no name match but we have details (doctor, refill, dosage) and only one med exists,
        // attribute to that med — user is likely rotating the same bottle
        if (matchIndex < 0 && updated.length > 0 && (!result.name || result.name === '')) {
          // No name in scan but we have other info — assign to most recent or only med
          matchIndex = updated.length === 1 ? 0 : updated.length - 1;
        }

        // Even if there IS a name, if we only have 1 existing med, strongly prefer updating it
        // unless the names are clearly different (not just partial reads)
        if (matchIndex < 0 && updated.length === 1 && result.name) {
          const existing = updated[0];
          // If existing has no name yet, just adopt this one
          if (!existing.name) {
            matchIndex = 0;
          }
          // If both have names but they share a common word (>= 4 chars), treat as same
          else {
            const existingWords = existing.name.toLowerCase().split(/\s+/);
            const resultWords = result.name.toLowerCase().split(/\s+/);
            const hasCommon = existingWords.some(
              (w) => w.length >= 4 && resultWords.some((rw) => rw.length >= 4 && (w.includes(rw) || rw.includes(w)))
            );
            if (hasCommon) matchIndex = 0;
          }
        }

        if (matchIndex >= 0) {
          // Merge into existing
          const existing = updated[matchIndex];
          const mergedName = mergeField(existing.name, result.name || '');
          const mergedDosage = mergeField(existing.dosage, result.dosage || '');
          const mergedDoctor = mergeField(existing.doctor, result.doctor || '');
          const mergedRefill = mergeField(existing.refillDate, result.refillDate || '');

          const changed =
            mergedName !== existing.name ||
            mergedDosage !== existing.dosage ||
            mergedDoctor !== existing.doctor ||
            mergedRefill !== existing.refillDate;

          if (changed) {
            updated[matchIndex] = {
              ...existing,
              name: mergedName,
              dosage: mergedDosage,
              doctor: mergedDoctor,
              refillDate: mergedRefill,
              justUpdated: true,
            };
            updatedFinds.push(mergedName);
          }
        } else if (result.name) {
          // Genuinely new medication
          updated.push({
            id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: result.name,
            dosage: result.dosage || '',
            doctor: result.doctor || '',
            refillDate: result.refillDate || '',
            justUpdated: true,
          });
          newFinds.push(result.name);
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

  // Auto-capture loop (label mode only)
  useEffect(() => {
    if (!ready || hasPermission !== true || scanMode !== 'label') return;

    const captureFrame = async () => {
      if (analyzing || !cameraRef.current) return;

      setAnalyzing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.9,
          base64: true,
          shutterSound: false,
        });

        if (photo?.base64) {
          // Pass full context of known medications for smarter matching
          const knownMeds = scannedMeds
            .filter((m) => m.name)
            .map((m) => {
              let desc = m.name;
              if (m.dosage) desc += ` ${m.dosage}`;
              if (m.doctor) desc += ` (Dr. ${m.doctor})`;
              return desc;
            });

          const results = await scanBase64Image(photo.base64, knownMeds.length > 0 ? knownMeds : undefined);
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
  }, [ready, hasPermission, analyzing, scannedMeds, mergeResults, scanMode]);

  // Barcode scanning handler
  const handleBarcode = useCallback(async (scanResult: BarcodeScanningResult) => {
    const { data, type } = scanResult;
    if (!data || scannedBarcodes.current.has(data) || barcodeLooking) return;

    scannedBarcodes.current.add(data);
    setBarcodeLooking(true);
    showToast(`Barcode detected, looking up...`);

    try {
      const ndcResult = await lookupNDC(data);
      if (ndcResult && ndcResult.name) {
        mergeResults([{
          name: ndcResult.name,
          dosage: ndcResult.dosage,
          doctor: '',
          refillDate: '',
        }]);
      } else {
        showToast(`No drug found for barcode ${data}`);
        // Allow re-scan of this barcode since lookup failed
        scannedBarcodes.current.delete(data);
      }
    } catch {
      showToast('Barcode lookup failed');
      scannedBarcodes.current.delete(data);
    } finally {
      setBarcodeLooking(false);
    }
  }, [barcodeLooking, mergeResults, showToast]);

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
        refillDate: m.refillDate,
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
      const knownMeds = scannedMeds.filter((m) => m.name).map((m) => {
        let desc = m.name;
        if (m.dosage) desc += ` ${m.dosage}`;
        if (m.doctor) desc += ` (Dr. ${m.doctor})`;
        return desc;
      });
      const results = await scanBase64Image(result.assets[0].base64, knownMeds.length > 0 ? knownMeds : undefined);
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

  // ─── Pill ID handlers ────────────────────────────────────────────────────
  const handlePillCapture = async () => {
    if (pillAnalyzing || !cameraRef.current) return;

    setPillAnalyzing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1.0,
        base64: true,
        shutterSound: false,
      });

      if (photo?.base64) {
        const results = await identifyPills(photo.base64);
        if (results.length > 0) {
          const newPills: IdentifiedPill[] = results.map((r) => ({
            id: `pill-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: r.name || '',
            brandName: r.brandName || '',
            dosage: r.dosage || '',
            imprint: r.imprint || '',
            shape: r.shape || '',
            color: r.color || '',
            confidence: r.confidence || 'low',
            description: r.description || '',
            fdaVerified: r.fdaVerified,
            manufacturer: r.manufacturer,
          }));
          setIdentifiedPills((prev) => [...prev, ...newPills]);
          showToast(`Identified ${results.length} pill${results.length > 1 ? 's' : ''}`);
          flashGreen();
        } else {
          showToast('No pills found — get closer and use bright lighting');
        }
      }
    } catch (error: any) {
      showToast('Could not analyze pills');
      console.log('Pill ID error:', error.message);
    } finally {
      setPillAnalyzing(false);
    }
  };

  const handlePillPickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Photo library access is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1.0,
        base64: true,
      });

      if (result.canceled || !result.assets?.[0]?.base64) return;

      setPillAnalyzing(true);
      const results = await identifyPills(result.assets[0].base64);
      if (results.length > 0) {
        const newPills: IdentifiedPill[] = results.map((r) => ({
          id: `pill-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: r.name || '',
          brandName: r.brandName || '',
          dosage: r.dosage || '',
          imprint: r.imprint || '',
          shape: r.shape || '',
          color: r.color || '',
          confidence: r.confidence || 'low',
          description: r.description || '',
          fdaVerified: r.fdaVerified,
          manufacturer: r.manufacturer,
        }));
        setIdentifiedPills((prev) => [...prev, ...newPills]);
        showToast(`Identified ${results.length} pill${results.length > 1 ? 's' : ''}`);
        flashGreen();
      } else {
        showToast('No pills identified in image');
      }
    } catch (error: any) {
      showToast('Could not analyze image');
    } finally {
      setPillAnalyzing(false);
    }
  };

  const handleRemovePill = (id: string) => {
    setIdentifiedPills((prev) => prev.filter((p) => p.id !== id));
  };

  const handlePillDone = () => {
    if (identifiedPills.length === 0) {
      navigation.goBack();
      return;
    }
    // Convert identified pills to scanned medications format and pass to AddMedicationScreen
    navigation.navigate('AddMedication', {
      scannedMedications: identifiedPills.map((p) => ({
        name: p.name,
        dosage: p.dosage,
        doctor: '',
        refillDate: '',
      })),
    });
  };

  const confidenceColor = (c: string) => {
    switch (c) {
      case 'high': return '#48bb78';
      case 'medium': return '#ecc94b';
      case 'low': return '#fc8181';
      default: return '#a0aec0';
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
        barcodeScannerSettings={scanMode === 'label' ? {
          barcodeTypes: ['upc_a', 'upc_e', 'ean13', 'ean8', 'code128', 'datamatrix'],
        } : undefined}
        onBarcodeScanned={scanMode === 'label' ? handleBarcode : undefined}
      />

      {/* Green flash border */}
      <Animated.View
        style={[styles.flashBorder, { borderColor }]}
        pointerEvents="none"
      />

      {/* Top bar: close + mode toggle + indicator */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.closeBtnText}>X</Text>
        </TouchableOpacity>

        {/* Mode toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, scanMode === 'label' && styles.modeBtnActive]}
            onPress={() => setScanMode('label')}
          >
            <Text style={[styles.modeBtnText, scanMode === 'label' && styles.modeBtnTextActive]}>
              Label
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, scanMode === 'pill' && styles.modeBtnActivePill]}
            onPress={() => setScanMode('pill')}
          >
            <Text style={[styles.modeBtnText, scanMode === 'pill' && styles.modeBtnTextActive]}>
              Pill ID
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scanIndicator}>
          <Animated.View style={[styles.scanDot, { opacity: pulseAnim }]} />
          <Text style={styles.scanIndicatorText}>
            {scanMode === 'pill'
              ? (pillAnalyzing ? 'Analyzing...' : 'Ready')
              : (analyzing ? 'Analyzing...' : 'Scanning')}
          </Text>
          {scanMode === 'label' && scanCount > 0 && (
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

      {/* Pill ID: capture button overlay in center */}
      {scanMode === 'pill' && !pillAnalyzing && (
        <View style={styles.pillCaptureOverlay}>
          <TouchableOpacity style={styles.pillCaptureBtn} onPress={handlePillCapture}>
            <View style={styles.pillCaptureBtnInner} />
          </TouchableOpacity>
          <Text style={styles.pillCaptureHint}>Get close, then tap to capture</Text>
        </View>
      )}

      {scanMode === 'pill' && pillAnalyzing && (
        <View style={styles.pillCaptureOverlay}>
          <View style={styles.pillAnalyzingBox}>
            <Text style={styles.pillAnalyzingText}>Analyzing pills...</Text>
            <Text style={styles.pillAnalyzingSubtext}>Checking imprints, shape & color</Text>
          </View>
        </View>
      )}

      {/* Bottom overlay: results + actions */}
      <View style={styles.bottomOverlay}>
        {scanMode === 'label' ? (
          <>
            {scannedMeds.length === 0 ? (
              <View style={styles.emptyOverlay}>
                <Text style={styles.emptyText}>Point camera at pill bottles</Text>
                <Text style={styles.emptySubtext}>Scan labels or barcodes — medications appear as detected</Text>
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
                        <Text style={styles.resultDoctor} numberOfLines={1}>Dr. {med.doctor}</Text>
                      ) : (
                        <Text style={styles.resultNoDoctor}>Rotate bottle to capture doctor</Text>
                      )}
                      {med.refillDate ? (
                        <Text style={styles.resultDoctor} numberOfLines={1}>Refill: {med.refillDate}</Text>
                      ) : null}
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

            {/* Label mode action buttons */}
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
          </>
        ) : (
          <>
            {/* Pill ID mode results */}
            {identifiedPills.length === 0 ? (
              <View style={styles.emptyOverlay}>
                <Text style={styles.emptyText}>Identify pills by photo</Text>
                <Text style={styles.emptySubtext}>
                  Place pills on a dark, flat surface{'\n'}Get close — fill the frame with the pill{'\n'}Good lighting helps read imprint codes
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.resultsList} nestedScrollEnabled>
                {identifiedPills.map((pill) => (
                  <View key={pill.id} style={styles.pillResultCard}>
                    <View style={styles.resultInfo}>
                      <View style={styles.pillResultHeader}>
                        <Text style={styles.resultName} numberOfLines={1}>
                          {pill.name || 'Unknown pill'}
                          {pill.dosage ? ` ${pill.dosage}` : ''}
                        </Text>
                        <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor(pill.confidence) }]}>
                          <Text style={styles.confidenceText}>{pill.confidence}</Text>
                        </View>
                      </View>
                      {pill.brandName ? (
                        <Text style={styles.resultDoctor} numberOfLines={1}>Brand: {pill.brandName}</Text>
                      ) : null}
                      <Text style={styles.pillDetails} numberOfLines={1}>
                        {[pill.color, pill.shape, pill.imprint ? `"${pill.imprint}"` : ''].filter(Boolean).join(' · ')}
                      </Text>
                      {pill.description ? (
                        <Text style={styles.pillDescription} numberOfLines={2}>{pill.description}</Text>
                      ) : null}
                      {pill.fdaVerified && (
                        <Text style={styles.pillFdaVerified}>FDA verified</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => handleRemovePill(pill.id)}
                    >
                      <Text style={styles.removeBtnText}>x</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Pill ID mode action buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.galleryBtn} onPress={handlePillPickImage}>
                <Text style={styles.galleryBtnText}>From Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.doneBtn, identifiedPills.length === 0 && styles.doneBtnDisabled]}
                onPress={handlePillDone}
              >
                <Text style={styles.doneBtnText}>
                  {identifiedPills.length === 0
                    ? 'Cancel'
                    : `Add ${identifiedPills.length} to Meds`}
                </Text>
              </TouchableOpacity>
            </View>

            {identifiedPills.length > 0 && (
              <Text style={styles.pillDisclaimer}>
                Visual pill identification is approximate. Always verify with your pharmacist.
              </Text>
            )}
          </>
        )}
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

  // Mode toggle
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    padding: 2,
  },
  modeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  modeBtnActive: {
    backgroundColor: '#48bb78',
  },
  modeBtnActivePill: {
    backgroundColor: '#667eea',
  },
  modeBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '600',
  },
  modeBtnTextActive: {
    color: '#fff',
  },

  // Pill capture button
  pillCaptureOverlay: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pillCaptureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillCaptureBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  pillCaptureHint: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  pillAnalyzingBox: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
  },
  pillAnalyzingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  pillAnalyzingSubtext: {
    color: '#a0aec0',
    fontSize: 13,
    marginTop: 4,
  },

  // Pill result cards
  pillResultCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  pillResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  confidenceBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  confidenceText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pillDetails: {
    color: '#a0aec0',
    fontSize: 12,
    marginTop: 2,
  },
  pillDescription: {
    color: '#cbd5e0',
    fontSize: 11,
    marginTop: 3,
    fontStyle: 'italic',
  },
  pillFdaVerified: {
    color: '#48bb78',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
    textTransform: 'uppercase',
  },
  pillDisclaimer: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
});
