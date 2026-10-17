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

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Home({ setActiveTab, user, habitData }) {
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const { t, currentLanguage } = useContext(TranslationContext);
  const { darkMode } = useContext(ThemeContext);
  const [texts, setTexts] = useState({});
  const [nextMilestone, setNextMilestone] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentScans, setRecentScans] = useState([]);
  const [dailyTip, setDailyTip] = useState(null);
  const [lastScanDate, setLastScanDate] = useState(null);
  const [totalScans, setTotalScans] = useState(0);
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

  const dailyTips = [
    { id: 1, title: "Perfect Brushing Time", tip: "Brush for a full 2 minutes, spending 30 seconds in each quadrant of your mouth." },
    { id: 2, title: "Clean between teeth daily", tip: "The ADA recommends cleaning between your teeth once a day. Choose a time that fits your routine; flossing can happen before or after brushing." },
    { id: 3, title: "Mouthwash Matters", tip: "Use mouthwash after brushing and flossing to rinse away loosened debris and freshen breath." },
    { id: 4, title: "Replace Your Toothbrush", tip: "Change your toothbrush every 3-4 months or sooner if bristles are frayed." },
    { id: 5, title: "Healthy Diet, Healthy Teeth", tip: "Limit sugary snacks and drinks. Crunchy fruits and veggies like apples and carrots help clean teeth naturally." },
    { id: 6, title: "Don't Brush Too Hard", tip: "Aggressive brushing can damage gums and enamel. Use gentle, circular motions." },
    { id: 7, title: "Stay Hydrated", tip: "Drinking water helps wash away food particles and bacteria, and prevents dry mouth." }
  ];

  // Derive today's completion directly from habitData so it's always in sync
  const todayKey = new Date().toISOString().split("T")[0];
  const todayEntry = habitData?.[todayKey] || {};
  const todayDone = ["morning", "night", "floss"].filter(k => todayEntry[k]).length;
  const todayPct = todayDone === 0 ? 0 : todayDone === 1 ? 33 : todayDone === 2 ? 67 : 100;

  const habitLabels = [
    { key: "morning", label: "Morning", icon: <Sun className="w-5 h-5" /> },
    { key: "floss",   label: "Floss",   icon: <Brush className="w-5 h-5" /> },
    { key: "night",   label: "Night",   icon: <Moon className="w-5 h-5" /> },
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
  }, [habitData, user]);

  useEffect(() => {
    const translateAll = async () => {
      setTexts({
        title: await t("SmileStreak"),
        currentStreak: await t("Current Streak"),
        days: await t("days"),
        keepItUp: await t("Keep it up!"),
        updateToday: await t("Update Today"),
        dailyStreak: await t("Daily streak tracking"),
        dentistFinder: await t("Dentist finder tool"),
        progressInsights: await t("Progress insights"),
        scanTeeth: await t("Scan Teeth"),
        scanSummary: await t("Photo-based observations"),
        streaks: await t("Streaks"),
        trackHabits: await t("Track daily habits"),
        findDentists: await t("Find Dentists"),
        nearbyCare: await t("Nearby dental offices"),
        progress: await t("Progress"),
        reviewImprovements: await t("Review improvements"),
        longestStreak: await t("Longest Streak"),
        todayProgress: await t("Today's Progress"),
        nextMilestone: await t("Next Milestone"),
        recentScans: await t("Recent Scans"),
        viewAll: await t("View All"),
        upcomingAppointments: await t("Upcoming Appointments"),
        weeklyActivity: await t("Weekly Activity"),
        totalScans: await t("Total Scans"),
        lastScan: await t("Last Scan"),
        goodMorning: await t("Good Morning"),
        goodAfternoon: await t("Good Afternoon"),
        goodEvening: await t("Good Evening"),
        welcomeBack: await t("Welcome Back"),
        dailyCare: await t("Your daily care"),
        careIntro: await t("Log brushing and flossing to keep your streak on track."),
        personalBest: await t("Personal best"),
        scanHistory: await t("Scan history"),
        today: await t("Today"),
        habitsComplete: await t("habits complete"),
        simpleCheckIn: await t("Daily habits"),
        routine: await t("Your routine"),
        updateRoutine: await t("Update routine"),
        done: await t("Done"),
        notYet: await t("Not yet"),
        consistency: await t("Consistency"),
        dailyHabits: await t("Daily habits completed"),
        lessActivity: await t("Less activity"),
        moreActivity: await t("More activity"),
        nextVisit: await t("Next dentist visit"),
        notScheduled: await t("Not scheduled"),
        tapToLogVisit: await t("Tap to log a visit"),
        visitOverdue: await t("Visit is overdue"),
        addVisitWhenReady: await t("Add a visit when you're ready"),
        noteRoutine: await t("A note for your routine"),
        onCalendar: await t("On your calendar"),
        quickAccess: await t("Quick access"),
        noScans: await t("No scans yet")
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
    <div className="home-shell">
      <div className={`home-dashboard ${darkMode ? "is-dark" : ""}`}>
        <header className="home-page-heading">
          <div>
            <h2>{getGreeting()}{user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}</h2>
            <p className="home-intro">{texts.careIntro || "A few small habits add up to a healthier smile."}</p>
          </div>
          <p className="home-date">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
        </header>

        <section className="home-streak-summary" aria-label="Streak summary">
          <div className="home-streak-primary">
            <span className="home-eyebrow">{texts.currentStreak || "Current streak"}</span>
            <div className="home-streak-value"><strong>{streak}</strong><span>{texts.days || "days"}</span></div>
          </div>
          <div className="home-streak-secondary">
            <div><span className="home-eyebrow">{texts.personalBest || "Personal best"}</span><strong>{longestStreak}<small>d</small></strong></div>
            <div><span className="home-eyebrow">{texts.nextMilestone || "Next milestone"}</span><strong>{nextMilestone ? `${nextMilestone} days` : "—"}</strong><small>{nextMilestone && streak ? `${Math.max(nextMilestone - streak, 0)} to go` : "Keep your routine going"}</small></div>
            <div><span className="home-eyebrow">{texts.scanHistory || "Scan history"}</span><strong>{totalScans}</strong><small>{lastScanDate || texts.noScans || "No scans yet"}</small></div>
          </div>
          <div className="home-streak-progress">
            <div className="home-progress-label"><span>{texts.today || "Today"}</span><strong>{todayPct}%</strong></div>
            <div className="home-progress-track"><span style={{ width: `${todayPct}%` }} /></div>
            <small>{todayDone} of 3 {texts.habitsComplete || "habits complete"}</small>
          </div>
        </section>

        <div className="home-content-grid">
          <div className="home-main-column">
            <section className="home-routine-section">
              <div className="home-section-heading">
                <div><h3>{texts.routine || "Today's routine"}</h3></div>
                <button className="home-text-link" onClick={() => go("today")}>{texts.updateRoutine || "Update routine"} <ChevronRight size={16} /></button>
              </div>
              <div className="home-habit-list">
                {habitLabels.map((habit) => {
                  const completed = todayEntry[habit.key] === true;
                  return (
                    <div key={habit.key} className={`home-habit-row ${completed ? "is-complete" : ""}`}>
                      <span className="home-habit-icon">{habit.icon}</span>
                      <span className="home-habit-name">{habit.label}</span>
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
                  const key = date.toISOString().split("T")[0];
                  const entry = habitData?.[key];
                  const done = entry ? ["morning", "night", "floss"].filter((habit) => entry[habit]).length : 0;
                  const percent = done === 0 ? 0 : done === 1 ? 33 : done === 2 ? 67 : 100;
                  const isToday = key === todayKey;
                  return (
                    <div
                      key={i}
                      role="img"
                      aria-label={`${date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}: ${done} of 3 habits completed`}
                      title={`${date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · ${done}/3 habits`}
                      className={`home-week-day ${isToday ? "is-today" : ""}`}
                    >
                      <div className="home-week-bar-track"><span style={{ height: `${Math.max(percent, 5)}%` }} className={percent === 0 ? "is-empty" : ""} /></div>
                      <span>{date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1)}</span>
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
                {!nextDentistVisit ? <><strong>{texts.notScheduled || "Not scheduled"}</strong><small>{texts.tapToLogVisit || "Tap to log a visit"}</small></> : daysUntilVisit <= 0 ? <><strong>{texts.visitOverdue || "Visit is overdue"}</strong><small>Was due {formatVisitDate(nextDentistVisit)}</small></> : <><strong>{daysUntilVisit <= 14 ? `${daysUntilVisit} days` : formatVisitDate(nextDentistVisit)}</strong><small>{daysUntilVisit <= 14 ? formatVisitDate(nextDentistVisit) : texts.addVisitWhenReady || "Add a visit when you're ready"}</small></>}
                {lastDentistVisit && <small>Last visit: {formatVisitDate(lastDentistVisit)}</small>}
              </span>
              <ChevronRight size={17} />
            </button>

            {dailyTip && (
              <section className="home-tip-section">
                <h3>{dailyTip.title}</h3>
                <p>{dailyTip.tip}</p>
              </section>
            )}

            {upcomingAppointments.length > 0 && (
              <section className="home-appointments-section">
                <div className="home-section-heading"><div><h3>{texts.upcomingAppointments || "Upcoming appointments"}</h3></div></div>
                {upcomingAppointments.map((appointment, i) => (
                  <div key={i} className="home-appointment-row"><div><strong>{appointment.dentist}</strong><small>{new Date(appointment.date).toLocaleDateString()}</small></div><Calendar size={16} /></div>
                ))}
              </section>
            )}

            <nav className="home-shortcuts" aria-label="Quick actions">
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
            <div className="home-section-heading"><div><h3>{texts.recentScans || "Recent scans"}</h3></div><button className="home-text-link" onClick={() => go("scan")}>{texts.viewAll || "View all"}<ChevronRight size={16} /></button></div>
            <div className="home-recent-list">
              {recentScans.map((scan, i) => (
                <div key={i} className="home-recent-row"><img src={scan.image} alt="Dental scan" /><div><strong>{scan.timestamp}</strong><small>{scan.feedback}</small></div><ChevronRight size={16} /></div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
