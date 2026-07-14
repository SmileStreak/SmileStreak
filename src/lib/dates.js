// Normalizes dates to local midnight (IMPORTANT for streaks)
export const getLocalMidnight = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getDateString = (date = new Date()) => {
  const d = getLocalMidnight(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
