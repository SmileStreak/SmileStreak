import WeeklyCalendar from "./WeeklyCalendar";
import { ACHIEVEMENTS } from "../data";
import { calculateStreaks } from "../utils/progress";
import { getDateKey, isDateKey } from "../utils/date";
import { Trophy, Lock, Sparkles, CheckCircle2, Sun, Moon, Brush } from "lucide-react";
import { useState, useEffect, useContext, useMemo, useRef } from "react";
import { TranslationContext } from "../App";
import Presence from "./Presence";
import { translateBatch } from "../utils/translate.js";

export default function Progress({ habitData }) {
  const { currentLanguage } = useContext(TranslationContext);
  const [texts, setTexts] = useState({});
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const achievementReturnFocusRef = useRef(null);
  const tooltipReturnFocusRef = useRef(null);

  useEffect(() => {
    const dialog = tooltip?.pinned
      ? document.getElementById("progress-day-title")?.closest('[role="dialog"]')
      : null;
    if (!dialog) {
      if (tooltipReturnFocusRef.current?.isConnected) tooltipReturnFocusRef.current.focus();
      tooltipReturnFocusRef.current = null;
      return undefined;
    }

    if (!tooltipReturnFocusRef.current) tooltipReturnFocusRef.current = document.activeElement;
    const getFocusable = () => [...dialog.querySelectorAll('button:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])')];
    (getFocusable()[0] || dialog).focus();
    const handleDialogKeys = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setTooltip(null);
        return;
      }
      if (event.key !== "Tab") return;
      const items = getFocusable();
      if (!items.length) { event.preventDefault(); dialog.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleDialogKeys);
    return () => document.removeEventListener("keydown", handleDialogKeys);
  }, [tooltip?.pinned]);

  useEffect(() => {
    const dialog = selectedAchievement
      ? document.getElementById("achievement-dialog-title")?.closest('[role="dialog"]')
      : null;
    if (!dialog) {
      if (achievementReturnFocusRef.current?.isConnected) achievementReturnFocusRef.current.focus();
      achievementReturnFocusRef.current = null;
      return undefined;
    }

    if (!achievementReturnFocusRef.current) achievementReturnFocusRef.current = document.activeElement;
    const getFocusable = () => [...dialog.querySelectorAll('a[href], button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])')];
    const focusable = getFocusable();
    (focusable[0] || dialog).focus();
    const handleDialogKeys = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSelectedAchievement(null);
      } else if (event.key === "Tab") {
        const items = getFocusable();
        if (!items.length) { event.preventDefault(); dialog.focus(); return; }
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleDialogKeys);
    return () => document.removeEventListener("keydown", handleDialogKeys);
  }, [selectedAchievement]);

  const todayKey = getDateKey();
  const habitEntries = Object.entries(habitData || {}).filter(([key]) => isDateKey(key) && key <= todayKey);
  const days = habitEntries.map(([, day]) => day);

  const completedDays = days.filter(
    (d) => d?.morning && d?.night && d?.floss
  ).length;

  const { currentStreak, longestStreak } = calculateStreaks(habitData || {});

  const totalDays = habitEntries.length;
  const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  const nextAchievement = ACHIEVEMENTS.find(a => completedDays < a.requirement);
  const daysUntilNext = nextAchievement ? nextAchievement.requirement - completedDays : 0;

  // ── HEATMAP DATA ──
  const heatmapData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = getDateKey(today);

    // Find the most recent Sunday <= 364 days ago to align grid
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);
    // Rewind to the Sunday of that week
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const cells = [];
    const d = new Date(startDate);

    while (d <= today) {
      const key = getDateKey(d);
      const dayData = habitData[key];
      const morning = !!dayData?.morning;
      const night = !!dayData?.night;
      const floss = !!dayData?.floss;
      const count = [morning, night, floss].filter(Boolean).length;

      cells.push({
        key,
        date: new Date(d),
        morning,
        night,
        floss,
        count,
        isToday: key === todayKey,
        isFuture: d > today,
      });

      d.setDate(d.getDate() + 1);
    }

    // Group into weeks (columns of 7)
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }

    // Month labels: find first cell of each month
    const monthLabels = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const firstCell = week[0];
      if (firstCell) {
        const m = firstCell.date.getMonth();
        if (m !== lastMonth) {
          monthLabels.push({ weekIndex: wi, label: firstCell.date.toLocaleDateString(currentLanguage, { month: "short" }) });
          lastMonth = m;
        }
      }
    });

    // Total contributions this year
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const yearContributions = cells.filter(c => c.date >= yearStart && c.count > 0).length;

    return { weeks, monthLabels, yearContributions };
  }, [habitData, currentLanguage]);

  const getCellColor = (cell) => {
    if (cell.isFuture || cell.count === 0) return "heatmap-cell--0";
    if (cell.count === 1) return "heatmap-cell--1";
    if (cell.count === 2) return "heatmap-cell--2";
    return "heatmap-cell--3";
  };

  const formatTooltipDate = (date) =>
    date.toLocaleDateString(currentLanguage, { weekday: "short", month: "long", day: "numeric", year: "numeric" });

  useEffect(() => {
    let active = true;
    const translations = {
        yourProgress: "Your Progress",
        trackJourney: "Track your dental care journey",
        perfectDaysLabel: "Perfect days",
        completionRate: "completion rate",
        currentStreak: "Current Streak",
        keepGoing: "Keep it going!",
        startToday: "Start today!",
        bestStreak: "Best Streak",
        personalRecord: "Personal record",
        achievements: "Achievements",
        unlocked: "unlocked",
        nextAchievement: "Next Achievement",
        daysNeeded: "Days needed",
        daysCompleted: "days completed",
        days: "days",
        awesome: "Awesome!",
        completedMessage: "You've completed",
        perfectDays: "perfect days of dental care. Keep up the amazing work!",
        greatStart: "Great start!",
        buildingMomentum: "Building momentum!",
        onFire: "You're on fire!",
        legendaryDedication: "Legendary dedication!",
        maintainedPerfect: "You've maintained",
        day: "day",
        dentalCare: "of dental care",
        activityHeatmap: "Activity Heatmap",
        visualizeHabits: "Visualize your daily dental habits",
        contributionsThisYear: "contributions this year",
        longestStreak: "Longest Streak",
    };
    const translateAll = async () => {
      const keys = Object.keys(translations);
      const values = await translateBatch(Object.values(translations), currentLanguage, "en");
      if (active) setTexts(Object.fromEntries(keys.map((key, index) => [key, values[index]])));
    };
    translateAll().catch((error) => {
      console.error("Could not load progress translations:", error);
      if (active) setTexts(translations);
    });
    return () => { active = false; };
  }, [currentLanguage]);

  return (
    <section className="space-y-6 pb-8">
      {/* Header */}
      <div className="page-heading-surface relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-black">{texts.yourProgress || "Your Progress"}</h2>
          </div>
          <p className="text-sm opacity-90">{texts.trackJourney || "Track your dental care journey"}</p>
        </div>
      </div>

      {/* A single data strip keeps the overview scannable without repeating cards. */}
      <dl className="progress-stat-strip grid grid-cols-2 md:grid-cols-4">
        {[
          { label: texts.perfectDaysLabel || "Perfect days", value: completedDays, detail: `${completionRate}% ${texts.completionRate || "completion rate"}` },
          { label: texts.currentStreak || "Current streak", value: currentStreak, detail: currentStreak > 0 ? (texts.keepGoing || "Keep it going!") : (texts.startToday || "Start today!") },
          { label: texts.bestStreak || "Best streak", value: longestStreak, detail: texts.personalRecord || "Personal record" },
          { label: texts.achievements || "Achievements", value: `${ACHIEVEMENTS.filter(a => completedDays >= a.requirement).length} / ${ACHIEVEMENTS.length}`, detail: texts.unlocked || "unlocked" },
        ].map((stat) => (
          <div key={stat.label}>
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
            <small>{stat.detail}</small>
          </div>
        ))}
      </dl>

      {/* CALENDAR */}
      <WeeklyCalendar habitData={habitData || {}} />

      {/* ── ACTIVITY HEATMAP ── */}
      <div className="bg-white rounded-3xl p-5 shadow-lg border border-blue-100">
        {/* Card Header */}
      <div className="mb-1">
            <p className="font-bold text-gray-900">{texts.activityHeatmap || "Activity Heatmap"}</p>
            <p className="text-xs text-gray-500">{texts.visualizeHabits || "Visualize your daily dental habits"}</p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="min-w-max">
            {/* Month labels */}
            <div className="flex mb-1 ml-6">
              {heatmapData.weeks.map((_, wi) => {
                const label = heatmapData.monthLabels.find(m => m.weekIndex === wi);
                return (
                  <div key={wi} className="w-3 mr-0.5 flex-shrink-0">
                    {label && (
                      <span className="text-[9px] text-gray-400 font-medium whitespace-nowrap">{label.label}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Grid: weekday labels + cells */}
            <div className="flex gap-0.5">
              {/* Weekday labels */}
              <div className="flex flex-col gap-0.5 mr-1 flex-shrink-0">
                {["", "M", "", "W", "", "F", ""].map((label, i) => (
                  <div key={i} className="w-4 h-3 flex items-center justify-end">
                    <span className="text-[9px] text-gray-400 font-medium">{label}</span>
                  </div>
                ))}
              </div>

              {/* Weeks */}
              {heatmapData.weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-0.5 flex-shrink-0">
                  {week.map((cell, di) => (
                    <button
                      key={cell.key}
                      type="button"
                      aria-disabled={cell.isFuture}
                      tabIndex={cell.isFuture ? -1 : undefined}
                      aria-label={`${formatTooltipDate(cell.date)}: ${cell.count} of 3 habits completed`}
                      aria-pressed={cell.isFuture ? undefined : !!(tooltip?.pinned && tooltip.cell.key === cell.key)}
                      className={`heatmap-cell w-3 h-3 rounded-sm flex-shrink-0 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 ${getCellColor(cell)} ${cell.isToday ? "ring-1 ring-[#52777b] ring-offset-1" : ""}`}
                      onMouseEnter={(e) => {
                        if (!cell.isFuture) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltip({ cell, x: rect.left, y: rect.top });
                        }
                      }}
                      onMouseLeave={() => setTooltip(current => current?.pinned ? current : null)}
                      onClick={() => {
                        if (!cell.isFuture) {
                          setTooltip(current => current?.pinned && current.cell.key === cell.key ? null : { cell, x: 0, y: 0, pinned: true });
                        }
                      }}
                    >
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-1.5 mt-3 justify-end">
              <span className="text-[9px] text-gray-400">Less</span>
              {["heatmap-cell--0", "heatmap-cell--1", "heatmap-cell--2", "heatmap-cell--3"].map((c, i) => (
                <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
              ))}
              <span className="text-[9px] text-gray-400">More</span>
            </div>
          </div>
        </div>

        {/* Below graph stats */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-800">{heatmapData.yearContributions}</p>
            <p className="text-[10px] text-gray-400 font-medium">{texts.contributionsThisYear || "this year"}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-800">{currentStreak}</p>
            <p className="text-[10px] text-gray-400 font-medium">{texts.currentStreak || "Current Streak"}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-800">{longestStreak}</p>
            <p className="text-[10px] text-gray-400 font-medium">{texts.longestStreak || "Longest Streak"}</p>
          </div>
        </div>
      </div>

      {/* Tooltip — pinned modal on mobile tap */}
      <Presence open={tooltip && tooltip.pinned}>
{tooltip && tooltip.pinned && (
        <div
          className="t-modal-backdrop fixed inset-0 bg-black/20 z-50 flex items-end justify-center pb-8"
          onClick={() => setTooltip(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="progress-day-title"
            className="progress-day-dialog bg-white rounded-2xl shadow-2xl border border-blue-100 p-4 w-64 mx-4"
            onClick={e => e.stopPropagation()}
          >
            <p id="progress-day-title" className="text-xs font-black text-gray-900 mb-2">{formatTooltipDate(tooltip.cell.date)}</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-gray-600"><Sun size={14} aria-hidden="true" /> Morning</span>
                <span className={`text-xs font-bold ${tooltip.cell.morning ? "text-green-600" : "text-red-400"}`}>{tooltip.cell.morning ? "✓" : "✗"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-gray-600"><Moon size={14} aria-hidden="true" /> Night</span>
                <span className={`text-xs font-bold ${tooltip.cell.night ? "text-green-600" : "text-red-400"}`}>{tooltip.cell.night ? "✓" : "✗"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-gray-600"><Brush size={14} aria-hidden="true" /> Floss</span>
                <span className={`text-xs font-bold ${tooltip.cell.floss ? "text-green-600" : "text-red-400"}`}>{tooltip.cell.floss ? "✓" : "✗"}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-700">Total</span>
                <span className="text-xs font-black text-blue-600">{tooltip.cell.count}/3</span>
              </div>
            </div>
            <button onClick={() => setTooltip(null)} className="progress-tooltip-close w-full mt-3 py-2 text-xs text-gray-600 hover:bg-gray-50 rounded-xl font-semibold">Close</button>
          </div>
        </div>
      )}
</Presence>

      {/* Tooltip — hover on desktop */}
      {tooltip && !tooltip.pinned && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ top: Math.max(8, tooltip.y - 130), left: Math.max(8, Math.min(tooltip.x, window.innerWidth - 188)) }}
        >
          <div className="progress-day-tooltip bg-gray-900 text-white rounded-xl p-3 shadow-xl w-44" aria-hidden="true">
            <p className="text-[10px] font-bold mb-1.5">{formatTooltipDate(tooltip.cell.date)}</p>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="flex items-center gap-1.5"><Sun size={12} aria-hidden="true" /> Morning</span>
                <span className={tooltip.cell.morning ? "text-green-400" : "text-red-400"}>{tooltip.cell.morning ? "✓" : "✗"}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="flex items-center gap-1.5"><Moon size={12} aria-hidden="true" /> Night</span>
                <span className={tooltip.cell.night ? "text-green-400" : "text-red-400"}>{tooltip.cell.night ? "✓" : "✗"}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="flex items-center gap-1.5"><Brush size={12} aria-hidden="true" /> Floss</span>
                <span className={tooltip.cell.floss ? "text-green-400" : "text-red-400"}>{tooltip.cell.floss ? "✓" : "✗"}</span>
              </div>
              <div className="flex justify-between text-[10px] pt-1 border-t border-white/20">
                <span className="font-bold">Total</span>
                <span className="font-bold text-blue-400">{tooltip.cell.count}/3</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Next Achievement Tracker */}
      {nextAchievement && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-slate-700" />
                <p className="font-bold text-gray-900">{texts.nextAchievement || "Next Achievement"}</p>
              </div>
              <Trophy className="mb-2 h-5 w-5 text-[var(--brand)]" aria-hidden="true" />
              <p className="text-sm font-semibold text-gray-700">{nextAchievement.label}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">{texts.daysNeeded || "Days needed"}</p>
              <p className="text-3xl font-black text-slate-700">{daysUntilNext}</p>
            </div>
          </div>
          <div className="relative w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--brand)] transition-all duration-500"
              style={{ width: `${(completedDays / nextAchievement.requirement) * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-600 mt-2 text-center">
            {completedDays} / {nextAchievement.requirement} {texts.daysCompleted || "days completed"}
          </p>
        </div>
      )}

      {/* ACHIEVEMENTS */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900">{texts.achievements || "Achievements"}</h3>
          </div>
          <p className="text-sm text-gray-500">
            {ACHIEVEMENTS.filter(a => completedDays >= a.requirement).length} / {ACHIEVEMENTS.length}
          </p>
        </div>

        <div className="divide-y divide-slate-200">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = completedDays >= a.requirement;
            return (
              <button
                key={a.id}
                onClick={() => setSelectedAchievement(unlocked ? a : null)}
                disabled={!unlocked}
                aria-label={`${a.label}, ${unlocked ? "unlocked" : `${a.requirement - completedDays} days remaining`}`}
                className="flex w-full items-center gap-3 py-3 text-left transition-colors duration-200 hover:bg-slate-50 disabled:cursor-default"
              >
                {unlocked ? <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--brand)]" aria-hidden="true" /> : <Lock className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />}
                <span className="flex-1 text-sm font-medium text-slate-800">{a.label}</span>
                <span className="text-xs tabular-nums text-slate-500">{unlocked ? `${a.requirement} ${texts.days || "days"}` : `${Math.max(a.requirement - completedDays, 0)} ${texts.days || "days"} left`}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Achievement Detail Modal */}
      <Presence open={selectedAchievement}>
{selectedAchievement && (
        <div
          className="t-modal-backdrop fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedAchievement(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="achievement-dialog-title"
            className="progress-achievement-dialog bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <CheckCircle2 className="mx-auto mb-3 h-7 w-7 text-[var(--brand)]" aria-hidden="true" />
              <h3 id="achievement-dialog-title" className="text-xl font-semibold text-slate-900 mb-2">{selectedAchievement.label}</h3>
              <p className="mb-4 text-sm text-slate-600">
                {texts.unlocked || "Unlocked"} after {selectedAchievement.requirement} {texts.days || "days"}
              </p>
              <p className="text-gray-600 text-sm mb-6">
                {texts.completedMessage || "You've completed"} {completedDays} {texts.perfectDays || "perfect days of dental care. Keep up the amazing work!"}
              </p>
              <button
                onClick={() => setSelectedAchievement(null)}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-sm transition-all"
              >
                {texts.awesome || "Awesome!"}
              </button>
            </div>
          </div>
        </div>
      )}
</Presence>

      {/* Motivational Footer */}
      {completedDays > 0 && (
        <div className="border-t border-slate-200 pt-5">
          <p className="font-semibold text-slate-900 mb-1">
            {completedDays === 1
              ? (texts.greatStart || "Great start!")
              : completedDays < 7
              ? (texts.buildingMomentum || "Building momentum!")
              : completedDays < 30
              ? (texts.onFire || "You're on fire!")
              : (texts.legendaryDedication || "Legendary dedication!")}
          </p>
          <p className="text-sm text-gray-600">
            {texts.maintainedPerfect || "You've maintained"} {completedDays} {completedDays === 1 ? (texts.day || "day") : (texts.days || "days")} {texts.dentalCare || "of dental care"}
          </p>
        </div>
      )}
    </section>
  );
}
