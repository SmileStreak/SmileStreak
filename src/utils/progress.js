import { getDateFromKey, getDateKey, isDateKey } from "./date";

export const isDayComplete = (day) =>
  day?.morning && day?.night && day?.floss;

export const calculateStreaks = (habitData) => {
  const days = habitData || {};
  const todayKey = getDateKey();
  const entries = Object.entries(days)
    .filter(([key]) => isDateKey(key) && key <= todayKey)
    .sort(([a], [b]) => a.localeCompare(b));
  let longest = 0;
  let temp = 0;
  let previousDate = null;

  for (const [key, day] of entries) {
    const date = getDateFromKey(key);
    const complete = isDayComplete(day);
    if (complete) {
      const isConsecutive = previousDate && Math.round((date - previousDate) / (24 * 60 * 60 * 1000)) === 1;
      temp = isConsecutive ? temp + 1 : 1;
      longest = Math.max(longest, temp);
    } else {
      temp = 0;
    }
    previousDate = date;
  }

  let cursor = getDateFromKey(todayKey);
  if (!isDayComplete(days[todayKey])) cursor.setDate(cursor.getDate() - 1);
  let current = 0;
  for (let i = 0; i < entries.length; i += 1) {
    if (!isDayComplete(days[getDateKey(cursor)])) break;
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { currentStreak: current, longestStreak: longest };
};

export const getCompletionPercent = (day) => {
  if (!day) return 0;
  const done = [day.morning, day.night, day.floss].filter(Boolean).length;
  return Math.round((done / 3) * 100);
};
