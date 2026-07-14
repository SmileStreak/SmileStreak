import { getReminders } from "./reminders";

function getTodayTime(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const now = new Date();
  const target = new Date();

  target.setHours(hours, minutes, 0, 0);

  // If time already passed today → don’t schedule
  if (target <= now) return null;

  return target;
}

export function scheduleDailyNotifications() {
  if (Notification.permission !== "granted") return;

  const reminders = getReminders();

  Object.entries(reminders).forEach(([key, time]) => {
    const targetTime = getTodayTime(time);
    if (!targetTime) return;

    const delay = targetTime.getTime() - Date.now();

    setTimeout(() => {
      new Notification("🪥 Smile Streak", {
        body:
          key === "morning"
            ? "Time for your morning brush!"
            : key === "night"
            ? "Time for your night brush!"
            : "Don’t forget to floss!",
      });
    }, delay);
  });
}
