import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export interface LeaderboardEntry {
  id?: string;
  playerName: string;
  kills: number;
  topSpeed: number;
  lootScrap: number;
  createdAt: string;
}

export async function submitLeaderboardScore(entry: Omit<LeaderboardEntry, 'id'>) {
  try {
    const colRef = collection(db, 'leaderboard');
    await addDoc(colRef, entry);
    console.log('Leaderboard score saved to Firestore!');
    return true;
  } catch (err) {
    console.error('Error saving leaderboard score:', err);
    return false;
  }
}

export async function fetchTopLeaderboard(maxLimit = 10): Promise<LeaderboardEntry[]> {
  try {
    const colRef = collection(db, 'leaderboard');
    const q = query(colRef, orderBy('kills', 'desc'), limit(maxLimit));
    const snapshot = await getDocs(q);
    const results: LeaderboardEntry[] = [];
    snapshot.forEach(doc => {
      results.push({ id: doc.id, ...doc.data() } as LeaderboardEntry);
    });
    return results;
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    return [];
  }
}
