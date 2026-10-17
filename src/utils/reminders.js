const DEFAULT_REMINDERS = {
  morning: "09:00",
  night: "20:00",
  floss: "21:00",
};

export function getReminders() {
  try {
    const saved = localStorage.getItem("reminders");
    if (!saved) return { ...DEFAULT_REMINDERS };
    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { ...DEFAULT_REMINDERS };
    return Object.fromEntries(Object.entries(DEFAULT_REMINDERS).map(([key, fallback]) => [
      key,
      typeof parsed[key] === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(parsed[key]) ? parsed[key] : fallback,
    ]));
  } catch {
    return { ...DEFAULT_REMINDERS };
  }
}

export function saveReminders(reminders) {
  try {
    localStorage.setItem("reminders", JSON.stringify(reminders));
    return true;
  } catch {
    return false;
  }
}

export function getReminderPreference(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "false") === true;
  } catch {
    return false;
  }
}

export function getReminderStats() {
  try {
    const parsed = JSON.parse(localStorage.getItem("reminderStats") || "{}");
    return {
      onTimeCount: Number.isFinite(parsed?.onTimeCount) ? Math.max(0, parsed.onTimeCount) : 0,
      streak: Number.isFinite(parsed?.streak) ? Math.max(0, parsed.streak) : 0,
    };
  } catch {
    return { onTimeCount: 0, streak: 0 };
  }
}

export function saveReminderPreference(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
