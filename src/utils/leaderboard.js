import { calculateStreaks, isDayComplete } from "./progress";
import { ACHIEVEMENTS } from "../data/achievements";

export const LEAGUES = [
  "Bronze",
  "Silver",
  "Gold",
  "Sapphire",
  "Ruby",
  "Emerald",
  "Amethyst",
  "Pearl",
  "Obsidian",
  "Diamond",
];

export function calculateLeaderboardStats(habitData = {}, leaderboard = {}) {
  const { currentStreak, longestStreak } = calculateStreaks(habitData);

  const days = Object.keys(habitData).filter(
    (key) => !key.startsWith("__")
  );

  const perfectDays = days.filter((day) =>
    isDayComplete(habitData[day])
  ).length;

  const completionRate =
    days.length > 0
      ? Math.round((perfectDays / days.length) * 100)
      : 0;

  const achievementsUnlocked = ACHIEVEMENTS.filter(
    (achievement) => perfectDays >= achievement.requirement
  ).length;

  return {
    weeklyPoints: leaderboard.weeklyPoints ?? 0,
    league: leaderboard.league ?? "Bronze",
    leagueGroup: leaderboard.leagueGroup ?? null,
    weekId: leaderboard.weekId ?? null,
    currentStreak,
    longestStreak,
    perfectDays,
    completionRate,
    achievementsUnlocked,
  };
}

export function sortLeaderboard(users = []) {
  return [...users].sort((a, b) => {
    if (b.weeklyPoints !== a.weeklyPoints)
      return b.weeklyPoints - a.weeklyPoints;

    if (b.currentStreak !== a.currentStreak)
      return b.currentStreak - a.currentStreak;

    return b.perfectDays - a.perfectDays;
  });
}

export function addRanks(users = []) {
  return users.map((user, index) => ({
    ...user,
    rank: index + 1,
  }));
}

export function getUserRank(users, uid) {
  return users.find((u) => u.uid === uid)?.rank ?? null;
}

export function getNextLeague(current) {
  const index = LEAGUES.indexOf(current);
  if (index === -1 || index === LEAGUES.length - 1) return current;
  return LEAGUES[index + 1];
}

export function getPreviousLeague(current) {
  const index = LEAGUES.indexOf(current);
  if (index <= 0) return current;
  return LEAGUES[index - 1];
}
