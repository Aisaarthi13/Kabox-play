import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore,
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true
  }, firebaseConfig.firestoreDatabaseId || '(default)');
} catch (e) {
  firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = firestoreDb;
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export interface LeaderboardEntry {
  id?: string;
  playerName: string;
  kills: number;
  topSpeed: number;
  lootScrap: number;
  createdAt: string;
}

export interface UserProfileData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  kills: number;
  topSpeed: number;
  lootScrap: number;
  gamesPlayed: number;
  updatedAt: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Save or Update User Profile in Firestore
export async function saveUserProfileToFirestore(user: User, additionalStats?: Partial<UserProfileData>) {
  if (!user) return null;
  const userRef = doc(db, 'users', user.uid);
  try {
    const existingSnap = await getDoc(userRef);
    let updatedData: UserProfileData;
    
    if (existingSnap.exists()) {
      const prevData = existingSnap.data() as UserProfileData;
      updatedData = {
        uid: user.uid,
        email: user.email || prevData.email || '',
        displayName: user.displayName || prevData.displayName || user.email?.split('@')[0] || 'Warrior',
        photoURL: user.photoURL || prevData.photoURL || '',
        kills: Math.max(prevData.kills || 0, additionalStats?.kills || 0),
        topSpeed: Math.max(prevData.topSpeed || 0, additionalStats?.topSpeed || 0),
        lootScrap: (prevData.lootScrap || 0) + (additionalStats?.lootScrap || 0),
        gamesPlayed: (prevData.gamesPlayed || 0) + (additionalStats?.gamesPlayed ? 1 : 0),
        updatedAt: new Date().toISOString()
      };
    } else {
      updatedData = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Warrior',
        photoURL: user.photoURL || '',
        kills: additionalStats?.kills || 0,
        topSpeed: additionalStats?.topSpeed || 0,
        lootScrap: additionalStats?.lootScrap || 0,
        gamesPlayed: additionalStats?.gamesPlayed ? 1 : 0,
        updatedAt: new Date().toISOString()
      };
    }

    await setDoc(userRef, updatedData, { merge: true });
    return updatedData;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    return null;
  }
}

export async function getUserProfileFromFirestore(uid: string): Promise<UserProfileData | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfileData;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${uid}`);
    return null;
  }
}

// AUTH HANDLERS
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const profile = await saveUserProfileToFirestore(user);
    return { success: true, user, profile };
  } catch (err: any) {
    console.error('Google Auth Error:', err);
    return { success: false, error: err.message || 'Google sign-in failed.' };
  }
}

export async function registerWithEmail(email: string, pass: string, name: string) {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    const user = res.user;
    if (name) {
      await updateProfile(user, { displayName: name });
    }
    const profile = await saveUserProfileToFirestore(user, { displayName: name || email.split('@')[0] });
    return { success: true, user, profile };
  } catch (err: any) {
    console.error('Email Register Error:', err);
    return { success: false, error: err.message || 'Registration failed.' };
  }
}

export async function loginWithEmail(email: string, pass: string) {
  try {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    const user = res.user;
    const profile = await getUserProfileFromFirestore(user.uid) || await saveUserProfileToFirestore(user);
    return { success: true, user, profile };
  } catch (err: any) {
    console.error('Email Login Error:', err);
    return { success: false, error: err.message || 'Login failed.' };
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
    return true;
  } catch (err) {
    console.error('Logout error:', err);
    return false;
  }
}

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// LEADERBOARD HANDLERS
export async function submitLeaderboardScore(entry: Omit<LeaderboardEntry, 'id'>) {
  try {
    const colRef = collection(db, 'leaderboard');
    await addDoc(colRef, entry);
    
    // Also sync to current logged in user profile if exists
    if (auth.currentUser) {
      await saveUserProfileToFirestore(auth.currentUser, {
        kills: entry.kills,
        topSpeed: entry.topSpeed,
        lootScrap: entry.lootScrap,
        gamesPlayed: 1
      });
    }
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'leaderboard');
    return false;
  }
}

export async function fetchTopLeaderboard(maxLimit = 15): Promise<LeaderboardEntry[]> {
  try {
    const colRef = collection(db, 'leaderboard');
    const q = query(colRef, orderBy('kills', 'desc'), limit(maxLimit));
    const snapshot = await getDocs(q);
    const results: LeaderboardEntry[] = [];
    snapshot.forEach(docSnap => {
      results.push({ id: docSnap.id, ...docSnap.data() } as LeaderboardEntry);
    });
    return results;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'leaderboard');
    return [];
  }
}
