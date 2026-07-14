// utils/leagueSystem.js

export const LEAGUES = [
  "Bronze",
  "Silver",
  "Gold",
  "Diamond",
  "Champion"
];

export function getCurrentWeekId(date = new Date()) {
  const d = new Date(date);

  // Monday = first day of week
  const day = (d.getDay() + 6) % 7;

  d.setDate(d.getDate() - day);

  const year = d.getFullYear();

  const start = new Date(year, 0, 1);

  const week =
    Math.floor((d - start) / (7 * 24 * 60 * 60 * 1000));

  return `${year}-W${week}`;
}

export function isNewWeek(savedWeekId) {
  return savedWeekId !== getCurrentWeekId();
}

export function getPromotionCutoff(playerCount) {
  return Math.max(1, Math.ceil(playerCount * 0.20));
}

export function getDemotionCutoff(playerCount) {
  return Math.floor(playerCount * 0.80);
}

export function getLeagueAfterPlacement(
  currentLeague,
  rank,
  playerCount
) {
  const currentIndex = LEAGUES.indexOf(currentLeague);

  if (currentIndex === -1)
    return currentLeague;

  const promotion =
    getPromotionCutoff(playerCount);

  const demotion =
    getDemotionCutoff(playerCount);

  // Promote
  if (
    rank <= promotion &&
    currentIndex < LEAGUES.length - 1
  ) {
    return LEAGUES[currentIndex + 1];
  }

  // Demote
  if (
    rank > demotion &&
    currentIndex > 0
  ) {
    return LEAGUES[currentIndex - 1];
  }

  return currentLeague;
}

export function createLeagueGroup() {
  return crypto.randomUUID();
}

export function createFreshLeaderboard(
  previousLeaderboard = {}
) {
  return {
    weeklyPoints: 0,
    perfectDays: 0,
    currentStreak: previousLeaderboard.currentStreak || 0,
    league:
      previousLeaderboard.league || "Bronze",
    leagueGroup:
      previousLeaderboard.leagueGroup ||
      createLeagueGroup(),
    weekId: getCurrentWeekId()
  };
}

export function getPromotionStatus(
  rank,
  playerCount
) {
  if (rank <= getPromotionCutoff(playerCount))
    return "promotion";

  if (rank > getDemotionCutoff(playerCount))
    return "demotion";

  return "safe";
}

export function getSeasonEnd() {
  const now = new Date();

  const end = new Date(now);

  const daysUntilSunday =
    (7 - now.getDay()) % 7;

  end.setDate(now.getDate() + daysUntilSunday);

  end.setHours(23, 59, 59, 999);

  return end;
}

export function getCountdown() {
  const end = getSeasonEnd();

  const diff = end - new Date();

  const days = Math.floor(diff / 86400000);

  const hours = Math.floor(
    (diff % 86400000) / 3600000
  );

  const minutes = Math.floor(
    (diff % 3600000) / 60000
  );

  return {
    days,
    hours,
    minutes
  };
}
