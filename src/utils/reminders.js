const DEFAULT_REMINDERS = {
  morning: "09:00",
  night: "20:00",
  floss: "21:00",
};

export function getReminders() {
  const saved = localStorage.getItem("reminders");
  return saved ? JSON.parse(saved) : DEFAULT_REMINDERS;
}

export function saveReminders(reminders) {
  localStorage.setItem("reminders", JSON.stringify(reminders));
}
