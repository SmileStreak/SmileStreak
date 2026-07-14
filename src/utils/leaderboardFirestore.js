import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  doc,
  setDoc,
} from "firebase/firestore";

import { db } from "../firebase";
import { calculateLeaderboardStats } from "./leaderboard";

/**
 * Save leaderboard stats for one user.
 */
export async function updateLeaderboardStats(user, habitData = {}) {
  if (!user) return;

  const stats = calculateLeaderboardStats(habitData);

  const ref = doc(db, "users", user.uid);

  await setDoc(
    ref,
    {
      leaderboard: {
        ...stats,
        updatedAt: new Date().toISOString(),
      },
    },
    { merge: true }
  );
}

/**
 * Fetch the top users once.
 */
export async function fetchLeaderboard(maxUsers = 100) {
  const q = query(
    collection(db, "users"),
    orderBy("leaderboard.score", "desc"),
    limit(maxUsers)
  );

  const snap = await getDocs(q);

  return snap.docs.map((docSnap) => ({
    uid: docSnap.id,
    ...docSnap.data(),
  }));
}

/**
 * Listen for live leaderboard updates.
 */
export function subscribeLeaderboard(callback, maxUsers = 100) {
  const q = query(
    collection(db, "users"),
    orderBy("leaderboard.score", "desc"),
    limit(maxUsers)
  );

  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map((docSnap) => ({
      uid: docSnap.id,
      ...docSnap.data(),
    }));

    callback(users);
  });
}
