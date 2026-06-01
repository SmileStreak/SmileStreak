import { scheduleDailyNotifications } from "../utils/scheduleNotifications";
import { useState, useEffect, useContext } from "react";
import { getReminders, saveReminders } from "../utils/reminders";
import { requestNotificationPermission } from "../utils/notifications";
import { Bell, BellOff, Clock, Sparkles, Zap, CheckCircle2, TrendingUp, Moon, Sun, Activity, Calendar, AlertCircle } from "lucide-react";
import { TranslationContext } from "../App";

const isIOS = /iPhone|iPad|iPo/.test(navigator.userAgent);

export default function Reminders() {
  const { t, currentLanguage, translating } = useContext(TranslationContext);
  
  const [reminders, setReminders] = useState(getReminders());
  const [message, setMessage] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderStats, setReminderStats] = useState({ onTimeCount: 0, streak: 0 });
  const [translatedText, setTranslatedText] = useState({});

  // ── DENTIST REMINDER STATE ──
  const [dentistReminderEnabled, setDentistReminderEnabled] = useState(
    () => JSON.parse(localStorage.getItem('dentistReminderEnabled') || 'false')
  );
  const [nextDentistVisit, setNextDentistVisit] = useState(null);
  const [lastDentistVisit, setLastDentistVisit] = useState(null);
  const [scheduledDentistReminders, setScheduledDentistReminders] = useState([]);

  // ── ALIGNER REMINDER STATE ──
  const [alignerReminderEnabled, setAlignerReminderEnabled] = useState(
    () => JSON.parse(localStorage.getItem('alignerReminderEnabled') || 'false')
  );
  const [alignerData, setAlignerData] = useState(null);
  const [traySwapDate, setTraySwapDate] = useState(null);
  const [showAlignerReminderSettings, setShowAlignerReminderSettings] = useState(false);
  const [customSwapDays, setCustomSwapDays] = useState(14);

  const translationKeys = {
    title: "Reminders",
    subtitle: "Stay on track with smart notifications",
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
    tipsTitle: "Reminder Tips",
    tip1: "• Set reminders 30 minutes before meals for best results",
    tip2: "• Night reminders work best 1 hour before bed",
    tip3: "• Consistent timing builds stronger habits",
    iosTitle: "iPhone Users",
    iosMessage: "For notifications to work on iPhone, add SmileStreak to your home screen via Safari's Share menu, then enable notifications inside the app.",
    iosNotificationMessage: "📱 Add SmileStreak to your Home Screen via Safari Share → Add to Home Screen, then re-enable notifications.",
    notificationsEnabled: "✅ Notifications enabled successfully!",
    notificationsBlocked: "❌ Notifications blocked. Please enable in browser settings.",
    morningSet: "⏰ Morning reminder set to 8:00 AM",
    nightSet: "🌙 Night reminder set to 9:00 PM",
    flossSet: "🧵 Floss reminder set to 8:30 PM"
  };

  useEffect(() => {
    const loadTranslations = async () => {
      const translations = {};
      for (const [key, value] of Object.entries(translationKeys)) {
        translations[key] = await t(value);
      }
      setTranslatedText(translations);
    };
    loadTranslations();
  }, [currentLanguage, t]);

  useEffect(() => { saveReminders(reminders); }, [reminders]);

  useEffect(() => {
    const stats = JSON.parse(localStorage.getItem('reminderStats') || '{"onTimeCount": 0, "streak": 0}');
    setReminderStats(stats);
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
            setCustomSwapDays(aligner.daysPerTray || 14);
            // Calculate next tray swap date
            const start = new Date(aligner.startDate);
            const now = new Date();
            const daysSinceStart = Math.floor((now - start) / (1000 * 60 * 60 * 24));
            const daysOnCurrentTray = daysSinceStart % aligner.daysPerTray;
            const daysUntilSwap = aligner.daysPerTray - daysOnCurrentTray;
            const swapDate = new Date();
            swapDate.setDate(swapDate.getDate() + daysUntilSwap);
            setTraySwapDate(swapDate);
          }
        }
      } catch (e) {
        console.error('Error loading data:', e);
      }
    };
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, []);

  // ── SCHEDULE ALIGNER NOTIFICATIONS via Service Worker ──
  useEffect(() => {
    localStorage.setItem('alignerReminderEnabled', JSON.stringify(alignerReminderEnabled));
    if (!alignerReminderEnabled || !traySwapDate) return;

    const scheduleAlignerNotifications = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      const reg = await navigator.serviceWorker.ready;
      if (!reg) return;

      // Store swap schedule in localStorage so SW can read it
      const swapSchedule = {
        nextSwapDate: traySwapDate.toISOString(),
        daysPerTray: customSwapDays,
        enabled: true,
      };
      localStorage.setItem('alignerSwapSchedule', JSON.stringify(swapSchedule));

      // Show a confirmation notification now via SW
      if (Notification.permission === 'granted') {
        reg.showNotification('😁 Aligner Reminder Set', {
          body: `We'll remind you to swap trays on ${traySwapDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`,
          icon: '/icon-511.png',
          badge: '/icon-511.png',
          tag: 'aligner-swap-confirmation',
        });
      }
    };

    scheduleAlignerNotifications();
  }, [alignerReminderEnabled, traySwapDate, customSwapDays]);

  // ── CHECK FOR DUE ALIGNER NOTIFICATIONS on load ──
  useEffect(() => {
    const checkAlignerNotifications = async () => {
      const stored = localStorage.getItem('alignerSwapSchedule');
      if (!stored) return;
      const schedule = JSON.parse(stored);
      if (!schedule.enabled) return;

      const swapDate = new Date(schedule.nextSwapDate);
      const now = new Date();
      const daysUntil = Math.ceil((swapDate - now) / (1000 * 60 * 60 * 24));

      if (!('serviceWorker' in navigator)) return;
      const reg = await navigator.serviceWorker.ready;
      if (!reg || Notification.permission !== 'granted') return;

      if (daysUntil === 1) {
        reg.showNotification('😁 Tray Swap Tomorrow!', {
          body: "Time to switch to your next aligner tray tomorrow. Make sure it's ready!",
          icon: '/icon-511.png',
          badge: '/icon-511.png',
          tag: 'aligner-swap-tomorrow',
        });
      } else if (daysUntil <= 0) {
        reg.showNotification('😁 Time to Swap Your Tray!', {
          body: "It's time to switch to your next aligner tray. Keep your treatment on track!",
          icon: '/icon-511.png',
          badge: '/icon-511.png',
          tag: 'aligner-swap-due',
        });
      }
    };
    checkAlignerNotifications();
  }, []);

  // ── DENTIST REMINDERS via Service Worker ──
  useEffect(() => {
    localStorage.setItem('dentistReminderEnabled', JSON.stringify(dentistReminderEnabled));
    if (!dentistReminderEnabled || !nextDentistVisit) return;

    const scheduleDentistNotifications = async () => {
      if (!('serviceWorker' in navigator)) return;
      const reg = await navigator.serviceWorker.ready;
      if (!reg || Notification.permission !== 'granted') return;

      const visitDate = new Date(nextDentistVisit);
      const now = new Date();

      const checkAndNotify = (targetDate, title, body, tag) => {
        const daysUntil = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));
        if (daysUntil >= 0 && daysUntil <= 1) {
          reg.showNotification(title, { body, icon: '/icon-511.png', tag });
        }
      };

      checkAndNotify(
        new Date(visitDate.getTime() - 30 * 24 * 60 * 60 * 1000),
        "🦷 Dentist Visit in 1 Month",
        `Your appointment is on ${visitDate.toLocaleDateString()}`,
        'dentist-1month'
      );
      checkAndNotify(
        new Date(visitDate.getTime() - 14 * 24 * 60 * 60 * 1000),
        "🦷 Dentist Visit in 2 Weeks",
        `Your appointment is on ${visitDate.toLocaleDateString()}`,
        'dentist-2weeks'
      );
      checkAndNotify(
        new Date(visitDate.getTime() - 7 * 24 * 60 * 60 * 1000),
        "🦷 Dentist Visit in 1 Week",
        `Your appointment is on ${visitDate.toLocaleDateString()}`,
        'dentist-1week'
      );
    };

    scheduleDentistNotifications();
  }, [dentistReminderEnabled, nextDentistVisit]);

  // ── DENTIST SCHEDULED REMINDERS DISPLAY ──
  useEffect(() => {
    if (!nextDentistVisit) { setScheduledDentistReminders([]); return; }
    const visitDate = new Date(nextDentistVisit);
    const now = new Date();
    const remindersToSchedule = [
      { label: "1 month before", emoji: "📅", date: new Date(visitDate.getTime() - 30 * 24 * 60 * 60 * 1000), color: "bg-blue-50 border-blue-200 text-blue-700" },
      { label: "2 weeks before", emoji: "🗓️", date: new Date(visitDate.getTime() - 14 * 24 * 60 * 60 * 1000), color: "bg-purple-50 border-purple-200 text-purple-700" },
      { label: "1 week before",  emoji: "⏰", date: new Date(visitDate.getTime() - 7 * 24 * 60 * 60 * 1000),  color: "bg-teal-50 border-teal-200 text-teal-700" },
    ];
    setScheduledDentistReminders(remindersToSchedule.map(r => ({
      ...r,
      isPast: r.date < now,
      daysUntil: Math.ceil((r.date - now) / (1000 * 60 * 60 * 24)),
      formattedDate: r.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    })));
  }, [nextDentistVisit]);

  const updateTime = (key, value) => setReminders((prev) => ({ ...prev, [key]: value }));

  const handleNotifications = async () => {
    if (isIOS) {
      // Check if running as installed PWA
      const isStandalone = window.navigator.standalone === true;
      if (!isStandalone) {
        setMessage("📱 First add SmileStreak to your Home Screen: tap Share → Add to Home Screen in Safari, then open from there.");
        setTimeout(() => setMessage(""), 6000);
        return;
      }
    }
    const permission = await requestNotificationPermission();
    if (permission === "granted") {
      scheduleDailyNotifications();
      setNotificationsEnabled(true);
      setMessage(translatedText.notificationsEnabled || translationKeys.notificationsEnabled);
      setTimeout(() => setMessage(""), 3000);
    } else if (permission === "denied") {
      setMessage(translatedText.notificationsBlocked || translationKeys.notificationsBlocked);
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const quickSetMorning = () => { updateTime("morning", "08:00"); setMessage(translatedText.morningSet || translationKeys.morningSet); setTimeout(() => setMessage(""), 2000); };
  const quickSetNight   = () => { updateTime("night",   "21:00"); setMessage(translatedText.nightSet  || translationKeys.nightSet);  setTimeout(() => setMessage(""), 2000); };
  const quickSetFloss   = () => { updateTime("floss",   "20:30"); setMessage(translatedText.flossSet  || translationKeys.flossSet);  setTimeout(() => setMessage(""), 2000); };

  const handleDentistReminderToggle = async () => {
    if (!dentistReminderEnabled && Notification.permission !== 'granted') {
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        setMessage("❌ Please enable notifications first.");
        setTimeout(() => setMessage(""), 4000);
        return;
      }
      setNotificationsEnabled(true);
    }
    setDentistReminderEnabled(prev => !prev);
    setMessage(!dentistReminderEnabled ? "🦷 Dentist visit reminders enabled!" : "🔕 Dentist visit reminders disabled.");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleAlignerReminderToggle = async () => {
    if (!alignerReminderEnabled && Notification.permission !== 'granted') {
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        setMessage("❌ Please enable notifications first.");
        setTimeout(() => setMessage(""), 4000);
        return;
      }
      setNotificationsEnabled(true);
    }
    setAlignerReminderEnabled(prev => !prev);
    setMessage(!alignerReminderEnabled ? "😁 Aligner swap reminders enabled!" : "🔕 Aligner swap reminders disabled.");
    setTimeout(() => setMessage(""), 3000);
  };

  // Push all future swap reminders back by N days
  const pushRemindersBack = (days) => {
    if (!traySwapDate) return;
    const newSwapDate = new Date(traySwapDate);
    newSwapDate.setDate(newSwapDate.getDate() + days);
    setTraySwapDate(newSwapDate);

    // Update in localStorage so it persists
    const stored = localStorage.getItem('alignerSwapSchedule');
    if (stored) {
      const schedule = JSON.parse(stored);
      schedule.nextSwapDate = newSwapDate.toISOString();
      localStorage.setItem('alignerSwapSchedule', JSON.stringify(schedule));
    }
    setMessage(`✅ All future swap reminders pushed back ${days} day${days !== 1 ? 's' : ''}`);
    setTimeout(() => setMessage(""), 3000);
  };

  const formatVisitDate = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  const getDaysUntilVisit = () => {
    if (!nextDentistVisit) return null;
    return Math.ceil((new Date(nextDentistVisit) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const daysUntilSwap = traySwapDate ? Math.ceil((traySwapDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const daysUntilVisit = getDaysUntilVisit();

  if (translating || Object.keys(translatedText).length === 0) {
    return (
      <section className="space-y-6 pb-8">
        <div className="bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-500 text-white rounded-3xl p-6 shadow-xl">
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
      <div className="bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-500 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-6 h-6" />
            <h2 className="text-2xl font-black">{translatedText.title}</h2>
          </div>
          <p className="text-sm opacity-90">{translatedText.subtitle}</p>
        </div>
      </div>

      {/* Notification Status */}
      <div className={`rounded-2xl p-5 border-2 ${notificationsEnabled ? "bg-green-50 border-green-300" : "bg-orange-50 border-orange-300"}`}>
        <div className="flex items-center gap-3">
          {notificationsEnabled ? (
            <>
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{translatedText.notificationsActive}</p>
                <p className="text-xs text-gray-600">{translatedText.notificationsActiveDesc}</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                <BellOff className="w-5 h-5 text-white" />
              </div>
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
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📱</span>
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
      <div className="bg-white rounded-3xl p-5 shadow-lg border border-blue-100">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-gray-900">{translatedText.quickSetup}</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <button onClick={quickSetMorning} className="group p-4 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 hover:shadow-md hover:-translate-y-1 transition-all">
            <Sun className="w-6 h-6 text-orange-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-semibold text-gray-700">{translatedText.morning}</p>
            <p className="text-xs text-gray-500">8:00 AM</p>
          </button>
          <button onClick={quickSetNight} className="group p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 hover:shadow-md hover:-translate-y-1 transition-all">
            <Moon className="w-6 h-6 text-indigo-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-semibold text-gray-700">{translatedText.night}</p>
            <p className="text-xs text-gray-500">9:00 PM</p>
          </button>
          <button onClick={quickSetFloss} className="group p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 hover:shadow-md hover:-translate-y-1 transition-all">
            <Activity className="w-6 h-6 text-cyan-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-semibold text-gray-700">{translatedText.floss}</p>
            <p className="text-xs text-gray-500">8:30 PM</p>
          </button>
        </div>
      </div>

      {/* Reminder Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-md border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <p className="text-xs text-gray-500">{translatedText.onTimeActions}</p>
          </div>
          <p className="text-3xl font-black text-gray-900">{reminderStats.onTimeCount}</p>
          <p className="text-xs text-gray-500 mt-1">{translatedText.onTimeActionsDesc}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-md border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <p className="text-xs text-gray-500">{translatedText.reminderStreak}</p>
          </div>
          <p className="text-3xl font-black text-gray-900">{reminderStats.streak}</p>
          <p className="text-xs text-gray-500 mt-1">{translatedText.reminderStreakDesc}</p>
        </div>
      </div>

      {/* Custom Reminders */}
      <div className="bg-white rounded-3xl p-5 shadow-lg border border-blue-100 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-gray-900">{translatedText.customTimes}</h3>
        </div>
        <ReminderRow label={translatedText.morningBrush} icon={<Sun className="w-5 h-5 text-orange-500" />} time={reminders.morning} onChange={(v) => updateTime("morning", v)} />
        <ReminderRow label={translatedText.nightBrush}   icon={<Moon className="w-5 h-5 text-indigo-500" />} time={reminders.night}   onChange={(v) => updateTime("night", v)} />
        <ReminderRow label={translatedText.flossTime}    icon={<Activity className="w-5 h-5 text-cyan-500" />} time={reminders.floss}  onChange={(v) => updateTime("floss", v)} />
      </div>

      {/* ── ALIGNER TRAY SWAP REMINDER ── */}
      <div className="bg-white rounded-3xl p-5 shadow-lg border border-blue-100 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">😁</span>
          <h3 className="font-bold text-gray-900">Aligner Tray Swap Reminder</h3>
        </div>

        {!alignerData ? (
          <div className="rounded-xl p-4 border-2 border-dashed border-blue-200 bg-blue-50 text-center">
            <p className="text-sm text-blue-600 font-medium">No aligner treatment set up yet</p>
            <p className="text-xs text-blue-400 mt-1">Set up your treatment on the Today page to enable swap reminders</p>
          </div>
        ) : (
          <>
            {/* Next swap info */}
            <div className={`rounded-xl p-4 border-2 ${
              daysUntilSwap !== null && daysUntilSwap <= 0 ? "bg-red-50 border-red-200" :
              daysUntilSwap !== null && daysUntilSwap <= 2 ? "bg-amber-50 border-amber-200" :
              "bg-blue-50 border-blue-200"
            }`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">😁</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm">
                    {daysUntilSwap !== null && daysUntilSwap <= 0
                      ? "⚠️ Time to swap your tray!"
                      : daysUntilSwap === 1
                      ? "🔔 Swap your tray tomorrow!"
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
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${alignerReminderEnabled ? "bg-blue-500" : "bg-gray-300"}`}>
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Tray Swap Reminder</p>
                  <p className="text-xs text-gray-500">{alignerReminderEnabled ? "Reminders on" : "Reminders off"}</p>
                </div>
              </div>
              <button
                onClick={handleAlignerReminderToggle}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${alignerReminderEnabled ? "bg-blue-500" : "bg-gray-300"}`}
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
                      className="py-2.5 rounded-xl text-xs font-bold bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600 border border-blue-200 hover:border-blue-400 transition-all"
                    >
                      +{days}d
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming swap schedule */}
            {alignerReminderEnabled && traySwapDate && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Upcoming Swaps</p>
                {[0, 1, 2].map(i => {
                  const swapD = new Date(traySwapDate);
                  swapD.setDate(swapD.getDate() + i * customSwapDays);
                  const trayNum = Math.min((alignerData.tray || 1) + i, alignerData.totalTrays);
                  const dUntil = Math.ceil((swapD - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl border bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-100">
                      <div className="flex items-center gap-2">
                        <span>😁</span>
                        <div>
                          <p className="text-xs font-bold text-blue-700">Tray {trayNum}</p>
                          <p className="text-xs text-gray-500">{swapD.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
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
      </div>

      {/* ── DENTIST VISIT REMINDER ── */}
      <div className="bg-white rounded-3xl p-5 shadow-lg border border-teal-100 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-5 h-5 text-teal-600" />
          <h3 className="font-bold text-gray-900">Dentist Visit Reminder</h3>
        </div>

        {nextDentistVisit ? (
          <div className={`rounded-xl p-4 border-2 ${
            daysUntilVisit !== null && daysUntilVisit <= 0 ? "bg-red-50 border-red-200" :
            daysUntilVisit !== null && daysUntilVisit <= 30 ? "bg-amber-50 border-amber-200" :
            "bg-teal-50 border-teal-200"
          }`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🦷</span>
              <div>
                <p className="font-bold text-gray-900 text-sm">
                  {daysUntilVisit !== null && daysUntilVisit <= 0 ? "⚠️ Dentist visit overdue!" :
                   daysUntilVisit !== null && daysUntilVisit <= 7 ? `🔔 Visit in ${daysUntilVisit} days!` :
                   `Next visit in ${daysUntilVisit} days`}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">{formatVisitDate(nextDentistVisit)}</p>
                {lastDentistVisit && <p className="text-xs text-gray-400 mt-1">Last visit: {formatVisitDate(lastDentistVisit)}</p>}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl p-4 border-2 border-dashed border-teal-200 bg-teal-50 text-center">
            <p className="text-sm text-teal-600 font-medium">No dentist visit logged yet</p>
            <p className="text-xs text-teal-500 mt-1">Log a visit on the Today page to enable reminders</p>
          </div>
        )}

        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dentistReminderEnabled ? "bg-teal-500" : "bg-gray-300"}`}>
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Dentist Visit Reminder</p>
              <p className="text-xs text-gray-500">{dentistReminderEnabled ? "Reminders on" : "Reminders off"}</p>
            </div>
          </div>
          <button
            onClick={handleDentistReminderToggle}
            disabled={!nextDentistVisit}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 ${dentistReminderEnabled ? "bg-teal-500" : "bg-gray-300"} ${!nextDentistVisit ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
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
                  <span>{r.emoji}</span>
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
      </div>

      {/* Enable Button */}
      {!notificationsEnabled && (
        <button onClick={handleNotifications} className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-5 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
          <Bell className="w-5 h-5" />
          {translatedText.enableButton}
        </button>
      )}

      {/* Message */}
      {message && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
          <p className="text-sm text-gray-700 font-medium">{message}</p>
        </div>
      )}

      {/* Tips */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-gray-900 text-sm mb-2">{translatedText.tipsTitle}</p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>{translatedText.tip1}</li>
              <li>{translatedText.tip2}</li>
              <li>{translatedText.tip3}</li>
            </ul>
          </div>
        </div>
      </div>

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
    <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200">
      <div className="flex items-center gap-3">
        {icon}
        <p className="font-semibold text-gray-900">{label}</p>
      </div>
      <input type="time" value={time} onChange={(e) => onChange(e.target.value)}
        className="border-2 border-blue-200 rounded-xl px-4 py-2 text-sm font-semibold hover:border-blue-400 focus:border-blue-500 focus:outline-none transition-colors" />
    </div>
  );
}
