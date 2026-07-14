import { collection, query, where, orderBy, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Subscribe to real-time leaderboard updates
 * Only shows users in the same league, league group, and week
 */
export const subscribeToLeaderboard = (
  league,
  leagueGroup,
  weekId,
  callback
) => {
  if (!league || !leagueGroup || !weekId) {
    console.warn("Missing leaderboard parameters");
    callback([]);
    return () => {};
  }

  try {
    const usersRef = collection(db, "users");

    const q = query(
      usersRef,
      where("leaderboard.league", "==", league),
      where("leaderboard.leagueGroup", "==", leagueGroup),
      where("leaderboard.weekId", "==", weekId),
      orderBy("leaderboard.weeklyPoints", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const players = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          const leaderboard = data.leaderboard || {};

          players.push({
            uid: doc.id,
            rank: 0,

            displayName:
              data.displayName ||
              data.username ||
              "Anonymous",

            username:
              data.username ||
              "Anonymous",

            photoURL:
              data.photoURL ||
              data.userProfile?.photoURL ||
              "",

            weeklyPoints:
              leaderboard.weeklyPoints || 0,

            league:
              leaderboard.league || "Bronze",

            leagueGroup:
              leaderboard.leagueGroup || "default",

            weekId:
              leaderboard.weekId || "",

            currentStreak:
              leaderboard.currentStreak || 0,

            perfectDays:
              leaderboard.perfectDays || 0,
          });
        });

        players.forEach((player, index) => {
          player.rank = index + 1;
        });

        callback(players);
      },
      (error) => {
        console.error(
          "Leaderboard subscription error:",
          error
        );

        callback([]);
      }
    );

    return unsubscribe;

  } catch (error) {
    console.error(
      "Failed to setup leaderboard:",
      error
    );

    callback([]);
    return () => {};
  }
};


/**
 * Gets league group
 */
export const getLeagueZone = (userData) => {
  return (
    userData?.leaderboard?.leagueGroup ||
    "default"
  );
};


/**
 * Gets user's current rank
 */
export const getCurrentUserRank = async (
  league,
  leagueGroup,
  weekId,
  userId
) => {

  if (!league || !leagueGroup || !weekId || !userId) {
    return 0;
  }

  try {

    const usersRef = collection(db, "users");

    const q = query(
      usersRef,
      where("leaderboard.league", "==", league),
      where("leaderboard.leagueGroup", "==", leagueGroup),
      where("leaderboard.weekId", "==", weekId),
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

  } catch(error) {

    console.error(
      "Error getting rank:",
      error
    );

    return 0;
  }
};
