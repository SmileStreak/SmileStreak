import { calculateStreaks as calculateProgressStreaks } from "./progress.js";
import { getDateKey } from "./date.js";

// Preserve the property names used by Home and Today while sharing the same
// calendar-aware calculations as Progress and leaderboard summaries.
export const calculateStreaks = (days) => {
  const result = calculateProgressStreaks(days || {});
  return { current: result.currentStreak, longest: result.longestStreak };
};

const readHabitData = (habitData) => {
  const data = habitData || JSON.parse(localStorage.getItem("habitData") || "{}");
  return data.habits || data;
};

export const getCurrentStreak = (habitData) =>
  calculateProgressStreaks(readHabitData(habitData)).currentStreak;

export const getLongestStreak = (habitData) =>
  calculateProgressStreaks(readHabitData(habitData)).longestStreak;

export const getTodayProgress = (habitData) => {
  const todayHabits = readHabitData(habitData)?.[getDateKey()] || {};
  const completedCount = [todayHabits.morning, todayHabits.night].filter(Boolean).length;
  return Math.round((completedCount / 2) * 100);
};

export const getWeeklyActivity = (habitData) => {
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const habits = readHabitData(habitData);

  return weekDays.map((day, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const dayHabits = habits?.[getDateKey(date)] || {};
    const completed = [dayHabits.morning, dayHabits.night, dayHabits.floss].filter(Boolean).length;
    return { day, completed, total: 3, percentage: (completed / 3) * 100 };
  });
};
