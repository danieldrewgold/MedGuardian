import Constants from 'expo-constants';

/**
 * Auto-detect the scanner server URL.
 * In development, expo-constants gives us the dev machine's IP via debuggerHost.
 * The scanner server runs on port 3000 on that same machine.
 * In production, set EXPO_PUBLIC_API_URL in your environment or replace the fallback.
 */
function getApiUrl(): string {
  // Allow explicit override
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // In dev, extract the host IP from Expo's debugger connection
  if (__DEV__) {
    const debuggerHost =
      Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
    if (debuggerHost) {
      const host = debuggerHost.split(':')[0]; // strip the Expo port
      return `http://${host}:3000`;
    }
  }

  // Production server on Railway
  return 'https://medguardian-production.up.railway.app';
}

export const API_URL = getApiUrl();

// API secret — must match the server's APP_SECRET env var
export const API_SECRET = 'mg_s3cur3_k8x2pQ7vR4wL9mN1bZ';

/** Standard headers for all API requests */
export const apiHeaders = {
  'Content-Type': 'application/json',
  'x-app-secret': API_SECRET,
};
