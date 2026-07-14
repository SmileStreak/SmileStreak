import storage from "./storage";
import { getDateString } from "./dates";

const KEY = "smile-streak-data";

export const loadHabits = () =>
  storage.get(KEY, {
    habits: {},
    favorites: [],
    scanHistory: [],
    reminders: {
      morning: "08:00",
      night: "21:00",
      floss: "20:30"
    },
    userPreferences: {},
    achievements: [],
    insightsData: {}
  });

export const saveHabits = (data) =>
  storage.set(KEY, data);

export const getToday = (data) => {
  const today = getDateString();
  const habits = data.habits || data; // Support old format
  return (
    habits[today] || {
      morning: false,
      night: false,
      floss: false,
      completed: false
    }
  );
};

export const toggleTask = (data, task) => {
  const today = getDateString();
  const habits = data.habits || data; // Support old format
  const day = getToday(data);

  const updatedDay = {
    ...day,
    [task]: !day[task]
  };

  updatedDay.completed =
    updatedDay.morning &&
    updatedDay.night &&
    updatedDay.floss;

  // If using new format, update habits object
  if (data.habits) {
    return {
      ...data,
      habits: {
        ...habits,
        [today]: updatedDay
      }
    };
  }

  // Old format fallback
  return {
    ...data,
    [today]: updatedDay
  };
};

// NEW: Save favorite dentist
export const saveFavorite = (data, dentist) => {
  const favorites = data.favorites || [];
  const exists = favorites.some(f => f.id === dentist.id);
  
  if (exists) {
    return {
      ...data,
      favorites: favorites.filter(f => f.id !== dentist.id)
    };
  }
  
  return {
    ...data,
    favorites: [...favorites, dentist]
  };
};

// NEW: Get favorites
export const getFavorites = (data) => {
  return data.favorites || [];
};

// NEW: Save scan to history
export const saveScan = (data, scan) => {
  const scanHistory = data.scanHistory || [];
  const newScan = {
    id: Date.now(),
    date: new Date().toISOString(),
    timestamp: new Date().toLocaleString(),
    ...scan
  };
  
  return {
    ...data,
    scanHistory: [newScan, ...scanHistory].slice(0, 50) // Keep last 50 scans
  };
};

// NEW: Get scan history
export const getScanHistory = (data) => {
  return data.scanHistory || [];
};

// NEW: Delete scan
export const deleteScan = (data, scanId) => {
  const scanHistory = data.scanHistory || [];
  return {
    ...data,
    scanHistory: scanHistory.filter(s => s.id !== scanId)
  };
};

// NEW: Save reminders
export const saveReminders = (data, reminders) => {
  return {
    ...data,
    reminders: {
      ...data.reminders,
      ...reminders
    }
  };
};

// NEW: Get reminders
export const getReminders = (data) => {
  return data.reminders || {
    morning: "08:00",
    night: "21:00",
    floss: "20:30"
  };
};

// NEW: Save user preferences
export const savePreferences = (data, preferences) => {
  return {
    ...data,
    userPreferences: {
      ...data.userPreferences,
      ...preferences
    }
  };
};

// NEW: Get user preferences
export const getPreferences = (data) => {
  return data.userPreferences || {};
};

// NEW: Save achievement
export const unlockAchievement = (data, achievementId) => {
  const achievements = data.achievements || [];
  if (achievements.includes(achievementId)) {
    return data;
  }
  
  return {
    ...data,
    achievements: [...achievements, achievementId]
  };
};

// NEW: Get achievements
export const getAchievements = (data) => {
  return data.achievements || [];
};

// NEW: Save insights data
export const saveInsights = (data, insights) => {
  return {
    ...data,
    insightsData: {
      ...data.insightsData,
      ...insights,
      lastUpdated: new Date().toISOString()
    }
  };
};

// NEW: Get insights data
export const getInsights = (data) => {
  return data.insightsData || {};
};
