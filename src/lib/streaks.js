export const calculateStreaks = (days) => {
  const today = getDateString();
  let current = 0;
  let longest = 0;
  let temp = 0;
  let allowTodayIncomplete = true;

  const cursor = getLocalMidnight();

  for (let i = 0; i < 365; i++) {
    const dateStr = getDateString(cursor);
    const day = days[dateStr];

    const complete =
      day?.morning === true &&
      day?.night === true &&
      day?.floss === true;

    if (complete) {
      temp++;
      longest = Math.max(longest, temp);

      if (allowTodayIncomplete) {
        current = temp;
      }
    } else {
      if (dateStr !== today) {
        allowTodayIncomplete = false;
        temp = 0;
      }
    }

    cursor.setDate(cursor.getDate() - 1);
  }

  return { current, longest };
};
