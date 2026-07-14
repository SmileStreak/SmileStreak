import { logEvent } from "firebase/analytics";
import { analytics } from "../firebase";
import { useEffect, useState, useContext, useRef, useCallback } from "react";
import { getDateKey, getYesterdayKey } from "../utils/date.js";
import { calculateStreaks } from "../utils/streak.js";
import { translateBatch } from "../utils/translate.js";
import {
Clock, CheckCircle2, Circle, Share2, Heart,
Sparkles, Droplets, Sun, Moon, Smile, Zap, TrendingUp
} from "lucide-react";
import { TranslationContext } from "../App";

const BRUSH_TIME = 120;
const RECOVERY_KEY = "__lastRecoveryUsed";
const WATER_GOAL_OZ = 64;
const ALIGNER_GOAL_HOURS = 22;

// ── LEADERBOARD POINTS HELPER ──
const updateLeaderboardPoints = async (userId, dayData, habitData) => {
  if (!userId) return;
  
  try {
    const { doc, setDoc, getDoc } = await import("firebase/firestore");
    const { db } = await import("../firebase");
    
    // Get current leaderboard data
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    let currentWeeklyPoints = 0;
    let currentStreak = 0;
    let perfectDays = 0;
    let existingDayData = {};
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      currentWeeklyPoints = data.leaderboard?.weeklyPoints || 0;
      currentStreak = data.leaderboard?.currentStreak || 0;
      perfectDays = data.leaderboard?.perfectDays || 0;
      existingDayData = data.habitData?.[getDateKey()] || {};
    }
    
    // ── CALCULATE POINTS FOR TODAY ──
    // We need to know what changed from the previous state
    const previousCompleted = ["morning", "night", "floss"].filter(k => existingDayData[k]).length;
    const newCompleted = ["morning", "night", "floss"].filter(k => dayData[k]).length;
    
    // Calculate points for habits that were just completed (went from false to true)
    let pointsToAdd = 0;
    let perfectBonusAwarded = false;
    
    // Check each habit
    if (dayData.morning && !existingDayData.morning) pointsToAdd += 10;
    if (dayData.night && !existingDayData.night) pointsToAdd += 10;
    if (dayData.floss && !existingDayData.floss) pointsToAdd += 15;
    
    // Perfect day bonus: only if all 3 are now complete AND they weren't all complete before
    const wasPerfect = previousCompleted === 3;
    const isNowPerfect = newCompleted === 3;
    if (isNowPerfect && !wasPerfect) {
      pointsToAdd += 15;
      perfectBonusAwarded = true;
    }
    
    // ── UPDATE WEEKLY POINTS ──
    // Only add points, never subtract (we only add when habits are completed)
    const newWeeklyPoints = currentWeeklyPoints + pointsToAdd;
    
    // ── UPDATE STREAK ──
    // Recalculate streak from the current habitData
    const { currentStreak: newStreak } = calculateStreaks(habitData);
    
    // ── UPDATE PERFECT DAYS ──
    // Count perfect days from habitData
    let actualPerfectDays = 0;
    Object.keys(habitData).forEach(key => {
      if (!key.startsWith("__")) {
        const day = habitData[key];
        if (day && day.morning && day.night && day.floss) {
          actualPerfectDays++;
        }
      }
    });
    
    // ── SAVE TO FIRESTORE ──
    await setDoc(userRef, {
      leaderboard: {
        weeklyPoints: newWeeklyPoints,
        currentStreak: newStreak,
        perfectDays: actualPerfectDays,
        lastUpdated: new Date().toISOString()
      }
    }, { merge: true });
    
    console.log(`🏆 Points added: +${pointsToAdd} (${perfectBonusAwarded ? 'incl. +15 perfect bonus' : ''})`);
    console.log(`📊 Total weekly points: ${newWeeklyPoints}`);
    
  } catch (error) {
    console.error("Error updating leaderboard points:", error);
  }
};

const track = (eventName, data = {}) => {
if (!analytics) return;
logEvent(analytics, eventName, {
...data,
timestamp: Date.now(),
});
};

const DENTAL_TIPS_EN = [
{ title: "Circular Motion",    body: "Use small circular strokes rather than scrubbing — gentler on enamel and reaches the gum line better.", icon: "🔄" },
{ title: "45° Angle",          body: "Tilt your brush at 45° to the gum line so bristles slip just under the gums where plaque hides.", icon: "📐" },
{ title: "Two Full Minutes",   body: "Spend 30 seconds per quadrant. Most people only brush for 45 seconds — a timer makes a real difference.", icon: "⏱️" },
{ title: "Brush Your Tongue",  body: "Your tongue harbours bacteria that cause bad breath. Give it a gentle brush or scrape each time.", icon: "👅" },
{ title: "Wait After Eating",  body: "Wait 30 minutes after meals before brushing — acidic food softens enamel and brushing too soon wears it away.", icon: "🍎" },
{ title: "Stay Hydrated",      body: "Water washes away food particles and prevents dry mouth, a leading cause of cavities.", icon: "💧" },
{ title: "Replace Your Brush", body: "Swap your toothbrush every 3–4 months or when bristles splay — a worn brush cleans far less effectively.", icon: "🪥" },
{ title: "Floss First",        body: "Flossing before you brush loosens debris between teeth so your toothpaste can reach those surfaces too.", icon: "🧵" },
];

const MOOD_OPTIONS = [
{ emoji: "🤩", labelKey: "Energised" },
{ emoji: "😊", labelKey: "Good" },
{ emoji: "😌", labelKey: "Calm" },
{ emoji: "😴", labelKey: "Tired" },
{ emoji: "😐", labelKey: "Meh" },
{ emoji: "😷", labelKey: "Unwell" },
];

const BADGE_META = {
"Week Warrior":   { emoji: "🛡️", bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-100" },
"Monthly Master": { emoji: "👑", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-100" },
"Century Club":   { emoji: "🏆", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-100" },
"Perfect Week":   { emoji: "✨", bg: "bg-green-50",  text: "text-green-700",  border: "border-green-100" },
"Perfect Month":  { emoji: "🌟", bg: "bg-pink-50",   text: "text-pink-700",   border: "border-pink-100" },
};

const UI_STRINGS = [
"Day Complete!", "Recovery streak saved!", "Today's Routine",
"This Week", "Recovery Day!", "Complete all 3 tasks to restore your streak.",
"Daily Tasks", "of 3 completed", "Use Timer", "Timer On",
"Morning Brushing", "Night Brushing", "Interdental Care",
"Brush in circular motions…", "Completed", "2 minutes recommended",
"Floss", "Water Pick", "Interdental Brush",
"Today's Mood", "How are you feeling?", "Log mood",
"Next Milestone", "days to go — keep it up!",
"Tip of the Day", "All Brushing Tips",
"Today's Note", "Edit", "Achievements",
"Share Your Progress", "Share with Friends",
"Daily Reflection", "Jot down a thought about your routine today.",
"How did brushing feel today? Anything to improve?…", "Save", "Cancel", "Close",
"Let's start your day right!", "Great start — keep going!",
"Almost there, one more to go!", "All done — you're unstoppable!",
"tasks remaining", "task remaining", "All tasks complete today",
"Multiplier Active", "Streak", "Best", "Score", "Boost",
"Energised", "Good", "Calm", "Tired", "Meh", "Unwell",
"Week Warrior", "Monthly Master", "Century Club", "Perfect Week", "Perfect Month",
"Circular Motion", "45° Angle", "Two Full Minutes", "Brush Your Tongue",
"Wait After Eating", "Stay Hydrated", "Replace Your Brush", "Floss First",
"Aligners In", "Aligners Out", "Aligner Wear Time", "Daily Goal", "Tray", "Week",
"Aligner goal reached!", "Clean your aligners", "Switch tray reminder",
"Treatment Progress", "hours today", "Aligner Tracker",
];

export default function Today({ habitData, setHabitData, user }) {
const { currentLanguage, translating } = useContext(TranslationContext);

const [tx, setTx] = useState({});
const [translatedTips, setTranslatedTips] = useState(DENTAL_TIPS_EN);
const [translatedMoods, setTranslatedMoods] = useState(MOOD_OPTIONS);
const [translatedBadgeNames, setTranslatedBadgeNames] = useState({});
const [txReady, setTxReady] = useState(false);

const [consistencyScore, setConsistencyScore] = useState(0);
const [streakMilestones, setStreakMilestones] = useState([]);
const [streakMultiplier, setStreakMultiplier] = useState(1);
const [badges, setBadges] = useState([]);
const [showCompletion, setShowCompletion] = useState(false);
const [showShareModal, setShowShareModal] = useState(false);
const [showReflection, setShowReflection] = useState(false);
const [showMoodModal, setShowMoodModal] = useState(false);
const [reflectionText, setReflectionText] = useState("");
const [currentMood, setCurrentMood] = useState(null);
const [weekDots, setWeekDots] = useState([]);
const [tipIndex, setTipIndex] = useState(0);
const [tipsOpen, setTipsOpen] = useState(false);
const [copied, setCopied] = useState(false);

// ── DENTIST VISIT STATE ──
const [showDentistModal, setShowDentistModal] = useState(false);
const [lastVisitDateInput, setLastVisitDateInput] = useState("");
const [nextCustomMonths, setNextCustomMonths] = useState(6);
const [nextDateInput, setNextDateInput] = useState("");

// ── ALIGNER STATE ──
const [alignerRunning, setAlignerRunning] = useState(false);
const [alignerSeconds, setAlignerSeconds] = useState(0);
const [showAlignerSetup, setShowAlignerSetup] = useState(false);
const [alignerTrayInput, setAlignerTrayInput] = useState("");
const [alignerTotalTraysInput, setAlignerTotalTraysInput] = useState("");
const [alignerStartDateInput, setAlignerStartDateInput] = useState("");
const [alignerDaysPerTrayInput, setAlignerDaysPerTrayInput] = useState("14");
const alignerIntervalRef = useRef(null);

const alignerData = habitData.__aligner || null;
const todayAlignerKey = `__alignerWear_${getDateKey()}`;
const todayAlignerWear = habitData[todayAlignerKey] || { seconds: 0, sessions: [] };
const alignerWornSeconds = todayAlignerWear.seconds + (alignerRunning ? alignerSeconds : 0);
const alignerWornHours = alignerWornSeconds / 3600;
const alignerGoalReached = alignerWornHours >= ALIGNER_GOAL_HOURS;
const alignerPct = Math.min(100, (alignerWornHours / ALIGNER_GOAL_HOURS) * 100);

const lastDentistVisit = habitData.__lastDentistVisit || null;
const nextDentistVisit = habitData.__nextDentistVisit || null;

const today = getDateKey();
const yesterday = getYesterdayKey(today);
const todayData = habitData[today] || { morning: false, night: false, floss: false, reflection: null, mood: null, waterOz: 0 };
const yesterdayData = habitData[yesterday];
const lastRecovery = habitData[RECOVERY_KEY];
const lastRecoveryDate = lastRecovery ? new Date(lastRecovery) : null;
const oneWeekAgo = new Date();
oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
const recoveryAvailable = !lastRecoveryDate || lastRecoveryDate < oneWeekAgo;
const missedYesterday = yesterdayData && ["morning", "night", "floss"].some(k => yesterdayData[k] === false);
const isRecoveryDay = missedYesterday && recoveryAvailable;

const [activeTimer, setActiveTimer] = useState(null);
const [timeLeft, setTimeLeft] = useState(BRUSH_TIME);
const [timerEnabled, setTimerEnabled] = useState(false);
const [interdentalType, setInterdentalType] = useState("Floss");
const [, forceUpdate] = useState(0);
const timerIntervalRef = useRef(null);

useEffect(() => { forceUpdate(v => v + 1); }, [habitData]);
useEffect(() => { setTipIndex(new Date().getDate() % DENTAL_TIPS_EN.length); }, []);

useEffect(() => {
track("today_screen_viewed");
const start = Date.now();
return () => {
const seconds = Math.floor((Date.now() - start) / 1000);
track("today_screen_duration", { seconds });
};
}, []);

// ── ALIGNER TIMER ──
useEffect(() => {
if (alignerRunning) {
alignerIntervalRef.current = setInterval(() => {
setAlignerSeconds(s => s + 1);
}, 1000);
} else {
clearInterval(alignerIntervalRef.current);
}
return () => clearInterval(alignerIntervalRef.current);
}, [alignerRunning]);

const toggleAligner = () => {
if (alignerRunning) {
const newSessions = [...(todayAlignerWear.sessions || []), { seconds: alignerSeconds, end: Date.now() }];
setHabitData(prev => ({
...prev,
[todayAlignerKey]: { seconds: todayAlignerWear.seconds + alignerSeconds, sessions: newSessions },
}));
track("aligner_removed", { seconds_worn: alignerSeconds });
setAlignerSeconds(0);
} else {
track("aligner_inserted");
}
setAlignerRunning(p => !p);
};

const saveAlignerSetup = () => {
if (!alignerTrayInput || !alignerTotalTraysInput) return;
setHabitData(prev => ({
...prev,
__aligner: {
tray: parseInt(alignerTrayInput),
totalTrays: parseInt(alignerTotalTraysInput),
startDate: alignerStartDateInput || new Date().toISOString().split("T")[0],
daysPerTray: parseInt(alignerDaysPerTrayInput) || 14,
setupDate: new Date().toISOString(),
},
}));
track("aligner_setup_saved", { tray: alignerTrayInput, totalTrays: alignerTotalTraysInput });
setShowAlignerSetup(false);
};

const getAlignerTrayProgress = () => {
if (!alignerData) return null;
const start = new Date(alignerData.startDate);
const now = new Date();
const daysSinceStart = Math.floor((now - start) / (1000 * 60 * 60 * 24));
const currentTray = Math.min(alignerData.tray + Math.floor(daysSinceStart / alignerData.daysPerTray), alignerData.totalTrays);
const daysOnCurrentTray = daysSinceStart % alignerData.daysPerTray;
const daysUntilSwitch = alignerData.daysPerTray - daysOnCurrentTray;
const totalDays = alignerData.totalTrays * alignerData.daysPerTray;
const daysCompleted = daysSinceStart;
const treatmentPct = Math.min(100, Math.round((daysCompleted / totalDays) * 100));
return { currentTray, daysUntilSwitch, treatmentPct, daysOnCurrentTray };
};

const formatAlignerTime = (seconds) => {
const h = Math.floor(seconds / 3600);
const m = Math.floor((seconds % 3600) / 60);
const s = seconds % 60;
if (h > 0) return `${h}h ${m}m`;
return `${m}m ${s}s`;
};

useEffect(() => {
setTxReady(false);
if (!currentLanguage || currentLanguage === "en") {
const map = {};
UI_STRINGS.forEach(s => { map[s] = s; });
setTx(map);
setTranslatedTips(DENTAL_TIPS_EN);
setTranslatedMoods(MOOD_OPTIONS.map(m => ({ ...m, label: m.labelKey })));
const bm = {};
Object.keys(BADGE_META).forEach(k => { bm[k] = k; });
setTranslatedBadgeNames(bm);
setTxReady(true);
return;
}
const run = async () => {
try {
const uiTranslated = await translateBatch(UI_STRINGS, currentLanguage, "en");
const map = {};
UI_STRINGS.forEach((s, i) => { map[s] = uiTranslated[i] ?? s; });
setTx(map);
const tipTexts = DENTAL_TIPS_EN.flatMap(t => [t.title, t.body]);
const tipTranslated = await translateBatch(tipTexts, currentLanguage, "en");
setTranslatedTips(DENTAL_TIPS_EN.map((t, i) => ({
...t, title: tipTranslated[i*2] ?? t.title, body: tipTranslated[i*2+1] ?? t.body,
})));
const moodLabels = MOOD_OPTIONS.map(m => m.labelKey);
const moodTranslated = await translateBatch(moodLabels, currentLanguage, "en");
setTranslatedMoods(MOOD_OPTIONS.map((m, i) => ({ ...m, label: moodTranslated[i] ?? m.labelKey })));
const badgeKeys = Object.keys(BADGE_META);
const badgeTranslated = await translateBatch(badgeKeys, currentLanguage, "en");
const bm = {};
badgeKeys.forEach((k, i) => { bm[k] = badgeTranslated[i] ?? k; });
setTranslatedBadgeNames(bm);
} catch (err) {
console.error("Translation failed:", err);
} finally {
setTxReady(true);
}
};
run();
}, [currentLanguage]);

const T = useCallback((key) => tx[key] ?? key, [tx]);

useEffect(() => {
const dots = [];
for (let i = 6; i >= 0; i--) {
const d = new Date(); d.setDate(d.getDate() - i);
const day = habitData[getDateKey(d)];
const done = day ? ["morning","night","floss"].filter(k => day[k]).length : 0;
dots.push({ label: d.toLocaleDateString("en-US", { weekday:"short" }).slice(0,1), done, isToday: i === 0 });
}
setWeekDots(dots);
const scores = [];
for (let i = 0; i < 7; i++) {
const d = new Date(); d.setDate(d.getDate() - i);
const day = habitData[getDateKey(d)];
if (day) scores.push(["morning","night","floss"].filter(k => day[k]).length / 3);
}
setConsistencyScore(Math.round(scores.reduce((a,b) => a+b, 0) / 7 * 100) || 0);
const { current, longest } = calculateStreaks(habitData);
setStreakMultiplier(current >= 30 ? 2 : current >= 14 ? 1.5 : current >= 7 ? 1.25 : 1);
const nb = [];
if (longest >= 7) nb.push("Week Warrior");
if (longest >= 30) nb.push("Monthly Master");
if (longest >= 100) nb.push("Century Club");
let pw = true;
for (let i = 0; i < 7; i++) { const d = new Date(); d.setDate(d.getDate()-i); const day = habitData[getDateKey(d)]; if (!day||!day.morning||!day.night||!day.floss){pw=false;break;} }
if (pw) nb.push("Perfect Week");
let pm = true;
for (let i = 0; i < 30; i++) { const d = new Date(); d.setDate(d.getDate()-i); const day = habitData[getDateKey(d)]; if (!day||!day.morning||!day.night||!day.floss){pm=false;break;} }
if (pm) nb.push("Perfect Month");
setBadges(nb);
const milestones = [7,30,60,90,180,365];
const next = milestones.find(m => m > current) || 365;
setStreakMilestones([{ current, next, remaining: next - current }]);
setCurrentMood(todayData.mood || null);
setReflectionText(todayData.reflection || "");
}, [habitData]);

const formatTime = s => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;

const toggleTask = useCallback(async (task) => {
  const nextValue = !todayData[task];
  track("task_toggled", { task, completed: nextValue });
  const updatedDay = { ...todayData, [task]: nextValue };
  const completedNow = ["morning","night","floss"].filter(k => updatedDay[k]).length;
  
  setHabitData(prev => {
    const updated = { ...prev, [today]: updatedDay };
    if (completedNow === 3 && isRecoveryDay) updated[RECOVERY_KEY] = new Date().toISOString();
    return updated;
  });
  
  // ── UPDATE LEADERBOARD POINTS ──
  if (user) {
    // Pass the current habitData so we can calculate properly
    const currentHabitData = { ...habitData, [today]: updatedDay };
    await updateLeaderboardPoints(user.uid, updatedDay, currentHabitData);
  }
  
  if (completedNow === 3) {
    const { current } = calculateStreaks(habitData);
    track("daily_routine_completed", { streak: current, recovery_day: isRecoveryDay });
    setShowCompletion(true);
    setTimeout(() => setShowCompletion(false), 2800);
  }
}, [todayData, today, isRecoveryDay, setHabitData, habitData, user]);

const saveMood = async (moodKey) => {
  setCurrentMood(moodKey);
  const updatedDay = { ...todayData, mood: moodKey };
  setHabitData(prev => ({ ...prev, [today]: updatedDay }));
  track("mood_logged", { mood: moodKey });
  setShowMoodModal(false);
  
  // ── UPDATE LEADERBOARD POINTS ──
  if (user) {
    const currentHabitData = { ...habitData, [today]: updatedDay };
    await updateLeaderboardPoints(user.uid, updatedDay, currentHabitData);
  }
};

const saveReflection = async () => {
  const updatedDay = { ...todayData, reflection: reflectionText };
  setHabitData(prev => ({ ...prev, [today]: updatedDay }));
  track("reflection_saved", { length: reflectionText.length });
  setShowReflection(false);
  
  // ── UPDATE LEADERBOARD POINTS ──
  if (user) {
    const currentHabitData = { ...habitData, [today]: updatedDay };
    await updateLeaderboardPoints(user.uid, updatedDay, currentHabitData);
  }
};

const toggleTimer = () => {
track("timer_toggled", { enabled: !timerEnabled });
if (timerEnabled && activeTimer) {
toggleTask(activeTimer);
clearInterval(timerIntervalRef.current);
setActiveTimer(null);
setTimeLeft(BRUSH_TIME);
}
setTimerEnabled(p => !p);
};

useEffect(() => {
if (!activeTimer) return;
if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
timerIntervalRef.current = setInterval(() => {
setTimeLeft(prev => {
if (prev <= 1) { clearInterval(timerIntervalRef.current); toggleTask(activeTimer); setActiveTimer(null); return BRUSH_TIME; }
return prev - 1;
});
}, 1000);
return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
}, [activeTimer, toggleTask]);

const handleShare = async () => {
const { current } = calculateStreaks(habitData);
track("share_clicked", { streak: current });
const alignerLine = alignerData ? `\n😁 Aligner wear: ${alignerWornHours.toFixed(1)}h today` : "";
const shareText = `🦷 SmileStreak Update!\n\n🔥 ${current} day streak\n✅ ${completedCount}/3 tasks done today\n📊 ${consistencyScore}% consistency this week\n⚡ ${streakMultiplier}x streak multiplier${alignerLine}\n\nBuilding better dental habits one day at a time! 😁`;
setShowShareModal(false);
if (navigator.share) {
try {
await navigator.share({ title: "My SmileStreak Progress", text: shareText });
track("share_completed", { method: "native" });
return;
} catch {}
}
try {
await navigator.clipboard.writeText(shareText);
track("share_completed", { method: "clipboard" });
setCopied(true); setTimeout(() => setCopied(false), 2500);
} catch {
const ta = document.createElement("textarea");
ta.value = shareText; document.body.appendChild(ta); ta.select();
document.execCommand("copy"); document.body.removeChild(ta);
track("share_completed", { method: "clipboard_fallback" });
setCopied(true); setTimeout(() => setCopied(false), 2500);
}
};

const openDentistModal = () => {
setLastVisitDateInput(new Date().toISOString().split("T")[0]);
setNextCustomMonths(6);
setNextDateInput("");
setShowDentistModal(true);
};

const parseLocalDate = (dateStr) => {
const [y, m, d] = dateStr.split("-").map(Number);
return new Date(y, m - 1, d, 12, 0, 0);
};

const saveDentistModal = () => {
const updates = {};
if (lastVisitDateInput) {
updates.__lastDentistVisit = parseLocalDate(lastVisitDateInput).toISOString();
}
if (nextDateInput) {
updates.__nextDentistVisit = parseLocalDate(nextDateInput).toISOString();
} else {
const nextDate = new Date();
nextDate.setMonth(nextDate.getMonth() + nextCustomMonths);
updates.__nextDentistVisit = nextDate.toISOString();
}
track("dentist_visit_logged", {
has_next_appointment: !!nextDateInput || !!nextCustomMonths,
next_appointment_months: nextDateInput ? null : nextCustomMonths,
});
setHabitData(prev => ({ ...prev, ...updates }));
setShowDentistModal(false);
};

const getDaysUntilNextVisit = () => {
if (!nextDentistVisit) return null;
const diff = new Date(nextDentistVisit) - new Date();
return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const formatVisitDate = (iso) => {
if (!iso) return "";
return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

const completedCount = ["morning","night","floss"].filter(k => todayData[k]).length;
const percent = Math.round((completedCount / 3) * 100);
const { current, longest } = calculateStreaks(habitData);
const dayLabel = new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" });
const tip = translatedTips[tipIndex];
const alignerTrayProgress = getAlignerTrayProgress();

const motivations = [
{ emoji: "🌅", textKey: "Let's start your day right!" },
{ emoji: "⚡", textKey: "Great start — keep going!" },
{ emoji: "🎯", textKey: "Almost there, one more to go!" },
{ emoji: "🏆", textKey: "All done — you're unstoppable!" },
];
const mot = motivations[completedCount];
const remainingText = completedCount < 3
? `${3 - completedCount} ${T(3 - completedCount !== 1 ? "tasks remaining" : "task remaining")}`
: `${T("All tasks complete today")} 🎊`;

const currentMoodOption = MOOD_OPTIONS.find(m => m.labelKey === currentMood);
const currentMoodTranslated = translatedMoods.find(m => m.labelKey === currentMood);
const daysUntilVisit = getDaysUntilNextVisit();

if (translating || !txReady) {
return (
<section className="space-y-6 pb-8">
<div className="bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-500 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
<div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
<div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />
<div className="relative z-10 animate-pulse flex items-center gap-3">
<span className="text-3xl">🦷</span>
<div>
<h2 className="text-2xl font-black">Loading…</h2>
<p className="text-sm opacity-75 mt-0.5">Preparing your routine</p>
</div>
</div>
</div>
{[1,2,3].map(i => (
<div key={i} className="bg-white rounded-3xl p-5 shadow-lg border border-blue-100 animate-pulse">
<div className="h-4 bg-blue-50 rounded-full w-1/3 mb-3" />
<div className="h-3 bg-blue-50 rounded-full w-2/3" />
</div>
))}
</section>
);
}

return (
<section className="space-y-5 pb-8">
  {copied && (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50" style={{animation:"fadeIn .22s ease"}}>
      <div className="bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-2xl shadow-xl">
        ✅ Copied to clipboard!
      </div>
    </div>
  )}

{showCompletion && (
<div className="fixed inset-0 bg-blue-900/25 backdrop-blur-sm flex items-center justify-center z-50" style={{animation:"fadeIn .22s ease"}}>
<div className="bg-white rounded-3xl px-10 py-9 text-center shadow-2xl border border-blue-100" style={{animation:"bounceIn .45s cubic-bezier(.22,1,.36,1)"}}>
<div className="text-6xl mb-4">🎉</div>
<p className="text-2xl font-black text-gray-900 mb-2">{T("Day Complete!")}</p>
<p className="text-sm text-gray-500 mb-3">{isRecoveryDay ? `🔄 ${T("Recovery streak saved!")}` : "✨ Perfect consistency!"}</p>
{streakMultiplier > 1 && (
<span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-100">
⚡ {streakMultiplier}x {T("Multiplier Active")}
</span>
)}
</div>
</div>
)}

  <style>{`
    @keyframes fadeIn   { from{opacity:0}to{opacity:1} }
    @keyframes slideUp  { from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1} }
    @keyframes bounceIn { 0%{transform:scale(0.7);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1} }
    @keyframes pulse-ring { 0%{transform:scale(1);opacity:.6}100%{transform:scale(1.5);opacity:0} }
    .press { transition: transform .14s ease }
    .press:active { transform: scale(.97) }
    .hover-lift { transition: all .2s ease }
    .hover-lift:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(59,130,246,.18) }
    .aligner-pulse::before { content:''; position:absolute; inset:0; border-radius:inherit; border:2px solid #06b6d4; animation:pulse-ring 1.5s ease-out infinite; }
  `}</style>

{/* ── HERO HEADER ── */}
  <div className="bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-500 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />
    <div className="relative z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{mot.emoji}</span>
          <div>
            <h2 className="text-2xl font-black">🦷 {T("Today's Routine")}</h2>
            <p className="text-sm opacity-90 mt-0.5">{dayLabel}</p>
          </div>
        </div>
        <button onClick={() => setShowReflection(true)}
          className="p-2.5 rounded-2xl bg-white/20 hover:bg-white/30 transition-colors press">
          <Heart className="w-5 h-5 text-white" />
        </button>
      </div>
      <div className="mt-4 pt-4 border-t border-white/20">
        <p className="font-bold text-white">{T(mot.textKey)}</p>
        <p className="text-sm text-blue-100 mt-0.5">{remainingText}</p>
      </div>
    </div>
  </div>

{/* ── STATS ROW ── */}
  <div className="grid grid-cols-4 gap-3">
    {[
      { emoji:"🔥", val:`${current}d`,          labelKey:"Streak",  from:"from-orange-50", border:"border-orange-100", text:"text-orange-600" },
      { emoji:"🏅", val:`${longest}d`,          labelKey:"Best",    from:"from-yellow-50", border:"border-yellow-100", text:"text-yellow-600" },
      { emoji:"📈", val:`${consistencyScore}%`, labelKey:"Score",   from:"from-blue-50",   border:"border-blue-100",   text:"text-blue-600"   },
      { emoji:"⚡", val:`${streakMultiplier}x`, labelKey:"Boost",   from:"from-purple-50", border:"border-purple-100", text:"text-purple-600" },
    ].map(s => (
      <div key={s.labelKey} className={`bg-gradient-to-br ${s.from} to-white rounded-2xl p-3 border ${s.border} shadow-sm text-center`}>
        <div className="text-xl mb-1">{s.emoji}</div>
        <div className={`text-sm font-black ${s.text}`}>{s.val}</div>
        <div className="text-[10px] text-gray-400 mt-0.5 font-medium">{T(s.labelKey)}</div>
      </div>
    ))}
  </div>

{/* ── WEEKLY CHART ── */}
  <div className="bg-white rounded-3xl p-5 shadow-lg border border-blue-100">
    <div className="flex items-center gap-2 mb-4">
      <TrendingUp className="w-4 h-4 text-blue-600" />
      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">📅 {T("This Week")}</p>
    </div>
    <div className="flex justify-between items-end gap-2">
      {weekDots.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
          <div className="w-full flex flex-col gap-0.5">
            {[2,1,0].map(slot => (
              <div key={slot} className={`h-2 rounded-full transition-all duration-500 ${d.done > slot ? "bg-gradient-to-r from-blue-400 to-cyan-400" : "bg-blue-50"}`} />
            ))}
          </div>
          <span className={`text-[10px] font-bold ${d.isToday ? "text-blue-600" : "text-gray-300"}`}>{d.label}</span>
          {d.isToday && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
        </div>
      ))}
    </div>
  </div>

{/* ── RECOVERY NOTICE ── */}
{isRecoveryDay && (
<div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-center gap-3">
<div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0">
<span className="text-xl">🔄</span>
</div>
<div>
<p className="font-bold text-amber-800">{T("Recovery Day!")}</p>
<p className="text-xs text-amber-600 mt-0.5">{T("Complete all 3 tasks to restore your streak.")}</p>
</div>
</div>
)}

{/* ── DAILY TASKS ── */}
  <div className="bg-white rounded-3xl p-5 shadow-lg border border-blue-100 space-y-3">
    <div className="flex items-center gap-4 mb-2">
      <div className="relative w-14 h-14 flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="22" fill="none" stroke="#dbeafe" strokeWidth="5" />
          <circle cx="28" cy="28" r="22" fill="none" stroke="url(#grad)" strokeWidth="5" strokeLinecap="round"
            strokeDasharray={`${2*Math.PI*22}`}
            strokeDashoffset={`${2*Math.PI*22*(1-percent/100)}`}
            style={{transition:"stroke-dashoffset .7s cubic-bezier(.4,0,.2,1)"}} />
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-black text-blue-600">{percent}%</span>
        </div>
      </div>
      <div className="flex-1">
        <p className="font-black text-gray-900">{T("Daily Tasks")}</p>
        <p className="text-xs text-gray-500">{completedCount} {T("of 3 completed")}</p>
      </div>
      <button onClick={toggleTimer}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold press transition-all hover-lift ${
          timerEnabled
            ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-200"
            : "bg-blue-50 text-blue-600 border-2 border-blue-200 hover:border-blue-400"
        }`}>
        <Clock className="w-3.5 h-3.5" />
        {timerEnabled ? T("Timer On") : T("Use Timer")}
      </button>
    </div>

{["morning","night"].map(task => {
const isDone = todayData[task];
const isRunning = activeTimer === task;
const fillPct = isRunning ? ((BRUSH_TIME - timeLeft) / BRUSH_TIME) * 100 : 0;
return (
<button key={task} className="press w-full text-left group"
onClick={() => {
if (isDone) toggleTask(task);
else if (timerEnabled) {
track("timer_started", { task });
setActiveTimer(task);
setTimeLeft(BRUSH_TIME);
}
else toggleTask(task);
}}>
<div className={`relative overflow-hidden rounded-2xl border-2 p-4 transition-all duration-200 ${ isDone ? "bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200" : isRunning ? "bg-white border-blue-400 shadow-lg shadow-blue-100" : "bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200 hover:border-blue-300 hover:shadow-md" }`}>
{isRunning && (
<div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-cyan-50 origin-left"
style={{transform:`scaleX(${fillPct/100})`,transition:"transform 1s linear"}} />
)}
<div className="relative flex items-center justify-between gap-3">
<div className="flex items-center gap-3">
<div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl ${ task === "morning" ? "bg-gradient-to-br from-yellow-100 to-orange-100" : "bg-gradient-to-br from-indigo-100 to-purple-100" }`}>
{task === "morning" ? "🪥" : "🌙"}
</div>
<div>
<p className="font-bold text-gray-900 text-sm">
{task === "morning" ? T("Morning Brushing") : T("Night Brushing")}
</p>
<p className="text-xs text-gray-500 mt-0.5">
{isRunning ? `🔄 ${T("Brush in circular motions…")}` : isDone ? `✅ ${T("Completed")}` : `⏱ ${T("2 minutes recommended")}`}
</p>
</div>
</div>
{isRunning ? (
<div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-3 py-1.5 rounded-xl text-sm font-black tabular-nums shadow-md">
{formatTime(timeLeft)}
</div>
) : isDone ? (
<div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
<CheckCircle2 className="w-5 h-5 text-white" />
</div>
) : (
<div className="w-9 h-9 rounded-full border-2 border-blue-200 flex items-center justify-center bg-white group-hover:border-blue-400 transition-colors">
<Circle className="w-4 h-4 text-blue-200" />
</div>
)}
</div>
</div>
</button>
);
})}

<button className="press w-full text-left group" onClick={() => toggleTask("floss")}>
<div className={`rounded-2xl border-2 p-4 transition-all duration-200 ${
    todayData.floss
      ? "bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200"
      : "bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200 hover:border-blue-300 hover:shadow-md"
  }`}>
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center text-2xl">🧵</div>
        <div>
          <p className="font-bold text-gray-900 text-sm">{T("Interdental Care")}</p>
          <select value={interdentalType} onChange={e => setInterdentalType(e.target.value)}
            onClick={e => e.stopPropagation()}
            className="text-xs text-gray-500 bg-transparent border-none focus:outline-none p-0 mt-0.5 block cursor-pointer font-medium">
            <option value="Floss">🧵 {T("Floss")}</option>
            <option value="Water Pick">💦 {T("Water Pick")}</option>
            <option value="Interdental Brush">🔹 {T("Interdental Brush")}</option>
          </select>
        </div>
      </div>
      {todayData.floss ? (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-md">
          <CheckCircle2 className="w-5 h-5 text-white" />
        </div>
      ) : (
        <div className="w-9 h-9 rounded-full border-2 border-blue-200 flex items-center justify-center flex-shrink-0 bg-white group-hover:border-blue-400 transition-colors">
          <Circle className="w-4 h-4 text-blue-200" />
        </div>
      )}
    </div>
  </div>
</button>

<button onClick={openDentistModal}
className="press hover-lift w-full py-3.5 rounded-2xl text-sm font-bold border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-600 hover:border-blue-400 transition-all flex items-center justify-center gap-2">
🦷 Log Dentist Visit
</button>

  </div>

{/* ── ALIGNER TRACKER ── */}
<div className="bg-white rounded-3xl p-5 shadow-lg border border-blue-100">
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <span className="text-xl">😁</span>
      <div>
        <p className="font-bold text-gray-900">{T("Aligner Tracker")}</p>
        <p className="text-xs text-gray-500">Invisalign · ClearCorrect · Any aligner</p>
      </div>
    </div>
    <button onClick={() => setShowAlignerSetup(true)}
      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200 hover:border-blue-400 press">
      {alignerData ? "Edit" : "Setup"}
    </button>
  </div>

  {!alignerData ? (
    <button onClick={() => setShowAlignerSetup(true)}
      className="press hover-lift w-full py-4 rounded-2xl text-sm font-bold border-2 border-dashed border-blue-200 text-blue-400 bg-blue-50/50 flex items-center justify-center gap-2">
      + Set up your aligner treatment
    </button>
  ) : (
    <>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Today's Wear Time</span>
          <span className={`text-sm font-black ${alignerGoalReached ? "text-green-600" : "text-blue-600"}`}>
            {formatAlignerTime(alignerWornSeconds)} / {ALIGNER_GOAL_HOURS}h
          </span>
        </div>
        <div className="h-3 bg-blue-50 rounded-full overflow-hidden border border-blue-100 mb-1">
          <div className="h-full rounded-full transition-all duration-500"
            style={{width:`${alignerPct}%`, background: alignerGoalReached ? "linear-gradient(90deg,#22c55e,#16a34a)" : "linear-gradient(90deg,#3b82f6,#06b6d4)"}} />
        </div>
        <div className="flex justify-between">
          <span className="text-[10px] text-gray-400">Time off: {formatAlignerTime(Math.max(0, 86400 - alignerWornSeconds))}</span>
          {alignerGoalReached && <span className="text-[10px] text-green-600 font-bold">✅ Goal reached!</span>}
        </div>
      </div>

      <button onClick={toggleAligner}
        className={`relative press hover-lift w-full py-5 rounded-2xl text-base font-black flex items-center justify-center gap-3 mb-4 transition-all duration-300 ${
          alignerRunning
            ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-100"
            : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-100"
        }`}>
        <span className="text-2xl">{alignerRunning ? "😮" : "😁"}</span>
        {alignerRunning ? "Aligners Out — Tap to Remove" : "Aligners In — Tap to Log"}
        {alignerRunning && (
          <span className="absolute top-2 right-3 text-xs font-bold text-white/80">
            {formatAlignerTime(alignerSeconds)}
          </span>
        )}
      </button>

      {alignerTrayProgress && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-100 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Treatment Progress</span>
            <span className="text-xs font-black text-blue-600">{alignerTrayProgress.treatmentPct}% complete</span>
          </div>
          <div className="h-2 bg-blue-100 rounded-full overflow-hidden mb-3">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-700"
              style={{width:`${alignerTrayProgress.treatmentPct}%`}} />
          </div>
          <div className="flex justify-between">
            <div className="text-center">
              <p className="text-xs font-black text-blue-700">Tray {alignerTrayProgress.currentTray}/{alignerData.totalTrays}</p>
              <p className="text-[10px] text-gray-400">Current tray</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-black text-cyan-700">{alignerTrayProgress.daysUntilSwitch}d</p>
              <p className="text-[10px] text-gray-400">Until next tray</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-black text-purple-700">{alignerTrayProgress.daysOnCurrentTray}d</p>
              <p className="text-[10px] text-gray-400">On this tray</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex-1 bg-cyan-50 border border-cyan-100 rounded-xl p-3 text-center">
          <p className="text-lg mb-1">🧼</p>
          <p className="text-[10px] font-bold text-cyan-700">Clean aligners</p>
          <p className="text-[10px] text-gray-400">when removed</p>
        </div>
        <div className="flex-1 bg-purple-50 border border-purple-100 rounded-xl p-3 text-center">
          <p className="text-lg mb-1">💧</p>
          <p className="text-[10px] font-bold text-purple-700">Rinse before</p>
          <p className="text-[10px] text-gray-400">inserting</p>
        </div>
        <div className="flex-1 bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
          <p className="text-lg mb-1">☕</p>
          <p className="text-[10px] font-bold text-amber-700">Remove for</p>
          <p className="text-[10px] text-gray-400">hot drinks</p>
        </div>
      </div>
    </>
  )}
</div>

{/* ── DENTIST VISIT CARD ── */}
{(nextDentistVisit || lastDentistVisit) && (
<div className={`rounded-3xl p-5 shadow-md border ${ nextDentistVisit && daysUntilVisit !== null && daysUntilVisit <= 0 ? "bg-orange-50 border-orange-200" : nextDentistVisit && daysUntilVisit !== null && daysUntilVisit <= 14 ? "bg-amber-50 border-amber-200" : "bg-white border-blue-100" }`}>
{nextDentistVisit && daysUntilVisit !== null && (
<div className="flex items-center gap-3 mb-3">
<div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${ daysUntilVisit <= 0 ? "bg-orange-100" : daysUntilVisit <= 14 ? "bg-amber-100" : "bg-blue-50" }`}>🦷</div>
<div className="min-w-0 flex-1">
<p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Next Appointment</p>
{daysUntilVisit > 0 ? (
<>
<p className={`font-black text-base ${daysUntilVisit <= 14 ? "text-amber-600" : "text-blue-600"}`}>
In {daysUntilVisit} day{daysUntilVisit !== 1 ? "s" : ""}
</p>
<p className="text-xs text-gray-500 truncate">{formatVisitDate(nextDentistVisit)}</p>
</>
) : (
<>
<p className="font-black text-base text-orange-600">⚠️ Overdue</p>
<p className="text-xs text-gray-500 truncate">Was due {formatVisitDate(nextDentistVisit)}</p>
</>
)}
</div>
</div>
)}
{nextDentistVisit && lastDentistVisit && (
<div className="border-t border-blue-50 my-3" />
)}
{lastDentistVisit && (
<div className="flex items-center gap-3">
<div className="w-11 h-11 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl flex-shrink-0">📅</div>
<div className="min-w-0 flex-1">
<p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Last Visit</p>
<p className="font-semibold text-sm text-gray-700 truncate">{formatVisitDate(lastDentistVisit)}</p>
</div>
</div>
)}
</div>
)}

{/* ── MILESTONE ── */}
{streakMilestones.length > 0 && streakMilestones[0].remaining > 0 && (
<div className="bg-white rounded-3xl p-5 shadow-lg border border-blue-100">
<div className="flex items-center gap-2 mb-3">
<Zap className="w-5 h-5 text-blue-500" />
<div className="flex items-center justify-between flex-1">
<p className="font-bold text-gray-900">🏁 {T("Next Milestone")}</p>
<span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-lg">{current} → {streakMilestones[0].next} days</span>
</div>
</div>
<div className="h-3 bg-blue-50 rounded-full overflow-hidden border border-blue-100">
<div className="h-full rounded-full transition-all duration-700"
style={{width:`${Math.min(100,(current/streakMilestones[0].next)*100)}%`,background:"linear-gradient(90deg,#3b82f6,#06b6d4)"}} />
</div>
<p className="text-xs text-gray-500 mt-2">{streakMilestones[0].remaining} {T("days to go — keep it up!")} 💪</p>
</div>
)}

{/* ── TIP OF THE DAY ── */}
<div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-5 shadow-xl relative overflow-hidden">
    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-4 h-4 text-white/80"><Sparkles className="w-4 h-4" /></span>
        <p className="text-[11px] font-bold text-white/80 uppercase tracking-wider">✨ {T("Tip of the Day")}</p>
      </div>
      <div className="flex gap-3 items-start">
        <span className="text-2xl">{tip.icon}</span>
        <div>
          <p className="text-sm font-black text-white">{tip.title}</p>
          <p className="text-xs text-blue-100 mt-1 leading-relaxed">{tip.body}</p>
        </div>
      </div>
    </div>
  </div>

{/* ── BRUSHING TIPS ACCORDION ── */}
<div className="bg-white rounded-3xl shadow-lg border border-blue-100 overflow-hidden">
    <button className="w-full p-5 flex items-center justify-between press group" onClick={() => setTipsOpen(!tipsOpen)}>
      <div className="flex items-center gap-2">
        <span className="text-xl">🪥</span>
        <p className="font-bold text-gray-900">{T("All Brushing Tips")}</p>
      </div>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
        tipsOpen ? "bg-blue-500 text-white" : "bg-blue-50 text-blue-500 border-2 border-blue-200"
      }`}>
        {tipsOpen ? "−" : "+"}
      </div>
    </button>
    {tipsOpen && (
      <div className="px-5 pb-5 border-t border-blue-50 pt-4 space-y-4" style={{animation:"slideUp .3s ease"}}>
        {translatedTips.map((tip, i) => (
          <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100">
            <span className="text-xl mt-0.5">{tip.icon}</span>
            <div>
              <p className="text-xs font-bold text-gray-700">{tip.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{tip.body}</p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>

{/* ── REFLECTION NOTE ── */}
{reflectionText && (
<div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-3xl p-5">
<div className="flex items-center justify-between mb-2">
<div className="flex items-center gap-2">
<Heart className="w-4 h-4 text-pink-500" />
<p className="text-xs font-bold text-gray-500 uppercase tracking-wider">💭 {T("Today's Note")}</p>
</div>
<button onClick={() => setShowReflection(true)} className="text-xs text-purple-500 font-bold press hover:text-purple-700">{T("Edit")}</button>
</div>
<p className="text-sm text-gray-600 italic leading-relaxed">"{reflectionText}"</p>
</div>
)}

{/* ── BADGES ── */}
{badges.length > 0 && (
<div className="bg-white rounded-3xl p-5 shadow-lg border border-blue-100">
<p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">🏅 {T("Achievements")}</p>
<div className="flex flex-wrap gap-2">
{badges.map((b, i) => {
const meta = BADGE_META[b] || { emoji:"⭐", bg:"bg-blue-50", text:"text-blue-700", border:"border-blue-100" };
return (
<span key={i} className={`inline-flex items-center gap-1.5 px-3 py-2 ${meta.bg} ${meta.text} rounded-xl text-xs font-bold border-2 ${meta.border}`}>
{meta.emoji} {translatedBadgeNames[b] ?? b}
</span>
);
})}
</div>
</div>
)}

{/* ── SHARE BUTTON ── */}
<button onClick={handleShare}
className="press hover-lift w-full py-4 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg shadow-blue-200">
<Share2 className="w-4 h-4" />
📤 {T("Share Your Progress")}
</button>

{/* ── MODALS ── */}
{showReflection && (
<div className="fixed inset-0 bg-blue-900/25 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
style={{animation:"fadeIn .22s ease"}} onClick={() => setShowReflection(false)}>
<div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 shadow-2xl"
style={{animation:"slideUp .35s cubic-bezier(.22,1,.36,1)",boxShadow:"0 -8px 40px rgba(59,130,246,.15)"}}
onClick={e => e.stopPropagation()}>
<div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />
<div className="flex items-center gap-2 mb-1">
<Heart className="w-5 h-5 text-pink-500" />
<h3 className="text-lg font-black text-gray-900">{T("Daily Reflection")}</h3>
</div>
<p className="text-xs text-gray-500 mb-4">{T("Jot down a thought about your routine today.")}</p>
<textarea value={reflectionText} onChange={e => setReflectionText(e.target.value)}
placeholder={T("How did brushing feel today? Anything to improve?…")}
className="w-full p-4 border-2 border-blue-100 rounded-2xl text-sm text-gray-700 focus:outline-none focus:border-blue-400 min-h-[110px] resize-none" />
<div className="flex gap-2 mt-4">
<button onClick={saveReflection}
className="flex-1 py-3.5 rounded-2xl text-sm font-black text-white press bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg">
💾 {T("Save")}
</button>
<button onClick={() => setShowReflection(false)}
className="flex-1 py-3.5 bg-gray-100 text-gray-500 rounded-2xl text-sm font-bold hover:bg-gray-200 press">
{T("Cancel")}
</button>
</div>
</div>
</div>
)}

{showMoodModal && (
<div className="fixed inset-0 bg-blue-900/25 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
style={{animation:"fadeIn .22s ease"}} onClick={() => setShowMoodModal(false)}>
<div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 shadow-2xl"
style={{animation:"slideUp .35s cubic-bezier(.22,1,.36,1)"}}
onClick={e => e.stopPropagation()}>
<div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />
<h3 className="text-lg font-black text-gray-900 mb-4">{T("How are you feeling?")} 😊</h3>
<div className="grid grid-cols-3 gap-3">
{translatedMoods.map(m => (
<button key={m.labelKey} onClick={() => saveMood(m.labelKey)}
className={`p-4 rounded-2xl border-2 text-center press transition-all hover-lift ${ currentMood === m.labelKey ? "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-400" : "bg-gradient-to-br from-gray-50 to-blue-50 border-gray-200 hover:border-blue-300" }`}>
<div className="text-2xl mb-1.5">{m.emoji}</div>
<div className="text-xs text-gray-600 font-bold">{m.label}</div>
</button>
))}
</div>
<button onClick={() => setShowMoodModal(false)}
className="w-full mt-4 py-3 text-sm text-gray-400 hover:bg-gray-50 rounded-2xl press font-semibold">
{T("Close")}
</button>
</div>
</div>
)}

{showShareModal && (
<div className="fixed inset-0 bg-blue-900/25 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
style={{animation:"fadeIn .22s ease"}} onClick={() => setShowShareModal(false)}>
<div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 shadow-2xl"
style={{animation:"slideUp .35s cubic-bezier(.22,1,.36,1)"}}
onClick={e => e.stopPropagation()}>
<div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />
<div className="text-center mb-5">
<div className="text-4xl mb-2">📤</div>
<h3 className="text-lg font-black text-gray-900">{T("Share Your Progress")}</h3>
<p className="text-xs text-gray-400 mt-1">🔥 {current} day streak · ✅ {completedCount}/3 today · 📊 {consistencyScore}% this week</p>
</div>
<button onClick={handleShare}
className="w-full py-4 rounded-2xl text-sm font-black text-white press flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg shadow-blue-200">
<Share2 className="w-4 h-4" /> {T("Share with Friends")}
</button>
<button onClick={() => setShowShareModal(false)}
className="w-full mt-2.5 py-3 text-sm text-gray-400 hover:bg-gray-50 rounded-2xl press font-semibold">
{T("Close")}
</button>
</div>
</div>
)}

{/* ── DENTIST VISIT MODAL ── */}
{showDentistModal && (
<div className="fixed inset-0 bg-blue-900/25 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
style={{animation:"fadeIn .22s ease"}} onClick={() => setShowDentistModal(false)}>
<div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
style={{animation:"slideUp .35s cubic-bezier(.22,1,.36,1)"}}
onClick={e => e.stopPropagation()}>
<div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />
    <div className="flex items-center gap-3 mb-5">
      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🦷</div>
      <div className="min-w-0">
        <h3 className="text-lg font-black text-gray-900">Log Dentist Visit</h3>
        <p className="text-xs text-gray-500">Record your last visit and schedule the next one</p>
      </div>
    </div>
    <div className="mb-5 p-4 rounded-2xl bg-gray-50 border-2 border-gray-200">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">📅 Last Visit Date</p>
      <input type="date" max={new Date().toISOString().split("T")[0]} value={lastVisitDateInput}
        onChange={e => setLastVisitDateInput(e.target.value)}
        className="w-full border-2 border-blue-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-blue-700 focus:outline-none focus:border-blue-400 bg-white"
        style={{maxWidth:"100%",boxSizing:"border-box",WebkitAppearance:"none",MozAppearance:"none",appearance:"none"}} />
      <p className="text-[10px] text-gray-400 mt-2">When did you last visit the dentist?</p>
    </div>
    <div className="mb-5">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">🗓️ Next Appointment</p>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[3, 6, 12].map(months => (
          <button key={months} onClick={() => { setNextCustomMonths(months); setNextDateInput(""); }}
            className={`py-3 rounded-xl font-bold text-sm transition-all ${ nextCustomMonths === months && !nextDateInput ? "bg-blue-600 text-white shadow-md" : "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100" }`}>
            {months}mo
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200 mb-4">
        <input type="number" min="1" max="24" value={nextCustomMonths}
          onChange={e => { setNextCustomMonths(Math.max(1, Math.min(24, parseInt(e.target.value) || 1))); setNextDateInput(""); }}
          className="w-16 text-center border border-blue-200 rounded-lg py-2 text-sm font-bold text-blue-700 focus:outline-none focus:border-blue-400 bg-white" />
        <span className="text-sm text-gray-600">months from today</span>
      </div>
      <div className="relative">
        <div className="absolute inset-0 flex items-center mb-4"><div className="w-full border-t border-gray-300"></div></div>
        <div className="relative flex justify-center mb-4"><span className="px-3 bg-white text-xs text-gray-500">OR</span></div>
      </div>
      <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
        <p className="text-xs font-medium text-gray-500 mb-2">Pick a specific date</p>
        <input type="date" min={new Date().toISOString().split("T")[0]} value={nextDateInput}
          onChange={e => setNextDateInput(e.target.value)}
          className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-700 focus:outline-none focus:border-blue-400 bg-white" />
      </div>
    </div>
    <button onClick={saveDentistModal}
      className="press hover-lift w-full py-4 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg shadow-blue-200 mb-2">
      💾 Save Visit
    </button>
    <button onClick={() => setShowDentistModal(false)}
      className="w-full py-3 text-sm text-gray-400 hover:bg-gray-50 rounded-2xl press font-semibold">
      {T("Cancel")}
    </button>
</div>
</div>
)}

{/* ── ALIGNER SETUP MODAL ── */}
{showAlignerSetup && (
<div className="fixed inset-0 bg-blue-900/25 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
style={{animation:"fadeIn .22s ease"}} onClick={() => setShowAlignerSetup(false)}>
<div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
style={{animation:"slideUp .35s cubic-bezier(.22,1,.36,1)"}}
onClick={e => e.stopPropagation()}>
  <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />
  <div className="flex items-center gap-3 mb-5">
    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">😁</div>
    <div>
      <h3 className="text-lg font-black text-gray-900">Aligner Setup</h3>
      <p className="text-xs text-gray-500">Works with Invisalign, ClearCorrect & more</p>
    </div>
  </div>
  <div className="space-y-4">
    <div className="p-4 rounded-2xl bg-gray-50 border-2 border-gray-200">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Tray Number</p>
      <input type="number" min="1" placeholder="e.g. 1" value={alignerTrayInput}
        onChange={e => setAlignerTrayInput(e.target.value)}
        className="w-full border-2 border-blue-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-blue-700 focus:outline-none focus:border-blue-400 bg-white" />
    </div>
    <div className="p-4 rounded-2xl bg-gray-50 border-2 border-gray-200">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Total Number of Trays</p>
      <input type="number" min="1" placeholder="e.g. 30" value={alignerTotalTraysInput}
        onChange={e => setAlignerTotalTraysInput(e.target.value)}
        className="w-full border-2 border-blue-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-blue-700 focus:outline-none focus:border-blue-400 bg-white" />
    </div>
    <div className="p-4 rounded-2xl bg-gray-50 border-2 border-gray-200">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Days Per Tray</p>
      <div className="grid grid-cols-3 gap-2 mb-2">
        {[7, 10, 14].map(d => (
          <button key={d} onClick={() => setAlignerDaysPerTrayInput(String(d))}
            className={`py-2.5 rounded-xl font-bold text-sm transition-all ${ alignerDaysPerTrayInput === String(d) ? "bg-blue-600 text-white shadow-md" : "bg-blue-50 text-blue-700 border border-blue-200" }`}>
            {d} days
          </button>
        ))}
      </div>
      <input type="number" min="1" max="30" value={alignerDaysPerTrayInput}
        onChange={e => setAlignerDaysPerTrayInput(e.target.value)}
        className="w-full border border-blue-200 rounded-xl px-3 py-2 text-sm font-semibold text-blue-700 focus:outline-none focus:border-blue-400 bg-white" />
    </div>
    <div className="p-4 rounded-2xl bg-gray-50 border-2 border-gray-200">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Treatment Start Date</p>
      <input type="date" max={new Date().toISOString().split("T")[0]} value={alignerStartDateInput}
        onChange={e => setAlignerStartDateInput(e.target.value)}
        className="w-full border-2 border-blue-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-blue-700 focus:outline-none focus:border-blue-400 bg-white" />
    </div>
  </div>
  <button onClick={saveAlignerSetup}
    className="press hover-lift w-full py-4 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg shadow-blue-200 mt-5 mb-2">
    💾 Save Treatment
  </button>
  <button onClick={() => setShowAlignerSetup(false)}
    className="w-full py-3 text-sm text-gray-400 hover:bg-gray-50 rounded-2xl press font-semibold">
    {T("Cancel")}
  </button>
</div>
</div>
)}

</section>
);
}
