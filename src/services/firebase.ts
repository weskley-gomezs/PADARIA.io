import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setLogLevel } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const DEFAULT_FIREBASE_CONFIG = {
  projectId: "gen-lang-client-0055764381",
  appId: "1:963456290796:web:55867b22f11d2ad646bac9",
  apiKey: "AIzaSyB3mjERkgW_aAyAny_hfESGl6DlivVC8gc",
  authDomain: "gen-lang-client-0055764381.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-padariaio-05de0e5c-f467-434d-8538-8f91ddb8777f",
  storageBucket: "gen-lang-client-0055764381.firebasestorage.app",
  messagingSenderId: "963456290796",
  measurementId: "",
  oAuthClientId: "963456290796-bd4mkf5navg98sa16r4psba0826hgn8u.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

function getFirebaseConfig() {
  let config = DEFAULT_FIREBASE_CONFIG;
  if (typeof window === 'undefined') {
    try {
      const possiblePaths = [
        path.join(process.cwd(), 'firebase-applet-config.json'),
        path.join(process.cwd(), 'api', '..', 'firebase-applet-config.json'),
        '/var/task/firebase-applet-config.json',
      ];
      for (const p of possiblePaths) {
        if (fs && fs.existsSync && fs.existsSync(p)) {
          const content = fs.readFileSync(p, 'utf8');
          config = JSON.parse(content);
          break;
        }
      }
    } catch (err) {
      console.warn('[FIREBASE] Fallback to default firebase config:', err);
    }
  }
  return config;
}

const firebaseConfig = getFirebaseConfig();
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// CRITICAL: Must include firestoreDatabaseId parameter
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Silence non-fatal internal warnings like BloomFilter
setLogLevel('error');

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDoc(doc(db, 'settings', 'connection_check'));
    return true;
  } catch (error) {
    console.warn('Firestore connection check status:', error);
    return false;
  }
}


