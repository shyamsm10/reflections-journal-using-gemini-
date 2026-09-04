import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot,
  getDocs,
  serverTimestamp,
  Timestamp,
  Firestore
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';
import { JournalEntry, UserProfile } from '../types';

const defaultKey = 'AIzaSyAIeRxNrPVIrEc6x7CDsFOBFniwBSqY96A';
const firebaseConfig = {
  apiKey: (firebaseConfigData.apiKey && !firebaseConfigData.apiKey.includes('YOUR_')) 
    ? firebaseConfigData.apiKey 
    : defaultKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};

// Initialize Firebase App singleton
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
// Attempt local persistence for seamless auth
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Auth persistence warning:', err);
});

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Initialize Firestore with custom database ID if provided
export const db: Firestore = firebaseConfigData.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
  : getFirestore(app);

// Zero-Crash Payload Hygiene (Strict Undefined-Stripping)
export function sanitizePayload<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => sanitizePayload(item)) as any;
  }
  if (typeof obj === 'object' && !(obj instanceof Date) && !(obj instanceof Timestamp)) {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        sanitized[key] = sanitizePayload(value);
      }
    }
    return sanitized as T;
  }
  return obj;
}

// Authentication Helpers
export async function signInWithGoogle(): Promise<UserProfile> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

// Isolated User Document Helpers (/users/{userId}/entries/{entryId})
export function getUserEntriesRef(userId: string) {
  return collection(db, 'users', userId, 'entries');
}

export function getUserEntryDocRef(userId: string, entryId: string) {
  return doc(db, 'users', userId, 'entries', entryId);
}

// LocalStorage Fallback Helpers for Demo / Guest Mode
const STORAGE_PREFIX = 'reflections_app_entries_';

function getLocalEntries(userId: string): JournalEntry[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalEntries(userId: string, entries: JournalEntry[]): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(entries));
  } catch (e) {
    console.error('LocalStorage save failed:', e);
  }
}

// Save or Update Journal Entry
export async function saveJournalEntry(userId: string, entry: JournalEntry): Promise<void> {
  if (!userId || !entry.id) {
    throw new Error('Missing userId or entry.id for saving journal entry');
  }

  const sanitizedEntry = sanitizePayload({
    ...entry,
    userId,
    updatedAt: Date.now(),
  });

  // Always update LocalStorage snapshot for zero data loss
  const currentLocal = getLocalEntries(userId);
  const existingIndex = currentLocal.findIndex(e => e.id === entry.id);
  let updatedLocal: JournalEntry[];
  if (existingIndex >= 0) {
    updatedLocal = [...currentLocal];
    updatedLocal[existingIndex] = sanitizedEntry;
  } else {
    updatedLocal = [sanitizedEntry, ...currentLocal];
  }
  saveLocalEntries(userId, updatedLocal);

  // Attempt Firestore Sync if auth state allows
  if (userId.startsWith('demo_')) return;
  try {
    const entryRef = getUserEntryDocRef(userId, entry.id);
    await setDoc(entryRef, sanitizedEntry, { merge: true });
  } catch (err) {
    console.warn('[Firestore Save Warning - using LocalStorage fallback]:', err);
  }
}

// Delete Journal Entry
export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) {
    throw new Error('Missing userId or entryId for deleting journal entry');
  }

  const currentLocal = getLocalEntries(userId);
  saveLocalEntries(userId, currentLocal.filter(e => e.id !== entryId));

  if (userId.startsWith('demo_')) return;
  try {
    const entryRef = getUserEntryDocRef(userId, entryId);
    await deleteDoc(entryRef);
  } catch (err) {
    console.warn('[Firestore Delete Warning - using LocalStorage fallback]:', err);
  }
}

// Subscribe to real-time entries for current user
export function subscribeToUserEntries(
  userId: string, 
  onUpdate: (entries: JournalEntry[]) => void,
  onError: (error: Error) => void
) {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  // If Demo mode, load from LocalStorage immediately
  if (userId.startsWith('demo_')) {
    const local = getLocalEntries(userId);
    onUpdate(local);
    return () => {};
  }

  const entriesRef = getUserEntriesRef(userId);
  const q = query(entriesRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: JournalEntry[] = [];
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data() as any;
        entries.push({
          id: docSnapshot.id,
          userId: data.userId || userId,
          title: data.title || 'Untitled Reflection',
          content: data.content || '',
          mode: data.mode || 'reflection',
          mood: data.mood || 'calm',
          tags: Array.isArray(data.tags) ? data.tags : [],
          messages: Array.isArray(data.messages) ? data.messages : [],
          summary: data.summary || null,
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
          isPinned: Boolean(data.isPinned),
          wordCount: typeof data.wordCount === 'number' ? data.wordCount : (data.content || '').trim().split(/\s+/).filter(Boolean).length,
        });
      });
      saveLocalEntries(userId, entries);
      onUpdate(entries);
    },
    (err) => {
      console.warn('[Firestore onSnapshot Warning - falling back to LocalStorage]:', err);
      const local = getLocalEntries(userId);
      onUpdate(local);
      onError(err);
    }
  );
}
