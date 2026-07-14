// src/utils/leagueSystem.js

export const LEAGUES = [
  {
    id: 0,
    name: "Bronze",
    color: "#CD7F32",
    icon: "🥉",
    size: 30,
    promote: 5,
    demote: 0,
  },
  {
    id: 1,
    name: "Silver",
    color: "#C0C0C0",
    icon: "🥈",
    size: 30,
    promote: 5,
    demote: 5,
  },
  {
    id: 2,
    name: "Gold",
    color: "#FFD700",
    icon: "🥇",
    size: 30,
    promote: 5,
    demote: 5,
  },
  {
    id: 3,
    name: "Diamond",
    color: "#66D9FF",
    icon: "💎",
    size: 30,
    promote: 5,
    demote: 5,
  },
  {
    id: 4,
    name: "Master",
    color: "#A855F7",
    icon: "👑",
    size: 30,
    promote: 0,
    demote: 5,
  },
];

/**
 * Monday at 12:00 AM UTC
 */
export function getCurrentWeekKey(date = new Date()) {
  const d = new Date(date);

  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;

  d.setUTCDate(d.getUTCDate() + diff);

  d.setUTCHours(0, 0, 0, 0);

  return d.toISOString().split("T")[0];
}

/**
 * Create a league id.
 * Every group of 30 players shares one league.
 */
export function createLeagueId(tier, index, weekKey) {
  return `${weekKey}_${tier}_${index}`;
}

/**
 * Returns true if a stored week is old.
 */
export function needsWeeklyReset(savedWeek) {
  return savedWeek !== getCurrentWeekKey();
}

/**
 * Returns league info.
 */
export function getLeagueInfo(tier) {
  return LEAGUES[Math.max(0, Math.min(tier, LEAGUES.length - 1))];
}

/**
 * Calculate new tier after weekly results.
 */
export function calculateNewTier(currentTier, rank) {
  const league = getLeagueInfo(currentTier);

  if (rank <= league.promote) {
    return Math.min(currentTier + 1, LEAGUES.length - 1);
  }

  if (
    league.demote > 0 &&
    rank > league.size - league.demote
  ) {
    return Math.max(currentTier - 1, 0);
  }

  return currentTier;
}

/**
 * Sort players by:
 * 1. score
 * 2. streak
 * 3. username
 */
export function sortLeague(players) {
  return [...players].sort((a, b) => {
    const scoreA = a.leaderboard?.score || 0;
    const scoreB = b.leaderboard?.score || 0;

    if (scoreB !== scoreA) return scoreB - scoreA;

    const streakA = a.leaderboard?.streak || 0;
    const streakB = b.leaderboard?.streak || 0;

    if (streakB !== streakA) return streakB - streakA;

    const nameA = (a.username || "").toLowerCase();
    const nameB = (b.username || "").toLowerCase();

    return nameA.localeCompare(nameB);
  });
}

/**
 * Returns rank of a player.
 */
export function getPlayerRank(players, uid) {
  const sorted = sortLeague(players);

  const index = sorted.findIndex(p => p.uid === uid);

  return index === -1 ? null : index + 1;
}
