import { useEffect, useState, useContext } from "react";
import {
  Scan, Calendar, MapPin, TrendingUp, Sparkles, Flame,
  Award, Bell, Clock, Target, Star, Heart, Shield,
  Activity, Smile, Coffee, Moon, Zap, AlertCircle,
  ChevronRight, Droplets, Brush, Pill, Apple, Camera
} from "lucide-react";
import { getCurrentStreak, getLongestStreak, getTodayProgress, getWeeklyActivity } from "../utils/streak";
import { TranslationContext, ThemeContext } from "../App";
import { storage } from "../utils/storage";

export default function Home({ setActiveTab, user, habitData }) {
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const { t, currentLanguage } = useContext(TranslationContext);
  const { darkMode } = useContext(ThemeContext);
  const [texts, setTexts] = useState({});
  const [todayProgress, setTodayProgress] = useState(0);
  const [nextMilestone, setNextMilestone] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentScans, setRecentScans] = useState([]);
  const [dailyTip, setDailyTip] = useState(null);
  const [lastScanDate, setLastScanDate] = useState(null);
  const [totalScans, setTotalScans] = useState(0);
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);

  const dailyTips = [
    { id: 1, title: "Perfect Brushing Time", tip: "Brush for a full 2 minutes, spending 30 seconds in each quadrant of your mouth.", icon: <Clock className="w-4 h-4" />, bgColor: "bg-blue-50", borderColor: "border-blue-200", textColor: "text-blue-600", iconBg: "bg-blue-500" },
    { id: 2, title: "Flossing Facts", tip: "Flossing removes plaque between teeth where your toothbrush can't reach. Do it before brushing!", icon: <Activity className="w-4 h-4" />, bgColor: "bg-blue-50", borderColor: "border-blue-200", textColor: "text-blue-600", iconBg: "bg-blue-500" },
    { id: 3, title: "Mouthwash Matters", tip: "Use mouthwash after brushing and flossing to rinse away loosened debris and freshen breath.", icon: <Droplets className="w-4 h-4" />, bgColor: "bg-blue-50", borderColor: "border-blue-200", textColor: "text-blue-600", iconBg: "bg-blue-500" },
    { id: 4, title: "Replace Your Toothbrush", tip: "Change your toothbrush every 3-4 months or sooner if bristles are frayed.", icon: <Brush className="w-4 h-4" />, bgColor: "bg-blue-50", borderColor: "border-blue-200", textColor: "text-blue-600", iconBg: "bg-blue-500" },
    { id: 5, title: "Healthy Diet, Healthy Teeth", tip: "Limit sugary snacks and drinks. Crunchy fruits and veggies like apples and carrots help clean teeth naturally.", icon: <Apple className="w-4 h-4" />, bgColor: "bg-blue-50", borderColor: "border-blue-200", textColor: "text-blue-600", iconBg: "bg-blue-500" },
    { id: 6, title: "Don't Brush Too Hard", tip: "Aggressive brushing can damage gums and enamel. Use gentle, circular motions.", icon: <Heart className="w-4 h-4" />, bgColor: "bg-blue-50", borderColor: "border-blue-200", textColor: "text-blue-600", iconBg: "bg-blue-500" },
    { id: 7, title: "Stay Hydrated", tip: "Drinking water helps wash away food particles and bacteria, and prevents dry mouth.", icon: <Coffee className="w-4 h-4" />, bgColor: "bg-blue-50", borderColor: "border-blue-200", textColor: "text-blue-600", iconBg: "bg-blue-500" }
  ];

  // Derive today's completion directly from habitData so it's always in sync
  const todayKey = new Date().toISOString().split("T")[0];
  const todayEntry = habitData?.[todayKey] || {};
  const todayDone = ["morning", "night", "floss"].filter(k => todayEntry[k]).length;
  const todayPct = todayDone === 0 ? 0 : todayDone === 1 ? 33 : todayDone === 2 ? 67 : 100;
  const progressStep = todayDone; // 0, 1, 2, or 3

  const habitLabels = [
    { key: "morning", label: "Morning", emoji: "🌅" },
    { key: "floss",   label: "Floss",   emoji: "🪥" },
    { key: "night",   label: "Night",   emoji: "🌙" },
  ];

  useEffect(() => {
    const currentStreak = getCurrentStreak(habitData);
    setStreak(currentStreak);
    const longest = getLongestStreak(habitData);
    setLongestStreak(longest);

    const today = new Date().toISOString().split("T")[0];
    const todayEntry = habitData?.[today] || {};
    const doneTasks = ["morning", "night", "floss"].filter(k => todayEntry[k]).length;
    const computedProgress = doneTasks === 0 ? 0 : doneTasks === 1 ? 33 : doneTasks === 2 ? 67 : 100;
    setTodayProgress(computedProgress);

    const weekly = getWeeklyActivity(habitData);
    setWeeklyActivity(weekly);
    const milestones = [7, 30, 60, 90, 180, 365];
    const next = milestones.find(m => m > currentStreak) || 365;
    setNextMilestone(next);
    const scanHistory = JSON.parse(localStorage.getItem("scanHistory") || "[]");
    setRecentScans(scanHistory.slice(0, 3));
    setTotalScans(scanHistory.length);
    if (scanHistory.length > 0) {
      const lastScan = new Date(scanHistory[0].date);
      const today2 = new Date();
      const diffDays = Math.floor((today2 - lastScan) / (1000 * 60 * 60 * 24));
      setLastScanDate(diffDays === 0 ? "Today" : diffDays === 1 ? "Yesterday" : `${diffDays} days ago`);
    }
    const appointments = storage.get("appointments", []);
    const upcoming = appointments
      .filter(apt => new Date(apt.date) > new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 2);
    setUpcomingAppointments(upcoming);
    const dayOfMonth = new Date().getDate();
    const tipIndex = (dayOfMonth - 1) % dailyTips.length;
    setDailyTip(dailyTips[tipIndex]);
    setIsAnimating(true);
  }, [habitData, user]);

  useEffect(() => {
    const translateAll = async () => {
      setTexts({
        title: await t("SmileStreak"),
        subtitle: await t("Build smarter dental habits with AI feedback"),
        currentStreak: await t("Current Streak"),
        days: await t("days"),
        keepItUp: await t("Keep it up!"),
        updateToday: await t("Update Today"),
        companion: await t("Your Dental Companion"),
        aiScan: await t("AI-powered scan feedback"),
        dailyStreak: await t("Daily streak tracking"),
        dentistFinder: await t("Dentist finder tool"),
        progressInsights: await t("Progress insights"),
        scanTeeth: await t("Scan Teeth"),
        aiFeedback: await t("AI brushing feedback"),
        streaks: await t("Streaks"),
        trackHabits: await t("Track daily habits"),
        findDentists: await t("Find Dentists"),
        nearbyCare: await t("Nearby care + insurance"),
        progress: await t("Progress"),
        reviewImprovements: await t("Review improvements"),
        longestStreak: await t("Longest Streak"),
        todayProgress: await t("Today's Progress"),
        nextMilestone: await t("Next Milestone"),
        dailyTip: await t("Daily Tip"),
        recentScans: await t("Recent Scans"),
        viewAll: await t("View All"),
        upcomingAppointments: await t("Upcoming Appointments"),
        weeklyActivity: await t("Weekly Activity"),
        totalScans: await t("Total Scans"),
        lastScan: await t("Last Scan"),
        goodMorning: await t("Good Morning"),
        goodAfternoon: await t("Good Afternoon"),
        goodEvening: await t("Good Evening"),
        welcomeBack: await t("Welcome Back")
      });
    };
    translateAll();
  }, [currentLanguage, t]);

  const go = (tab) => {
    if (typeof setActiveTab === "function") setActiveTab(tab);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return texts.goodMorning || "Good Morning";
    if (hour < 18) return texts.goodAfternoon || "Good Afternoon";
    return texts.goodEvening || "Good Evening";
  };

  const fadeIn = () =>
    `transition-all duration-700 ease-out ${isAnimating ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`;

  const nextDentistVisit = habitData?.__nextDentistVisit || null;
  const lastDentistVisit = habitData?.__lastDentistVisit || null;

  const getDaysUntilVisit = () => {
    if (!nextDentistVisit) return null;
    return Math.ceil((new Date(nextDentistVisit) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const formatVisitDate = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  const daysUntilVisit = getDaysUntilVisit();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-gray-900" : "bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50"}`}>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-lg mx-auto px-5 pt-6 pb-10 space-y-4">

        {/* ── HERO CARD ── */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-3xl px-5 pt-6 pb-5 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-24 translate-x-24 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-white/10 rounded-full translate-y-18 -translate-x-18 pointer-events-none" />
          <div className="absolute top-1/2 right-10 w-16 h-16 bg-white/5 rounded-full pointer-events-none" />

          <div className="relative z-10">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img
                  src="/icon-511.png"
                  alt="SmileStreak logo"
                  className="w-11 h-11 rounded-2xl shadow-lg object-cover ring-2 ring-white/40"
                />
                <div>
                  <p className="text-blue-100 text-xs font-medium">
                    {getGreeting()}{user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""} 👋
                  </p>
                  <h1 className="text-lg font-black text-white tracking-tight leading-tight">
                    {texts.title || "SmileStreak"}
                  </h1>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => go("scan")}
                  className="p-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl border border-white/20 transition-all duration-200 active:scale-95"
                  title="Quick Scan"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <button
                  onClick={() => go("today")}
                  className="p-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl border border-white/20 transition-all duration-200 active:scale-95"
                  title="Quick Update"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Streak + Best */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mb-1">
                  {texts.currentStreak || "Current Streak"}
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-6xl font-black text-white leading-none">{streak}</span>
                  <span className="text-blue-200 font-semibold text-base pb-1.5">{texts.days || "days"} 🔥</span>
                </div>
              </div>
              <div className="text-right pb-1">
                <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mb-1">
                  {texts.longestStreak || "Best"}
                </p>
                <div className="flex items-end gap-1 justify-end">
                  <span className="text-3xl font-black text-white leading-none">{longestStreak}</span>
                  <span className="text-blue-200 text-sm font-semibold pb-0.5">d</span>
                </div>
              </div>
            </div>

            {/* Stat pills inside the card */}
            <div className="grid grid-cols-3 gap-2.5 mt-5">
              {[
                { label: "Today", value: `${todayPct}%`, bar: true },
                { label: texts.nextMilestone || "Next Goal", value: nextMilestone ? `${nextMilestone}d` : "—", sub: nextMilestone && streak ? `${nextMilestone - streak} to go` : null },
                { label: texts.totalScans || "Scans", value: String(totalScans), sub: lastScanDate || "None yet" },
              ].map(({ label, value, sub, bar }) => (
                <div key={label} className="bg-white/20 backdrop-blur-sm rounded-2xl px-3 py-3 flex flex-col gap-1 border border-white/20">
                  <p className="text-[9px] font-bold text-blue-100 uppercase tracking-wider leading-none">{label}</p>
                  <p className="text-xl font-black text-white leading-none">{value}</p>
                  {bar && (
                    <div className="mt-0.5 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white/70 rounded-full transition-all duration-1000"
                        style={{ width: `${todayPct}%` }}
                      />
                    </div>
                  )}
                  {sub && <p className="text-[10px] text-blue-100 leading-tight">{sub}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TODAY'S PROGRESS — step tracker, synced to today's habitData */}
        <div className={`bg-white border border-blue-100 rounded-2xl shadow-md p-5 ${fadeIn()} hover:shadow-lg transition-all duration-300`}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-sm">
                <Target className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">{texts.todayProgress || "Today's Progress"}</h3>
            </div>
            <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              {todayPct}%
            </span>
          </div>

          <div className="flex items-start">
            {habitLabels.map((h, i) => {
              const completed = todayEntry[h.key] === true;
              const isLast = i === habitLabels.length - 1;
              // connector after this dot is filled if next habit is also done
              const nextCompleted = !isLast && todayEntry[habitLabels[i + 1].key] === true;
              return (
                <div key={h.key} className={`flex items-center ${isLast ? "flex-none" : "flex-1"}`}>
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-500 shadow-sm ${
                      completed
                        ? "bg-gradient-to-br from-blue-500 to-cyan-500 shadow-blue-200 scale-110"
                        : "bg-blue-50 border-2 border-blue-100"
                    }`}>
                      <span className={completed ? "" : "opacity-30"}>{h.emoji}</span>
                    </div>
                    <span className={`text-[10px] font-semibold whitespace-nowrap ${completed ? "text-blue-600" : "text-gray-400"}`}>
                      {h.label}
                    </span>
                  </div>
                  {!isLast && (
                    <div className={`flex-1 h-0.5 mx-2 mb-6 rounded-full transition-all duration-700 ${
                      completed && nextCompleted ? "bg-gradient-to-r from-blue-400 to-cyan-500" : "bg-blue-100"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* NEXT DENTIST VISIT */}
        <div
          className={`relative overflow-hidden rounded-2xl shadow-md border cursor-pointer hover:shadow-lg transition-all duration-300 active:scale-[0.99] ${fadeIn()} ${
            !nextDentistVisit ? "bg-white border-blue-100" :
            daysUntilVisit <= 0 ? "bg-orange-50 border-orange-200" :
            daysUntilVisit <= 14 ? "bg-amber-50 border-amber-200" :
            "bg-white border-blue-100"
          }`}
          onClick={() => go("today")}
        >
          {(!nextDentistVisit || daysUntilVisit > 14) && (
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-full -translate-y-10 translate-x-10 pointer-events-none" />
          )}
          <div className="relative p-4 flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm ${
              !nextDentistVisit ? "bg-gradient-to-br from-blue-100 to-cyan-100" :
              daysUntilVisit <= 0 ? "bg-orange-100" :
              daysUntilVisit <= 14 ? "bg-amber-100" :
              "bg-gradient-to-br from-blue-100 to-cyan-100"
            }`}>🦷</div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Next Dentist Visit</p>
              {!nextDentistVisit ? (
                <>
                  <p className="font-black text-sm text-blue-600">Not scheduled</p>
                  <p className="text-xs text-gray-400">Tap to log a visit</p>
                </>
              ) : daysUntilVisit <= 0 ? (
                <>
                  <p className="font-black text-sm text-orange-600">⚠️ Overdue</p>
                  <p className="text-xs text-gray-500">Was due {formatVisitDate(nextDentistVisit)}</p>
                </>
              ) : daysUntilVisit <= 14 ? (
                <>
                  <p className="font-black text-sm text-amber-600">⏰ In {daysUntilVisit} day{daysUntilVisit !== 1 ? "s" : ""}</p>
                  <p className="text-xs text-gray-500">{formatVisitDate(nextDentistVisit)}</p>
                </>
              ) : (
                <>
                  <p className="font-black text-sm text-blue-600">In {daysUntilVisit} days</p>
                  <p className="text-xs text-gray-500">{formatVisitDate(nextDentistVisit)}</p>
                </>
              )}
              {lastDentistVisit && (
                <p className="text-[10px] text-gray-400 mt-0.5">Last visit: {formatVisitDate(lastDentistVisit)}</p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-blue-300 flex-shrink-0" />
          </div>
        </div>

        {/* DAILY TIP */}
        {dailyTip && (
          <div className={`relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-2xl shadow-md p-5 ${fadeIn()} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-10 -translate-x-10 pointer-events-none" />
            <div className="relative flex items-start gap-3.5">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 text-white border border-white/20 shadow-sm">
                {dailyTip.icon}
              </div>
              <div>
                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1">✨ {texts.dailyTip || "Daily Tip"}</p>
                <h3 className="font-black text-white text-sm mb-1">{dailyTip.title}</h3>
                <p className="text-xs text-blue-100 leading-relaxed">{dailyTip.tip}</p>
              </div>
            </div>
          </div>
        )}

        {/* WEEKLY ACTIVITY */}
        <div className={`bg-white border border-blue-100 rounded-2xl shadow-md p-5 ${fadeIn()} hover:shadow-lg transition-all duration-300`}>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-sm">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">{texts.weeklyActivity || "Weekly Activity"}</h3>
          </div>
          <div className="flex justify-between items-end gap-1.5" style={{ height: "72px" }}>
            {weeklyActivity.map((day, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (6 - i));
              const key = d.toISOString().split("T")[0];
              const entry = habitData?.[key];
              const done = entry ? ["morning", "night", "floss"].filter(k => entry[k]).length : 0;
              const pct = done === 0 ? 0 : done === 1 ? 33 : done === 2 ? 67 : 100;
              const label = d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1);
              const isToday = key === todayKey;

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <div className="w-full flex justify-center items-end" style={{ height: "52px" }}>
                    <div
                      className={`w-full max-w-[22px] rounded-t-lg transition-all duration-700 ${
                        pct === 0   ? "bg-blue-50 border border-blue-100" :
                        pct === 33  ? "bg-gradient-to-t from-blue-300 to-blue-400" :
                        pct === 67  ? "bg-gradient-to-t from-blue-400 to-blue-500" :
                                      "bg-gradient-to-t from-blue-500 to-blue-600"
                      } group-hover:brightness-110`}
                      style={{ height: pct === 0 ? "4px" : `${(pct / 100) * 52}px` }}
                    />
                  </div>
                  <span className={`text-[10px] font-semibold transition-colors ${isToday ? "text-blue-600 font-bold" : "text-gray-400 group-hover:text-blue-500"}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-3 pt-3 border-t border-blue-50 text-[10px] text-gray-400 font-medium">
            <span>0%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-300 inline-block" /> 33%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> 67%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600 inline-block" /> 100%</span>
          </div>
        </div>

        {/* UPCOMING APPOINTMENTS */}
        {upcomingAppointments.length > 0 && (
          <div className={`bg-white border border-blue-100 rounded-2xl shadow-md p-5 ${fadeIn()} hover:shadow-lg transition-all duration-300`}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-sm">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">{texts.upcomingAppointments || "Upcoming Appointments"}</h3>
            </div>
            {upcomingAppointments.map((apt, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-blue-50 px-2 rounded-xl transition-colors">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{apt.dentist}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(apt.date).toLocaleDateString()}</p>
                </div>
                <button className="text-xs text-blue-600 font-bold bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                  View
                </button>
              </div>
            ))}
          </div>
        )}

        {/* RECENT SCANS */}
        {recentScans.length > 0 && (
          <div className={`bg-white border border-blue-100 rounded-2xl shadow-md p-5 ${fadeIn()} hover:shadow-lg transition-all duration-300`}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-sm">
                  <Camera className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">{texts.recentScans || "Recent Scans"}</h3>
              </div>
              <button
                onClick={() => go("scan")}
                className="text-xs text-blue-600 font-bold flex items-center gap-1 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
              >
                {texts.viewAll || "View All"} <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              {recentScans.map((scan, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100">
                  <img src={scan.image} alt="Scan" className="w-11 h-11 rounded-xl object-cover ring-2 ring-blue-100 shadow-sm flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{scan.timestamp}</p>
                    <p className="text-xs text-gray-400 truncate">{scan.feedback}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-blue-200 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QUICK ACTIONS */}
        <div className={`grid grid-cols-2 gap-3 ${fadeIn()}`}>
          {[
            { tab: "scan",     icon: <Camera className="w-5 h-5 text-white" />,     label: texts.scanTeeth || "Scan Teeth",       sub: texts.aiFeedback || "AI brushing feedback",       emoji: "🔬" },
            { tab: "today",    icon: <Calendar className="w-5 h-5 text-white" />,   label: texts.streaks || "Streaks",            sub: texts.trackHabits || "Track daily habits",        emoji: "🔥" },
            { tab: "dentists", icon: <MapPin className="w-5 h-5 text-white" />,     label: texts.findDentists || "Find Dentists", sub: texts.nearbyCare || "Nearby care + insurance",    emoji: "📍" },
            { tab: "progress", icon: <TrendingUp className="w-5 h-5 text-white" />, label: texts.progress || "Progress",         sub: texts.reviewImprovements || "Review improvements", emoji: "📈" },
          ].map(({ tab, icon, label, sub, emoji }) => (
            <button
              key={tab}
              onClick={() => go(tab)}
              className="group relative bg-white border border-blue-100 rounded-2xl p-4 shadow-md hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all duration-200 text-left overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-cyan-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
              <div className="absolute top-3 right-3 text-xl opacity-10 group-hover:opacity-20 transition-opacity select-none">{emoji}</div>
              <div className="relative flex flex-col gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200">
                  {icon}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm leading-tight">{label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{sub}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* MOTIVATIONAL QUOTE */}
        <div className={`text-center py-2 transition-all duration-700 ${isAnimating ? "opacity-100" : "opacity-0"}`}>
          <p className="text-xs text-blue-400 italic font-medium">"Every smile is unique. Every streak matters."</p>
        </div>

      </div>
    </div>
  );
}
