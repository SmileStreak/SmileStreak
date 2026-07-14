import { getDateKeyFromOffset } from "./dates";

export function isDayComplete(day) {
  return day?.morning && day?.night && day?.floss;
}

export function getWeekData(habitData) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const result = [];

  for (let i = 6; i >= 0; i--) {
    const key = getDateKeyFromOffset(i);
    const date = new Date();
    date.setDate(date.getDate() - i);

    result.push({
      label: days[date.getDay()],
      completed: isDayComplete(habitData[key]),
    });
  }

  return result;
}

export function getMonthlyData(habitData) {
  const weeks = [];

  for (let w = 3; w >= 0; w--) {
    let total = 0;
    let complete = 0;

    for (let d = 0; d < 7; d++) {
      const key = getDateKeyFromOffset(w * 7 + d);
      if (habitData[key]) {
        total++;
        if (isDayComplete(habitData[key])) complete++;
      }
    }

    weeks.push({
      label: `Week ${4 - w}`,
      percent: total ? Math.round((complete / total) * 100) : 0,
    });
  }

  return weeks;
}

export function getAchievements(habitData) {
  const days = Object.values(habitData).filter(isDayComplete).length;

  return [
    { name: "Started", unlocked: days >= 1, icon: "🌅" },
    { name: "7 Days", unlocked: days >= 7, icon: "🔥" },
    { name: "14 Days", unlocked: days >= 14, icon: "⭐" },
    { name: "30 Days", unlocked: days >= 30, icon: "🏆" },
  ];
}
