import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';

// Optional Firebase sync helper
let firebaseApp: any = null;
let db: any = null;

try {
  // Check if runtime config is dynamically passed or imported
  const configStr = localStorage.getItem('padarias_firebase_config');
  if (configStr) {
    const firebaseConfig = JSON.parse(configStr);
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(firebaseApp);
  }
} catch (err) {
  console.log('Firebase init skipped or unconfigured, running in local-first storage mode.');
}

export function isFirebaseConfigured(): boolean {
  return db !== null;
}

export function configureFirebaseCredentials(configObj: object): boolean {
  try {
    localStorage.setItem('padarias_firebase_config', JSON.stringify(configObj));
    firebaseApp = getApps().length === 0 ? initializeApp(configObj) : getApp();
    db = getFirestore(firebaseApp);
    return true;
  } catch (e) {
    console.error('Failed to configure Firebase:', e);
    return false;
  }
}

export function clearFirebaseCredentials(): void {
  localStorage.removeItem('padarias_firebase_config');
  firebaseApp = null;
  db = null;
}
