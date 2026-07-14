import { getDateKey, getLocalMidnight } from "./date.js";

export const calculateStreaks = (days) => {
  const today = getDateKey();
  let current = 0;
  let longest = 0;
  let temp = 0;
  let allowTodayIncomplete = true;

  const cursor = getLocalMidnight();

  for (let i = 0; i < 365; i++) {
    const dateKey = getDateKey(cursor);
    const day = days[dateKey];
    const complete =
      day?.morning === true &&
      day?.night === true &&
      day?.floss === true;

    if (complete) {
      temp++;
      longest = Math.max(longest, temp);
      if (allowTodayIncomplete) current = temp;
    } else {
      if (dateKey !== today) {
        allowTodayIncomplete = false;
        temp = 0;
      }
    }

    cursor.setDate(cursor.getDate() - 1);
  }

  return { current, longest };
};

// Export getCurrentStreak for Home component
export const getCurrentStreak = (habitData) => {
  const data = habitData || JSON.parse(localStorage.getItem("habitData") || "{}");
  const habits = data.habits || data;
  
  const streaks = calculateStreaks(habits);
  return streaks.current;
};

// ADD THIS - Export getLongestStreak for Home component
export const getLongestStreak = (habitData) => {
  const data = habitData || JSON.parse(localStorage.getItem("habitData") || "{}");
  const habits = data.habits || data;
  
  const streaks = calculateStreaks(habits);
  return streaks.longest;
};

// ADD THIS - Export getTodayProgress for Home component
export const getTodayProgress = (habitData) => {
  const today = getDateKey();
  const data = habitData || JSON.parse(localStorage.getItem("habitData") || "{}");
  const habits = data.habits || data;
  
  const todayHabits = habits?.[today] || {};
  const completedCount = Object.values(todayHabits).filter(Boolean).length;
  const totalHabits = 2; // morning and evening (floss is optional for progress)
  
  return Math.round((completedCount / totalHabits) * 100);
};

// ADD THIS - Export getWeeklyActivity for Home component
export const getWeeklyActivity = (habitData) => {
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const data = habitData || JSON.parse(localStorage.getItem("habitData") || "{}");
  const habits = data.habits || data;
  
  return weekDays.map((day, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const dateStr = getDateKey(date);
    const dayHabits = habits?.[dateStr] || {};
    const completed = Object.values(dayHabits).filter(Boolean).length;
    
    return {
      day,
      completed,
      total: 2,
      percentage: (completed / 2) * 100
    };
  });
};