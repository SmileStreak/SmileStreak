import { collection, query, where, orderBy, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Subscribe to real-time leaderboard updates for a specific league group
 * @param {string} leagueGroup - The league group to subscribe to
 * @param {function} callback - Function called with updated players array
 * @returns {function} Unsubscribe function
 */
export const subscribeToLeaderboard = (leagueGroup, callback) => {
  if (!leagueGroup) {
    console.warn("No leagueGroup provided to subscribeToLeaderboard");
    callback([]);
    return () => {};
  }

  try {
    const usersRef = collection(db, "users");
    
    // Query: users where leaderboard.leagueGroup == leagueGroup
    // ordered by weeklyPoints descending
    const q = query(
      usersRef,
      where("leaderboard.leagueGroup", "==", leagueGroup),
      orderBy("leaderboard.weeklyPoints", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const players = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const leaderboard = data.leaderboard || {};
        
        players.push({
          uid: doc.id,
          rank: 0,
          displayName: data.displayName || data.username || "Anonymous",
          username: data.username || "Anonymous",
          photoURL: data.photoURL || data.userProfile?.photoURL || "",
          weeklyPoints: leaderboard.weeklyPoints || 0,
          league: leaderboard.league || "Bronze",
          leagueGroup: leaderboard.leagueGroup || "default",
          weekId: leaderboard.weekId || "",
          currentStreak: leaderboard.currentStreak || 0,
          perfectDays: leaderboard.perfectDays || 0
        });
      });

      // Assign ranks based on sorted order
      players.forEach((player, index) => {
        player.rank = index + 1;
      });

      callback(players);
    }, (error) => {
      console.error("Error in subscribeToLeaderboard:", error);
      callback([]);
    });

    return unsubscribe;
  } catch (error) {
    console.error("Error setting up leaderboard subscription:", error);
    callback([]);
    return () => {};
  }
};

/**
 * Get the user's current league zone
 * @param {object} userData - The user's Firestore data
 * @returns {string} League group name
 */
export const getLeagueZone = (userData) => {
  if (!userData?.leaderboard?.leagueGroup) {
    return "default";
  }
  return userData.leaderboard.leagueGroup;
};

/**
 * Get the user's current rank in their league
 * @param {string} leagueGroup - The league group
 * @param {string} userId - The user's UID
 * @returns {Promise<number>} The user's rank
 */
export const getCurrentUserRank = async (leagueGroup, userId) => {
  if (!leagueGroup || !userId) return 0;

  try {
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("leaderboard.leagueGroup", "==", leagueGroup),
      orderBy("leaderboard.weeklyPoints", "desc")
    );

    const snapshot = await getDocs(q);
    let rank = 1;
    
    for (const doc of snapshot.docs) {
      if (doc.id === userId) {
        return rank;
      }
      rank++;
    }
    
    return 0;
  } catch (error) {
    console.error("Error getting user rank:", error);
    return 0;
  }
};
