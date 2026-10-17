import { scheduleDailyNotifications } from "../utils/scheduleNotifications";
import { useState, useEffect, useContext, useRef } from "react";
import { getReminders, getReminderPreference, getReminderStats, saveReminders, saveReminderPreference } from "../utils/reminders";
import { requestNotificationPermission, setupFCMToken } from "../utils/notifications";
import { savePushNotificationPreferences } from "../utils/pushNotifications";
import { getDateFromKey, getDateKey } from "../utils/date";
import { auth } from "../firebase";
import { Bell, BellOff, Clock, BookOpen, Zap, CheckCircle2, Moon, Sun, Activity, Calendar, AlertCircle, Smartphone } from "lucide-react";
import { TranslationContext } from "../App";

const isIOS = typeof navigator !== "undefined" && /iPhone|iPad|iPo/.test(navigator.userAgent);

const parseCalendarDate = (value) => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return getDateFromKey(value);
  return new Date(value);
};

const calendarDayDifference = (target, base = new Date()) => {
  const targetDate = parseCalendarDate(target);
  if (!Number.isFinite(targetDate.getTime())) return null;
  const targetDay = getDateFromKey(getDateKey(targetDate));
  const baseDay = getDateFromKey(getDateKey(base));
  return Math.round((targetDay - baseDay) / (1000 * 60 * 60 * 24));
};

const shiftCalendarDate = (date, days) => {
  const shifted = getDateFromKey(getDateKey(date));
  shifted.setDate(shifted.getDate() + days);
  return shifted;
};

export default function Reminders() {
  const { t, currentLanguage, translating } = useContext(TranslationContext);
  
  const [reminders, setReminders] = useState(getReminders());
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("info");
  const messageTimeoutRef = useRef(null);
  const [storageWarning, setStorageWarning] = useState(false);
  const [notificationPending, setNotificationPending] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderStats] = useState(getReminderStats);
  const [translatedText, setTranslatedText] = useState({});

  // ── DENTIST REMINDER STATE ──
  const [dentistReminderEnabled, setDentistReminderEnabled] = useState(
    () => getReminderPreference('dentistReminderEnabled')
  );
  const [nextDentistVisit, setNextDentistVisit] = useState(null);
  const [lastDentistVisit, setLastDentistVisit] = useState(null);
  const [scheduledDentistReminders, setScheduledDentistReminders] = useState([]);

  // ── ALIGNER REMINDER STATE ──
  const [alignerReminderEnabled, setAlignerReminderEnabled] = useState(
    () => getReminderPreference('alignerReminderEnabled')
  );
  const [alignerData, setAlignerData] = useState(null);
  const [traySwapDate, setTraySwapDate] = useState(null);
  const [showAlignerReminderSettings, setShowAlignerReminderSettings] = useState(false);
  const [customSwapDays, setCustomSwapDays] = useState(14);

  const showMessage = (text, tone = "info", duration = 3000) => {
    window.clearTimeout(messageTimeoutRef.current);
    setMessage(text);
    setMessageTone(tone);
    if (duration > 0) {
      messageTimeoutRef.current = window.setTimeout(() => {
        setMessage("");
        setMessageTone("info");
      }, duration);
    }
  };

  useEffect(() => () => window.clearTimeout(messageTimeoutRef.current), []);

  const translationKeys = {
    title: "Reminders",
    subtitle: "Choose when you want a brushing or flossing reminder",
    notificationsActive: "Notifications Active",
    notificationsActiveDesc: "You'll receive reminders at your scheduled times",
    enableNotifications: "Enable Notifications",
    enableNotificationsDesc: "Get reminded when it's time to brush and floss",
    quickSetup: "Quick Setup",
    morning: "Morning",
    night: "Night",
    floss: "Floss",
    onTimeActions: "On-Time Actions",
    onTimeActionsDesc: "Times you acted on reminders",
    reminderStreak: "Reminder Streak",
    reminderStreakDesc: "Consecutive days",
    customTimes: "Custom Times",
    morningBrush: "Morning Brush",
    nightBrush: "Night Brush",
    flossTime: "Floss Time",
    enableButton: "Enable Notifications",
    checkingNotifications: "Checking notifications…",
    tipsTitle: "Reminder Tips",
    tip1: "• Set reminders 30 minutes before meals for best results",
    tip2: "• Night reminders work best 1 hour before bed",
    tip3: "• Consistent timing builds stronger habits",
    iosTitle: "iPhone Users",
    iosMessage: "For notifications to work on iPhone, add SmileStreak to your home screen via Safari's Share menu, then enable notifications inside the app.",
    iosNotificationMessage: "Add SmileStreak to your Home Screen via Safari Share → Add to Home Screen, then re-enable notifications.",
    notificationsEnabled: "Notifications enabled successfully.",
    notificationsBlocked: "Notifications are blocked. Please enable them in browser settings.",
    morningSet: "⏰ Morning reminder set to 8:00 AM",
    nightSet: "🌙 Night reminder set to 9:00 PM",
    flossSet: "🧵 Floss reminder set to 8:30 PM"
  };

  useEffect(() => {
    let active = true;
    const loadTranslations = async () => {
      const translations = {};
      for (const [key, value] of Object.entries(translationKeys)) {
        translations[key] = await t(value);
      }
      if (active) setTranslatedText(translations);
    };
    loadTranslations().catch((error) => console.error("Could not load reminder translations:", error));
    return () => { active = false; };
  }, [currentLanguage, t]);

  useEffect(() => {
    setStorageWarning(!saveReminders(reminders));
    if (notificationsEnabled && auth.currentUser) {
      savePushNotificationPreferences({
        userId: auth.currentUser.uid,
        reminders,
        enabled: true,
      }).catch((error) => {
        console.error("Could not update background reminder preferences:", error);
        showMessage("Background reminder delivery couldn’t be updated. Please check your connection and try again.", "error", 0);
      });
    }
  }, [reminders, notificationsEnabled]);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  // ── LOAD DENTIST + ALIGNER DATA ──
  useEffect(() => {
    const loadData = () => {
      try {
        const stored = localStorage.getItem('habitData');
        if (stored) {
          const data = JSON.parse(stored);
          setNextDentistVisit(data.__nextDentistVisit || null);
          setLastDentistVisit(data.__lastDentistVisit || null);
          const aligner = data.__aligner || null;
          setAlignerData(aligner);
          if (aligner) {
            const daysPerTray = Number.isInteger(Number(aligner.daysPerTray)) && Number(aligner.daysPerTray) > 0
              ? Number(aligner.daysPerTray)
              : 14;
            setCustomSwapDays(daysPerTray);
            // Calculate next tray swap date
            const start = getDateFromKey(aligner.startDate);
            if (Number.isFinite(start.getTime())) {
              const today = getDateFromKey(getDateKey());
              const daysSinceStart = Math.max(0, Math.round((today - start) / (1000 * 60 * 60 * 24)));
              const daysOnCurrentTray = daysSinceStart % daysPerTray;
              const daysUntilSwap = daysPerTray - daysOnCurrentTray;
              const swapDate = new Date();
              swapDate.setDate(swapDate.getDate() + daysUntilSwap);
              setTraySwapDate(swapDate);
            } else {
              setTraySwapDate(null);
            }
          }
        }
      } catch (e) {
        console.error('Error loading data:', e);
      }
    };
    loadData();
    const handleStorage = (event) => {
      if (event.key === null || event.key === "habitData") loadData();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // ── SCHEDULE ALIGNER NOTIFICATIONS via Service Worker ──
  useEffect(() => {
    if (!saveReminderPreference('alignerReminderEnabled', alignerReminderEnabled)) setStorageWarning(true);
    if (!alignerReminderEnabled) {
      try {
        const stored = localStorage.getItem('alignerSwapSchedule');
        if (stored) {
          const schedule = JSON.parse(stored);
          localStorage.setItem('alignerSwapSchedule', JSON.stringify({ ...schedule, enabled: false }));
        }
      } catch (error) {
        console.error("Could not disable the saved aligner schedule:", error);
        setStorageWarning(true);
      }
      return;
    }
    if (!traySwapDate) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      showMessage("Your tray date is saved, but this browser cannot schedule swap notifications.", "error", 0);
      return;
    }

    const scheduleAlignerNotifications = async () => {
      const reg = await navigator.serviceWorker.ready;
      if (!reg) return;

      // Store swap schedule in localStorage so SW can read it
      const swapSchedule = {
        nextSwapDate: traySwapDate.toISOString(),
        daysPerTray: customSwapDays,
        enabled: true,
      };
      localStorage.setItem('alignerSwapSchedule', JSON.stringify(swapSchedule));

    };

    scheduleAlignerNotifications().catch((error) => {
      console.error("Could not schedule aligner reminders:", error);
      showMessage("The aligner reminder setting was saved, but its notification could not be scheduled.", "error", 0);
    });
  }, [alignerReminderEnabled, traySwapDate, customSwapDays]);

  // ── CHECK FOR DUE ALIGNER NOTIFICATIONS on load ──
  useEffect(() => {
    const checkAlignerNotifications = async () => {
      if (!getReminderPreference('alignerReminderEnabled')) return;
      const stored = localStorage.getItem('alignerSwapSchedule');
      if (!stored) return;
      let schedule;
      try {
        schedule = JSON.parse(stored);
      } catch (error) {
        console.error("Could not read the saved aligner reminder schedule:", error);
        showMessage("Saved aligner reminder details couldn’t be read. Review the setup on Today.", "error", 0);
        return;
      }
      if (!schedule.enabled) return;

      const swapDate = new Date(schedule.nextSwapDate);
      const now = new Date();
      const daysUntil = calendarDayDifference(swapDate, now);
      if (daysUntil === null) return;

      if (!('serviceWorker' in navigator) || !('Notification' in window)) return;
      const reg = await navigator.serviceWorker.ready;
      if (!reg || Notification.permission !== 'granted') return;

      if (daysUntil === 1) {
        await reg.showNotification('Tray swap tomorrow', {
          body: "Time to switch to your next aligner tray tomorrow. Make sure it's ready!",
          icon: '/icon-511.png',
          badge: '/icon-511.png',
          tag: 'aligner-swap-tomorrow',
        });
      } else if (daysUntil <= 0) {
        await reg.showNotification('Time to swap your tray', {
          body: "It's time to switch to your next aligner tray. Keep your treatment on track!",
          icon: '/icon-511.png',
          badge: '/icon-511.png',
          tag: 'aligner-swap-due',
        });
      }
    };
    checkAlignerNotifications().catch((error) => {
      console.error("Could not check aligner reminders:", error);
      showMessage("The aligner reminder check couldn’t complete. Review the saved date and notification permission.", "error", 0);
    });
  }, []);

  // ── DENTIST REMINDERS via Service Worker ──
  useEffect(() => {
    if (!saveReminderPreference('dentistReminderEnabled', dentistReminderEnabled)) setStorageWarning(true);
    if (!dentistReminderEnabled || !nextDentistVisit) return;

    const scheduleDentistNotifications = async () => {
      if (!('serviceWorker' in navigator)) return;
      const reg = await navigator.serviceWorker.ready;
      if (!reg || !('Notification' in window) || Notification.permission !== 'granted') return;

      const visitDate = parseCalendarDate(nextDentistVisit);
      if (!Number.isFinite(visitDate.getTime())) return;
      const now = new Date();

      const checkAndNotify = (targetDate, title, body, tag) => {
        const daysUntil = calendarDayDifference(targetDate, now);
        if (daysUntil >= 0 && daysUntil <= 1) {
          reg.showNotification(title, { body, icon: '/icon-511.png', tag })
            .catch((error) => console.error("Could not show dentist reminder:", error));
        }
      };

      checkAndNotify(
        shiftCalendarDate(visitDate, -30),
        "Dentist visit in 1 month",
        `Your appointment is on ${visitDate.toLocaleDateString(currentLanguage)}`,
        'dentist-1month'
      );
      checkAndNotify(
        shiftCalendarDate(visitDate, -14),
        "Dentist visit in 2 weeks",
        `Your appointment is on ${visitDate.toLocaleDateString(currentLanguage)}`,
        'dentist-2weeks'
      );
      checkAndNotify(
        shiftCalendarDate(visitDate, -7),
        "Dentist visit in 1 week",
        `Your appointment is on ${visitDate.toLocaleDateString(currentLanguage)}`,
        'dentist-1week'
      );
    };

    scheduleDentistNotifications().catch((error) => {
      console.error("Could not schedule dentist reminders:", error);
      showMessage("Dentist reminder details couldn’t be scheduled. Check the visit date and try again.", "error", 0);
    });
  }, [dentistReminderEnabled, nextDentistVisit, currentLanguage]);

  // ── DENTIST SCHEDULED REMINDERS DISPLAY ──
  useEffect(() => {
    if (!nextDentistVisit) { setScheduledDentistReminders([]); return; }
    const visitDate = parseCalendarDate(nextDentistVisit);
    if (!Number.isFinite(visitDate.getTime())) { setScheduledDentistReminders([]); return; }
    const remindersToSchedule = [
      { label: "1 month before", date: shiftCalendarDate(visitDate, -30), color: "bg-blue-50 border-blue-200 text-blue-700" },
      { label: "2 weeks before", date: shiftCalendarDate(visitDate, -14), color: "bg-purple-50 border-purple-200 text-purple-700" },
      { label: "1 week before",  date: shiftCalendarDate(visitDate, -7),  color: "bg-teal-50 border-teal-200 text-teal-700" },
    ];
    setScheduledDentistReminders(remindersToSchedule.map((reminder) => {
      const daysUntil = calendarDayDifference(reminder.date);
      return {
        ...reminder,
        isPast: daysUntil < 0,
        daysUntil,
        formattedDate: reminder.date.toLocaleDateString(currentLanguage, { month: "short", day: "numeric", year: "numeric" })
      };
    }));
  }, [nextDentistVisit, currentLanguage]);

  const updateTime = (key, value) => setReminders((prev) => ({ ...prev, [key]: value }));

  const ensureNotificationPermission = async () => {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") return true;
    const permission = await requestNotificationPermission();
    if (permission === "granted") {
      setNotificationsEnabled(true);
      return true;
    }
    const notice = permission === "unsupported"
      ? "This browser doesn’t support notifications. You can still keep your reminder times here."
      : permission === "denied"
        ? translatedText.notificationsBlocked || translationKeys.notificationsBlocked
        : "Notification permission wasn’t changed. You can allow it from your browser settings and try again.";
    showMessage(notice, "error", 0);
    return false;
  };

  const handleNotifications = async () => {
    if (notificationPending) return;
    setNotificationPending(true);
    try {
      if (isIOS) {
        // Check if running as installed PWA
        const isStandalone = window.navigator.standalone === true;
        if (!isStandalone) {
          showMessage("First add SmileStreak to your Home Screen: tap Share → Add to Home Screen in Safari, then open from there.", "info", 6000);
          return;
        }
      }
      if (await ensureNotificationPermission()) {
        scheduleDailyNotifications();
        setNotificationsEnabled(true);
        if (auth.currentUser) {
          setupFCMToken(auth.currentUser).catch((error) => console.error("Error setting up FCM token:", error));
        }
        showMessage(translatedText.notificationsEnabled || translationKeys.notificationsEnabled);
      }
    } catch (error) {
      console.error("Could not enable notifications:", error);
      showMessage("Notifications couldn’t be enabled. Check your browser settings and try again.", "error", 0);
    } finally {
      setNotificationPending(false);
    }
  };

  const quickSetMorning = () => { updateTime("morning", "08:00"); showMessage(translatedText.morningSet || translationKeys.morningSet, "success", 2000); };
  const quickSetNight   = () => { updateTime("night",   "21:00"); showMessage(translatedText.nightSet  || translationKeys.nightSet, "success", 2000); };
  const quickSetFloss   = () => { updateTime("floss",   "20:30"); showMessage(translatedText.flossSet  || translationKeys.flossSet, "success", 2000); };

  const handleDentistReminderToggle = async () => {
    if (notificationPending) return;
    setNotificationPending(true);
    try {
      if (!dentistReminderEnabled && !(await ensureNotificationPermission())) return;
      setDentistReminderEnabled((prev) => !prev);
      showMessage(!dentistReminderEnabled
        ? "Visit reminder saved. SmileStreak checks the date when you open Reminders."
        : "Dentist visit reminders disabled.", "success");
      if (!dentistReminderEnabled && auth.currentUser) setupFCMToken(auth.currentUser).catch((error) => console.error("Error setting up FCM token:", error));
    } catch (error) {
      console.error("Could not change dentist reminders:", error);
      showMessage("Dentist reminders couldn’t be changed. Please try again.", "error", 0);
    } finally {
      setNotificationPending(false);
    }
  };

  const handleAlignerReminderToggle = async () => {
    if (notificationPending) return;
    setNotificationPending(true);
    try {
      if (!alignerReminderEnabled && !(await ensureNotificationPermission())) return;
      setAlignerReminderEnabled((prev) => !prev);
      showMessage(!alignerReminderEnabled
        ? "Tray reminder saved. SmileStreak checks the date when you open Reminders."
        : "Aligner swap reminders disabled.", "success");
      if (!alignerReminderEnabled && auth.currentUser) setupFCMToken(auth.currentUser).catch((error) => console.error("Error setting up FCM token:", error));
    } catch (error) {
      console.error("Could not change aligner reminders:", error);
      showMessage("Aligner reminders couldn’t be changed. Please try again.", "error", 0);
    } finally {
      setNotificationPending(false);
    }
  };

  // Push all future swap reminders back by N days
  const pushRemindersBack = (days) => {
    if (!traySwapDate) return;
    const newSwapDate = new Date(traySwapDate);
    newSwapDate.setDate(newSwapDate.getDate() + days);
    setTraySwapDate(newSwapDate);

    // Update in localStorage so it persists
    try {
      const stored = localStorage.getItem('alignerSwapSchedule');
      if (stored) {
        const schedule = JSON.parse(stored);
        schedule.nextSwapDate = newSwapDate.toISOString();
        localStorage.setItem('alignerSwapSchedule', JSON.stringify(schedule));
      }
      showMessage(`All future swap reminders pushed back ${days} day${days !== 1 ? 's' : ''}.`, "success");
    } catch (error) {
      console.error("Could not save the updated aligner schedule:", error);
      setStorageWarning(true);
      showMessage("The new date is shown for now, but couldn’t be saved on this device.", "error", 0);
    }
  };

  const formatVisitDate = (iso) => {
    if (!iso) return "";
    const date = parseCalendarDate(iso);
    return Number.isFinite(date.getTime())
      ? date.toLocaleDateString(currentLanguage, { month: "long", day: "numeric", year: "numeric" })
      : "Date unavailable";
  };

  const getDaysUntilVisit = () => {
    if (!nextDentistVisit) return null;
    const visit = parseCalendarDate(nextDentistVisit);
    if (!Number.isFinite(visit.getTime())) return null;
    const targetDay = getDateFromKey(getDateKey(visit));
    const today = getDateFromKey(getDateKey());
    return Math.round((targetDay - today) / (1000 * 60 * 60 * 24));
  };

  const daysUntilSwap = traySwapDate
    ? Math.round((getDateFromKey(getDateKey(traySwapDate)) - getDateFromKey(getDateKey())) / (1000 * 60 * 60 * 24))
    : null;
  const daysUntilVisit = getDaysUntilVisit();

  if (translating || Object.keys(translatedText).length === 0) {
    return (
      <section className="space-y-6 pb-8">
        <div className="page-heading-surface">
          <div className="animate-pulse flex items-center gap-2">
            <Bell className="w-6 h-6" />
            <h2 className="text-2xl font-black">Loading...</h2>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6 pb-8">

      {/* Header */}
      <div className="page-heading-surface relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-black">{translatedText.title}</h2>
          </div>
          <p className="text-sm opacity-90">{translatedText.subtitle}</p>
        </div>
      </div>

      {storageWarning && (
        <p className="reminder-storage-warning" role="alert">
          Reminder changes may not persist on this device. Check browser storage settings before leaving this page.
        </p>
      )}

      {/* Notification Status */}
      <div className={`reminder-notification-status rounded-xl p-5 border ${notificationsEnabled ? "is-enabled" : "is-disabled"}`}>
        <div className="flex items-center gap-3">
          {notificationsEnabled ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-[var(--brand)]" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-bold text-gray-900">{translatedText.notificationsActive}</p>
                <p className="text-xs text-gray-600">{translatedText.notificationsActiveDesc}</p>
              </div>
            </>
          ) : (
            <>
              <BellOff className="w-5 h-5 text-slate-500" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-bold text-gray-900">{translatedText.enableNotifications}</p>
                <p className="text-xs text-gray-600">{translatedText.enableNotificationsDesc}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* iOS Home Screen Notice — only show if on iOS and NOT standalone */}
      {isIOS && window.navigator.standalone !== true && (
        <div className="reminder-ios-notice bg-blue-50 border-2 border-blue-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-slate-600 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="font-bold text-gray-900 text-sm mb-1">Enable iPhone Notifications</p>
              <p className="text-xs text-gray-600 leading-relaxed">To get reminders on iPhone:</p>
              <ol className="text-xs text-gray-600 mt-2 space-y-1 list-decimal list-inside">
                <li>Tap the <strong>Share</strong> button in Safari</li>
                <li>Tap <strong>Add to Home Screen</strong></li>
                <li>Open SmileStreak from your home screen</li>
                <li>Tap Enable Notifications below</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="reminder-quick-setup">
        <div className="flex items-baseline justify-between gap-4 mb-3">
          <h3 className="font-semibold text-gray-900">{translatedText.quickSetup}</h3>
          <span className="text-xs text-slate-500">{translatedText.morning} · {translatedText.night} · {translatedText.floss}</span>
        </div>
        <div className="reminder-quick-set grid grid-cols-3">
          <button onClick={quickSetMorning} className="reminder-preset">
            <span>{translatedText.morning}</span>
            <strong>8:00 AM</strong>
          </button>
          <button onClick={quickSetNight} className="reminder-preset">
            <span>{translatedText.night}</span>
            <strong>9:00 PM</strong>
          </button>
          <button onClick={quickSetFloss} className="reminder-preset">
            <span>{translatedText.floss}</span>
            <strong>8:30 PM</strong>
          </button>
        </div>
      </div>

      {/* Reminder Stats */}
      <dl className="reminder-stat-strip grid grid-cols-2">
        <div>
          <dt>{translatedText.onTimeActions}</dt>
          <dd>{reminderStats.onTimeCount}</dd>
          <small>{translatedText.onTimeActionsDesc}</small>
        </div>
        <div>
          <dt>{translatedText.reminderStreak}</dt>
          <dd>{reminderStats.streak}</dd>
          <small>{translatedText.reminderStreakDesc}</small>
        </div>
      </dl>

      {/* Custom Reminders */}
      <section className="reminder-feature-section reminder-custom-times space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-gray-900">{translatedText.customTimes}</h3>
        </div>
        <ReminderRow label={translatedText.morningBrush} icon={<Sun className="w-5 h-5 text-slate-600" />} time={reminders.morning} onChange={(v) => updateTime("morning", v)} />
        <ReminderRow label={translatedText.nightBrush}   icon={<Moon className="w-5 h-5 text-slate-600" />} time={reminders.night}   onChange={(v) => updateTime("night", v)} />
        <ReminderRow label={translatedText.flossTime}    icon={<Activity className="w-5 h-5 text-slate-600" />} time={reminders.floss}  onChange={(v) => updateTime("floss", v)} />
      </section>

      {/* ── ALIGNER TRAY SWAP REMINDER ── */}
      <section className="reminder-feature-section reminder-aligner-section space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-gray-900">Aligner Tray Swap Reminder</h3>
        </div>

        {!alignerData ? (
          <div className="reminder-empty-state">
            <p className="text-sm text-blue-600 font-medium">No aligner treatment set up yet</p>
            <p className="text-xs text-blue-400 mt-1">Set up your treatment on the Today page to enable swap reminders</p>
          </div>
        ) : (
          <>
            {/* Next swap info */}
            <div className={`reminder-date-status rounded-xl p-4 border-2 ${
              daysUntilSwap !== null && daysUntilSwap <= 0 ? "bg-red-50 border-red-200" :
              daysUntilSwap !== null && daysUntilSwap <= 2 ? "bg-amber-50 border-amber-200" :
              "bg-blue-50 border-blue-200"
            }`}>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" aria-hidden="true" />
                <div>
                  <p className="font-bold text-gray-900 text-sm">
                    {daysUntilSwap !== null && daysUntilSwap <= 0
                      ? "Time to swap your tray"
                      : daysUntilSwap === 1
                      ? "Swap your tray tomorrow"
                      : `Next tray swap in ${daysUntilSwap} days`}
                  </p>
                  {traySwapDate && (
                    <p className="text-xs text-gray-600 mt-0.5">{formatVisitDate(traySwapDate.toISOString())}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Every {customSwapDays} days · Tray {alignerData.tray} of {alignerData.totalTrays}</p>
                </div>
              </div>
            </div>

            {/* Toggle */}
            <div className="reminder-switch-row flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200">
              <div className="flex items-center gap-3">
                <div className={`reminder-switch-icon w-8 h-8 rounded-md flex items-center justify-center ${alignerReminderEnabled ? "is-enabled" : "is-disabled"}`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Tray Swap Reminder</p>
                  <p className="text-xs text-gray-500">{alignerReminderEnabled ? "Reminders on" : "Reminders off"}</p>
                </div>
              </div>
              <button
                onClick={handleAlignerReminderToggle}
                type="button"
                role="switch"
                aria-checked={alignerReminderEnabled}
                aria-label="Aligner tray swap reminders"
                disabled={notificationPending}
                aria-busy={notificationPending}
                className={`reminder-toggle relative w-12 h-6 rounded-full transition-all duration-300 ${alignerReminderEnabled ? "bg-blue-500" : "bg-gray-300"}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${alignerReminderEnabled ? "left-6" : "left-0.5"}`} />
              </button>
            </div>

            {/* Push back buttons — the Harvard dentist's key suggestion */}
            {alignerReminderEnabled && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Running behind? Push all reminders back:</p>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 7].map(days => (
                    <button
                      key={days}
                      onClick={() => pushRemindersBack(days)}
                      className="reminder-adjust-action py-2.5 rounded-xl text-xs font-bold bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600 border border-blue-200 hover:border-blue-400 transition-all"
                    >
                      +{days}d
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming swap schedule */}
            {alignerReminderEnabled && traySwapDate && (
              <div className="reminder-schedule-list space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Upcoming Swaps</p>
                {[0, 1, 2].map(i => {
                  const swapD = new Date(traySwapDate);
                  swapD.setDate(swapD.getDate() + i * customSwapDays);
                  const trayNum = Math.min((alignerData.tray || 1) + i, alignerData.totalTrays);
                  const dUntil = calendarDayDifference(swapD);
                  return (
                    <div key={i} className="reminder-schedule-row flex items-center justify-between p-3 rounded-xl border bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-100">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-500" aria-hidden="true" />
                        <div>
                          <p className="text-xs font-bold text-blue-700">Tray {trayNum}</p>
                          <p className="text-xs text-gray-500">{swapD.toLocaleDateString(currentLanguage, { month: "short", day: "numeric" })}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-blue-600">{dUntil <= 0 ? "Today!" : `in ${dUntil}d`}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>

      {/* ── DENTIST VISIT REMINDER ── */}
      <section className="reminder-feature-section reminder-dentist-section space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-5 h-5 text-teal-600" />
          <h3 className="font-bold text-gray-900">Dentist Visit Reminder</h3>
        </div>

        {nextDentistVisit ? (
          <div className={`reminder-date-status rounded-xl p-4 border-2 ${
            daysUntilVisit !== null && daysUntilVisit <= 0 ? "bg-red-50 border-red-200" :
            daysUntilVisit !== null && daysUntilVisit <= 30 ? "bg-amber-50 border-amber-200" :
            "bg-teal-50 border-teal-200"
          }`}>
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" aria-hidden="true" />
              <div>
                <p className="font-bold text-gray-900 text-sm">
                  {daysUntilVisit !== null && daysUntilVisit <= 0 ? "Dentist visit overdue" :
                   daysUntilVisit !== null && daysUntilVisit <= 7 ? `Visit in ${daysUntilVisit} days` :
                   `Next visit in ${daysUntilVisit} days`}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">{formatVisitDate(nextDentistVisit)}</p>
                {lastDentistVisit && <p className="text-xs text-gray-400 mt-1">Last visit: {formatVisitDate(lastDentistVisit)}</p>}
              </div>
            </div>
          </div>
        ) : (
          <div className="reminder-empty-state">
            <p className="text-sm text-teal-600 font-medium">No dentist visit logged yet</p>
            <p className="text-xs text-teal-500 mt-1">Log a visit on the Today page to enable reminders</p>
          </div>
        )}

        <div className="reminder-switch-row flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200">
          <div className="flex items-center gap-3">
            <div className={`reminder-switch-icon w-8 h-8 rounded-md flex items-center justify-center ${dentistReminderEnabled ? "is-enabled" : "is-disabled"}`}>
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Dentist Visit Reminder</p>
              <p className="text-xs text-gray-500">{dentistReminderEnabled ? "Reminders on" : "Reminders off"}</p>
            </div>
          </div>
          <button
            onClick={handleDentistReminderToggle}
            type="button"
            role="switch"
            aria-checked={dentistReminderEnabled}
            aria-label="Dentist visit reminders"
            disabled={!nextDentistVisit || notificationPending}
            aria-busy={notificationPending}
            className={`reminder-toggle relative w-12 h-6 rounded-full transition-all duration-300 ${dentistReminderEnabled ? "bg-teal-500" : "bg-gray-300"} ${!nextDentistVisit || notificationPending ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${dentistReminderEnabled ? "left-6" : "left-0.5"}`} />
          </button>
        </div>

        {nextDentistVisit && dentistReminderEnabled && scheduledDentistReminders.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Scheduled Reminders</p>
            {scheduledDentistReminders.map((r, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${r.color} ${r.isPast ? "opacity-40" : ""}`}>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-bold">{r.label}</p>
                    <p className="text-xs opacity-75">{r.formattedDate}</p>
                  </div>
                </div>
                <div className="text-right">
                  {r.isPast ? <span className="text-xs font-semibold opacity-60">Passed</span> : <span className="text-xs font-bold">in {r.daysUntil}d</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {nextDentistVisit && !dentistReminderEnabled && (
          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500">Enable the toggle above to get reminders 1 month, 2 weeks, and 1 week before your visit.</p>
          </div>
        )}
      </section>

      {/* Enable Button */}
      {!notificationsEnabled && (
        <button onClick={handleNotifications} disabled={notificationPending} aria-busy={notificationPending} className="reminder-enable-action w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2">
          <Bell className="w-5 h-5" />
          {notificationPending ? (translatedText.checkingNotifications || "Checking notifications…") : translatedText.enableButton}
        </button>
      )}

      {/* Message */}
      {message && (
        <div className={`reminder-feedback reminder-feedback--${messageTone} bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center`} role={messageTone === "error" ? "alert" : "status"} aria-live={messageTone === "error" ? "assertive" : "polite"}>
          <p className="text-sm text-gray-700 font-medium">{message}</p>
        </div>
      )}

      {/* Tips */}
      <aside className="reminder-help-note bg-slate-50 border border-purple-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-bold text-gray-900 text-sm mb-2">{translatedText.tipsTitle}</p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>{translatedText.tip1}</li>
              <li>{translatedText.tip2}</li>
              <li>{translatedText.tip3}</li>
            </ul>
          </div>
        </div>
      </aside>

      {/* iOS Notice — only show if installed as PWA */}
      {isIOS && window.navigator.standalone === true && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-900 text-sm mb-1">{translatedText.iosTitle}</p>
              <p className="text-xs text-gray-600">{translatedText.iosMessage}</p>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}

function ReminderRow({ label, icon, time, onChange }) {
  return (
    <div className="reminder-time-row flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200">
      <div className="flex items-center gap-3">
        {icon}
        <p className="font-semibold text-gray-900">{label}</p>
      </div>
      <input type="time" value={time} aria-label={`Reminder time for ${label}`} onChange={(e) => onChange(e.target.value)}
        className="reminder-time-input border-2 border-blue-200 rounded-xl px-4 py-2 text-sm font-semibold transition-colors" />
    </div>
  );
}
