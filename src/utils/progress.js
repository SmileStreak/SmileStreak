import { getDateKey } from "./date";

export const isDayComplete = (day) =>
  day?.morning && day?.night && day?.floss;

export const calculateStreaks = (habitData) => {
  let current = 0;
  let longest = 0;
  let temp = 0;

  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = getDateKey(d);
    const complete = isDayComplete(habitData[key]);

    if (complete) {
      temp++;
      longest = Math.max(longest, temp);
      if (i === current) current++;
    } else {
      temp = 0;
    }
  }

  return { currentStreak: current, longestStreak: longest };
};

export const getCompletionPercent = (day) => {
  if (!day) return 0;
  const done = [day.morning, day.night, day.floss].filter(Boolean).length;
  return Math.round((done / 3) * 100);
};
