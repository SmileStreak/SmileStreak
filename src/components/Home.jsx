import { useEffect, useState, useContext, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  Calendar, MapPin, TrendingUp, Moon, Sun, Check, ChevronRight,
  Brush, Camera
} from "lucide-react";
import { getCurrentStreak, getLongestStreak, getWeeklyActivity } from "../utils/streak";
import { TranslationContext, ThemeContext } from "../App";
import { storage } from "../utils/storage";
import { getDateFromKey, getDateKey } from "../utils/date";
import { translateBatch } from "../utils/translate.js";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const dailyTips = [
  { id: 1, title: "Perfect Brushing Time", tip: "Brush for a full 2 minutes, spending 30 seconds in each quadrant of your mouth." },
  { id: 2, title: "Clean between teeth daily", tip: "The ADA recommends cleaning between your teeth once a day. Choose a time that fits your routine; flossing can happen before or after brushing." },
  { id: 3, title: "Use mouthrinse as directed", tip: "Mouthrinse may complement brushing and flossing for some people. Follow the product label; it does not replace either habit." },
  { id: 4, title: "Replace Your Toothbrush", tip: "Change your toothbrush every 3-4 months or sooner if bristles are frayed." },
  { id: 5, title: "Healthy Diet, Healthy Teeth", tip: "Limit sugary snacks and drinks. Crunchy fruits and veggies like apples and carrots help clean teeth naturally." },
  { id: 6, title: "Don't Brush Too Hard", tip: "Aggressive brushing can damage gums and enamel. Use gentle, circular motions." },
  { id: 7, title: "Stay Hydrated", tip: "Drinking water helps wash away food particles and bacteria, and prevents dry mouth." }
];

export default function Home({ setActiveTab, user, habitData }) {
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const { currentLanguage } = useContext(TranslationContext);
  const { darkMode } = useContext(ThemeContext);
  const [texts, setTexts] = useState({});
  const [nextMilestone, setNextMilestone] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentScans, setRecentScans] = useState([]);
  const [totalScans, setTotalScans] = useState(0);
  const [translatedDailyTip, setTranslatedDailyTip] = useState(null);
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const weeklyChartRef = useRef(null);

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const bars = gsap.utils.toArray(
        ".home-week-bar-track span:not(.is-empty)",
        weeklyChartRef.current
      );
      if (!bars.length) return;

      gsap.timeline({
        scrollTrigger: {
          trigger: weeklyChartRef.current,
          start: "top 88%",
          once: true,
          refreshPriority: -1,
        },
      }).from(bars, {
        scaleY: 0.12,
        transformOrigin: "bottom",
        duration: 0.55,
        ease: "power2.out",
        stagger: 0.035,
      });
    });
    return () => media.revert();
  }, {
    scope: weeklyChartRef,
    dependencies: [weeklyActivity.length],
    revertOnUpdate: true,
  });

  const dailyTip = dailyTips[(new Date().getDate() - 1) % dailyTips.length];

  // Derive today's completion directly from habitData so it's always in sync
  const todayKey = getDateKey();
  const todayEntry = habitData?.[todayKey] || {};
  const todayDone = ["morning", "night", "floss"].filter(k => todayEntry[k]).length;

  const habitLabels = [
    { key: "morning", labelKey: "morning", fallbackLabel: "Morning", icon: <Sun className="w-5 h-5" /> },
    { key: "floss",   labelKey: "floss", fallbackLabel: "Floss", icon: <Brush className="w-5 h-5" /> },
    { key: "night",   labelKey: "night", fallbackLabel: "Night", icon: <Moon className="w-5 h-5" /> },
  ];

  useEffect(() => {
    const currentStreak = getCurrentStreak(habitData);
    setStreak(currentStreak);
    const longest = getLongestStreak(habitData);
    setLongestStreak(longest);

    const weekly = getWeeklyActivity(habitData);
    setWeeklyActivity(weekly);
    const milestones = [7, 30, 60, 90, 180, 365];
    const next = milestones.find(m => m > currentStreak) || 365;
    setNextMilestone(next);
    let scanHistory = [];
    try {
      const savedScans = JSON.parse(localStorage.getItem("scanHistory") || "[]");
      if (Array.isArray(savedScans)) scanHistory = savedScans;
    } catch (error) {
      console.warn("Could not read recent scan history:", error);
    }
    const validScans = scanHistory.filter((scan) => scan && typeof scan === "object" && typeof scan.image === "string" && scan.image.length > 0);
    setRecentScans(validScans.slice(0, 3));
    setTotalScans(validScans.length);
    const savedAppointments = storage.get("appointments", []);
    const appointments = Array.isArray(savedAppointments) ? savedAppointments : [];
    const upcoming = appointments
      .filter((apt) => apt && apt.date && Number.isFinite(new Date(apt.date).getTime()))
      .filter(apt => new Date(apt.date) > new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 2);
    setUpcomingAppointments(upcoming);
  }, [habitData, user]);

  useEffect(() => {
    let active = true;
    const translations = {
        title: "SmileStreak",
        currentStreak: "Current Streak",
        days: "days",
        keepItUp: "Keep it up!",
        updateToday: "Update Today",
        dailyStreak: "Daily streak tracking",
        dentistFinder: "Dentist finder tool",
        progressInsights: "Progress insights",
        scanTeeth: "Scan Teeth",
        scanSummary: "Photo-based observations",
        streaks: "Streaks",
        trackHabits: "Track daily habits",
        findDentists: "Find Dentists",
        nearbyCare: "Nearby dental offices",
        progress: "Progress",
        reviewImprovements: "Review improvements",
        longestStreak: "Longest Streak",
        todayProgress: "Today's Progress",
        nextMilestone: "Next Milestone",
        recentScans: "Recent Scans",
        savedScan: "Saved scan",
        viewAll: "View All",
        upcomingAppointments: "Upcoming Appointments",
        weeklyActivity: "Weekly Activity",
        totalScans: "Total Scans",
        lastScan: "Last Scan",
        goodMorning: "Good Morning",
        goodAfternoon: "Good Afternoon",
        goodEvening: "Good Evening",
        welcomeBack: "Welcome Back",
        dailyCare: "Your daily care",
        careIntro: "Log brushing and flossing to keep your streak on track.",
        personalBest: "Personal best",
        scanHistory: "Scan history",
        today: "Today",
        recently: "Recently",
        dateUnavailable: "Date unavailable",
        habitsComplete: "habits complete",
        habitsCompleted: "of 3 habits completed",
        morning: "Morning",
        floss: "Floss",
        night: "Night",
        streakSummary: "Streak summary",
        quickActions: "Quick actions",
        toGo: "to go",
        keepRoutineGoing: "Keep your routine going",
        simpleCheckIn: "Daily habits",
        routine: "Your routine",
        updateRoutine: "Update routine",
        done: "Done",
        notYet: "Not yet",
        consistency: "Consistency",
        dailyHabits: "Daily habits completed",
        lessActivity: "Less activity",
        moreActivity: "More activity",
        nextVisit: "Next dentist visit",
        notScheduled: "Not scheduled",
        tapToLogVisit: "Tap to log a visit",
        visitOverdue: "Visit is overdue",
        visitToday: "Visit today",
        addVisitWhenReady: "Add a visit when you're ready",
        noteRoutine: "A note for your routine",
        onCalendar: "On your calendar",
        quickAccess: "Quick access",
        noScans: "No scans yet"
    };
    const translateAll = async () => {
      const keys = Object.keys(translations);
      const values = await translateBatch(Object.values(translations), currentLanguage, "en");
      if (active) setTexts(Object.fromEntries(keys.map((key, index) => [key, values[index]])));
    };
    translateAll().catch((error) => {
      console.error("Could not load home translations:", error);
      if (active) setTexts(translations);
    });
    return () => { active = false; };
  }, [currentLanguage]);

  useEffect(() => {
    if (!dailyTip) return undefined;
    let active = true;
    setTranslatedDailyTip(null);
    translateBatch([dailyTip.title, dailyTip.tip], currentLanguage, "en")
      .then(([title, tip]) => {
        if (active) setTranslatedDailyTip({ title, tip });
      })
      .catch((error) => {
        console.error("Could not load daily tip translation:", error);
        if (active) setTranslatedDailyTip({ title: dailyTip.title, tip: dailyTip.tip });
      });
    return () => { active = false; };
  }, [currentLanguage, dailyTip]);

  const go = (tab) => {
    if (typeof setActiveTab === "function") setActiveTab(tab);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return texts.goodMorning || "Good Morning";
    if (hour < 18) return texts.goodAfternoon || "Good Afternoon";
    return texts.goodEvening || "Good Evening";
  };

  const nextDentistVisit = habitData?.__nextDentistVisit || null;
  const lastDentistVisit = habitData?.__lastDentistVisit || null;

  const getDaysUntilVisit = () => {
    if (!nextDentistVisit) return null;
    const visitDate = typeof nextDentistVisit === "string" && /^\d{4}-\d{2}-\d{2}$/.test(nextDentistVisit)
      ? getDateFromKey(nextDentistVisit)
      : new Date(nextDentistVisit);
    if (!Number.isFinite(visitDate.getTime())) return null;
    return Math.round((getDateFromKey(getDateKey(visitDate)) - getDateFromKey(getDateKey())) / (1000 * 60 * 60 * 24));
  };

  const formatVisitDate = (iso) => {
    if (!iso) return "";
    const date = typeof iso === "string" && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? getDateFromKey(iso) : new Date(iso);
    return Number.isFinite(date.getTime())
      ? date.toLocaleDateString(currentLanguage, { month: "long", day: "numeric", year: "numeric" })
      : "Date unavailable";
  };

  const formatScanTimestamp = (scan) => {
    const date = new Date(scan.date || scan.timestamp);
    if (Number.isFinite(date.getTime())) {
      return date.toLocaleString(currentLanguage, { dateStyle: "medium", timeStyle: "short" });
    }
    return scan.timestamp || texts.savedScan || "Saved scan";
  };

  const daysUntilVisit = getDaysUntilVisit();

  return (
    <div className="home-shell">
      <div className={`home-dashboard ${darkMode ? "is-dark" : ""}`}>
        <header className="home-page-heading">
          <div>
            <h2>{getGreeting()}{user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}</h2>
            <p className="home-intro">{texts.careIntro || "A few small habits add up to a healthier smile."}</p>
          </div>
          <p className="home-date">{new Date().toLocaleDateString(currentLanguage, { weekday: "long", month: "long", day: "numeric" })}</p>
        </header>

        <section className="home-streak-summary" aria-label={texts.streakSummary || "Streak summary"}>
          <div className="home-streak-primary">
            <span className="home-eyebrow">{texts.currentStreak || "Current streak"}</span>
            <div className="home-streak-value"><strong>{streak}</strong><span>{texts.days || "days"}</span></div>
          </div>
          <div className="home-streak-secondary">
            <div><span className="home-eyebrow">{texts.personalBest || "Personal best"}</span><strong>{longestStreak}<small>d</small></strong></div>
            <div><span className="home-eyebrow">{texts.nextMilestone || "Next milestone"}</span><strong>{nextMilestone ? `${nextMilestone} ${texts.days || "days"}` : "—"}</strong><small>{nextMilestone && streak ? `${Math.max(nextMilestone - streak, 0)} ${texts.toGo || "to go"}` : (texts.keepRoutineGoing || "Keep your routine going")}</small></div>
          </div>
        </section>

        <div className="home-content-grid">
          <div className="home-main-column">
            <section className="home-routine-section">
              <div className="home-section-heading">
                <div><h3>{texts.routine || "Today's routine"}</h3></div>
                <div className="home-routine-heading-actions">
                  <span className="home-routine-count" aria-label={`${todayDone} of 3 habits complete`}>{todayDone}/3</span>
                  <button className="home-text-link" onClick={() => go("today")}>{texts.updateRoutine || "Update routine"} <ChevronRight size={16} /></button>
                </div>
              </div>
              <div className="home-habit-list">
                {habitLabels.map((habit) => {
                  const completed = todayEntry[habit.key] === true;
                  return (
                    <div key={habit.key} className={`home-habit-row ${completed ? "is-complete" : ""}`}>
                      <span className="home-habit-icon">{habit.icon}</span>
                      <span className="home-habit-name">{texts[habit.labelKey] || habit.fallbackLabel}</span>
                      <span className="home-habit-status">{completed ? <><Check size={14} /> {texts.done || "Done"}</> : texts.notYet || "Not yet"}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="home-week-section" ref={weeklyChartRef}>
              <div className="home-section-heading">
                <div><h3>{texts.consistency || "Consistency"}</h3></div>
                <span className="home-muted-label">{texts.dailyHabits || "Daily habits completed"}</span>
              </div>
              <div className="home-week-chart">
                {weeklyActivity.map((day, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (6 - i));
                  const key = getDateKey(date);
                  const entry = habitData?.[key];
                  const done = entry ? ["morning", "night", "floss"].filter((habit) => entry[habit]).length : 0;
                  const percent = done === 0 ? 0 : done === 1 ? 33 : done === 2 ? 67 : 100;
                  const isToday = key === todayKey;
                  return (
                    <div
                      key={i}
                      role="img"
                      aria-label={`${date.toLocaleDateString(currentLanguage, { weekday: "long", month: "long", day: "numeric" })}: ${done} ${texts.habitsCompleted || "of 3 habits completed"}`}
                      title={`${date.toLocaleDateString(currentLanguage, { weekday: "short", month: "short", day: "numeric" })} · ${done}/3 ${texts.habitsComplete || "habits complete"}`}
                      className={`home-week-day ${isToday ? "is-today" : ""}`}
                    >
                      <div className="home-week-bar-track"><span style={{ height: `${Math.max(percent, 5)}%` }} className={percent === 0 ? "is-empty" : ""} /></div>
                      <span>{date.toLocaleDateString(currentLanguage, { weekday: "short" }).slice(0, 1)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="home-week-caption"><span>{texts.lessActivity || "Less activity"}</span><span>{texts.moreActivity || "More activity"}</span></div>
            </section>
          </div>

          <aside className="home-side-column">
            <button className="home-visit-row" onClick={() => go("today")}>
              <span className="home-aside-icon"><Calendar size={18} /></span>
              <span className="home-visit-copy">
                <span className="home-eyebrow">{texts.nextVisit || "Next dentist visit"}</span>
                {!nextDentistVisit ? <><strong>{texts.notScheduled || "Not scheduled"}</strong><small>{texts.tapToLogVisit || "Tap to log a visit"}</small></> : daysUntilVisit === null ? <><strong>{texts.dateUnavailable || "Date unavailable"}</strong><small>{texts.addVisitWhenReady || "Add a visit when you're ready"}</small></> : daysUntilVisit < 0 ? <><strong>{texts.visitOverdue || "Visit is overdue"}</strong><small>{formatVisitDate(nextDentistVisit)}</small></> : daysUntilVisit === 0 ? <><strong>{texts.visitToday || "Visit today"}</strong><small>{formatVisitDate(nextDentistVisit)}</small></> : <><strong>{daysUntilVisit <= 14 ? `${daysUntilVisit} days` : formatVisitDate(nextDentistVisit)}</strong><small>{daysUntilVisit <= 14 ? formatVisitDate(nextDentistVisit) : texts.addVisitWhenReady || "Add a visit when you're ready"}</small></>}
                {lastDentistVisit && <small>Last visit: {formatVisitDate(lastDentistVisit)}</small>}
              </span>
              <ChevronRight size={17} />
            </button>

            {dailyTip && (
              <section className="home-tip-section">
                <h3>{translatedDailyTip?.title || dailyTip.title}</h3>
                <p>{translatedDailyTip?.tip || dailyTip.tip}</p>
              </section>
            )}

            {upcomingAppointments.length > 0 && (
              <section className="home-appointments-section">
                <div className="home-section-heading"><div><h3>{texts.upcomingAppointments || "Upcoming appointments"}</h3></div></div>
                {upcomingAppointments.map((appointment, i) => (
                  <div key={i} className="home-appointment-row"><div><strong>{appointment.dentist}</strong><small>{formatVisitDate(appointment.date)}</small></div><Calendar size={16} /></div>
                ))}
              </section>
            )}

            <nav className="home-shortcuts" aria-label={texts.quickActions || "Quick actions"}>
              <h3>{texts.quickAccess || "Quick actions"}</h3>
              {[
                { tab: "scan", icon: <Camera size={17} />, label: texts.scanTeeth || "Scan teeth", detail: texts.scanSummary || "Photo-based observations" },
                { tab: "dentists", icon: <MapPin size={17} />, label: texts.findDentists || "Find dentists", detail: texts.nearbyCare || "Nearby dental offices" },
                { tab: "progress", icon: <TrendingUp size={17} />, label: texts.progress || "Progress", detail: texts.reviewImprovements || "Review your habits" },
              ].map((action) => (
                <button key={action.tab} onClick={() => go(action.tab)} className="home-shortcut-row">
                  <span className="home-aside-icon">{action.icon}</span><span><strong>{action.label}</strong><small>{action.detail}</small></span><ChevronRight size={16} />
                </button>
              ))}
            </nav>
          </aside>
        </div>

        {recentScans.length > 0 && (
          <section className="home-recent-section">
            <div className="home-section-heading"><div><h3>{texts.recentScans || "Recent scans"}</h3><span className="home-recent-total">{totalScans} {texts.totalScans || "saved"}</span></div><button className="home-text-link" onClick={() => go("scan")}>{texts.viewAll || "View all"}<ChevronRight size={16} /></button></div>
            <div className="home-recent-list">
                {recentScans.map((scan, i) => (
                <div key={scan.id || i} className="home-recent-row">{scan.image ? <img src={scan.image} alt="" loading="lazy" /> : <span aria-hidden="true" className="home-recent-placeholder"><Camera size={17} /></span>}<div><strong>{formatScanTimestamp(scan)}</strong><small>{scan.feedback || "No saved observation text"}</small></div></div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
