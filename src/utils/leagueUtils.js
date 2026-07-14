import { LEAGUES } from "../data/leagues";

/**
 * Returns the Monday 12:00 AM UTC for the current league week.
 */
export function getCurrentLeagueWeek() {
  const now = new Date();

  // Convert Sunday (0) -> 6, Monday (1) -> 0, etc.
  const day = (now.getUTCDay() + 6) % 7;

  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - day);
  monday.setUTCHours(0, 0, 0, 0);

  return monday.toISOString();
}

/**
 * Points earned for a completed habit.
 */
export function getHabitPoints(habit) {
  switch (habit) {
    case "morning":
      return 10;

    case "night":
      return 10;

    case "floss":
      return 15;

    default:
      return 0;
  }
}

/**
 * Calculates total league points for a user's habitData.
 */
export function calculateWeeklyPoints(habitData = {}) {
  let points = 0;

  const currentWeek = new Date(getCurrentLeagueWeek());

  Object.entries(habitData).forEach(([date, habits]) => {
    if (date.startsWith("__")) return;

    const day = new Date(date);

    if (day < currentWeek) return;

    if (habits.morning) points += getHabitPoints("morning");
    if (habits.night) points += getHabitPoints("night");
    if (habits.floss) points += getHabitPoints("floss");
  });

  return points;
}

/**
 * Returns next league.
 */
export function getNextLeague(currentLeague) {
  const index = LEAGUES.findIndex(l => l.id === currentLeague);

  if (index === -1) return null;
  if (index === LEAGUES.length - 1) return null;

  return LEAGUES[index + 1];
}

/**
 * Returns previous league.
 */
export function getPreviousLeague(currentLeague) {
  const index = LEAGUES.findIndex(l => l.id === currentLeague);

  if (index <= 0) return null;

  return LEAGUES[index - 1];
}

/**
 * Returns league information.
 */
export function getLeague(currentLeague) {
  return LEAGUES.find(l => l.id === currentLeague);
}
