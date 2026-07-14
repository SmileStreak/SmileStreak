import WeeklyCalendar from "./WeeklyCalendar";
import { ACHIEVEMENTS } from "../data";
import { calculateStreaks } from "../utils/progress";
import { getDateKey } from "../utils/date";
import { Trophy, Flame, Calendar, TrendingUp, Award, Lock, Sparkles } from "lucide-react";
import { useState, useEffect, useContext, useMemo } from "react";
import { TranslationContext } from "../App";

export default function Progress({ habitData }) {
  const { t, currentLanguage } = useContext(TranslationContext);
  const [texts, setTexts] = useState({});
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const days = Object.values(habitData || {});

  const completedDays = days.filter(
    (d) => d?.morning && d?.night && d?.floss
  ).length;

  const { currentStreak, longestStreak } = calculateStreaks(habitData || {});

  const totalDays = Object.keys(habitData || {}).filter(k => k !== "__lastRecoveryUsed").length;
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
          monthLabels.push({ weekIndex: wi, label: firstCell.date.toLocaleDateString("en-US", { month: "short" }) });
          lastMonth = m;
        }
      }
    });

    // Total contributions this year
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const yearContributions = cells.filter(c => c.date >= yearStart && c.count > 0).length;

    return { weeks, monthLabels, yearContributions };
  }, [habitData]);

  const getCellColor = (cell) => {
    if (cell.isFuture) return "bg-gray-100";
    if (cell.count === 0) return "bg-gray-100";
    if (cell.count === 1) return "bg-green-200";
    if (cell.count === 2) return "bg-green-400";
    return "bg-green-600";
  };

  const formatTooltipDate = (date) =>
    date.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" });

  useEffect(() => {
    const translateAll = async () => {
      setTexts({
        yourProgress: await t("Your Progress"),
        trackJourney: await t("Track your dental care journey"),
        totalDays: await t("Total Days"),
        completionRate: await t("completion rate"),
        currentStreak: await t("Current Streak"),
        keepGoing: await t("Keep it going!"),
        startToday: await t("Start today!"),
        bestStreak: await t("Best Streak"),
        personalRecord: await t("Personal record"),
        achievements: await t("Achievements"),
        unlocked: await t("unlocked"),
        nextAchievement: await t("Next Achievement"),
        daysNeeded: await t("Days needed"),
        daysCompleted: await t("days completed"),
        days: await t("days"),
        awesome: await t("Awesome!"),
        completedMessage: await t("You've completed"),
        perfectDays: await t("perfect days of dental care. Keep up the amazing work!"),
        greatStart: await t("Great start!"),
        buildingMomentum: await t("Building momentum!"),
        onFire: await t("You're on fire!"),
        legendaryDedication: await t("Legendary dedication!"),
        maintainedPerfect: await t("You've maintained"),
        day: await t("day"),
        dentalCare: await t("of dental care"),
        activityHeatmap: await t("Activity Heatmap"),
        visualizeHabits: await t("Visualize your daily dental habits"),
        contributionsThisYear: await t("contributions this year"),
        longestStreak: await t("Longest Streak"),
      });
    };
    translateAll();
  }, [currentLanguage, t]);

  return (
    <section className="space-y-6 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-500 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-6 h-6" />
            <h2 className="text-2xl font-black">{texts.yourProgress || "Your Progress"}</h2>
          </div>
          <p className="text-sm opacity-90">{texts.trackJourney || "Track your dental care journey"}</p>
        </div>
      </div>

      {/* CALENDAR */}
      <div className="bg-white rounded-3xl p-5 shadow-lg border border-blue-100">
        <WeeklyCalendar habitData={habitData || {}} />
      </div>

      {/* ── ACTIVITY HEATMAP ── */}
      <div className="bg-white rounded-3xl p-5 shadow-lg border border-blue-100">
        {/* Card Header */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900">{texts.activityHeatmap || "Activity Heatmap"}</p>
            <p className="text-xs text-gray-500">{texts.visualizeHabits || "Visualize your daily dental habits"}</p>
          </div>
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
                    <div
                      key={cell.key}
                      className={`w-3 h-3 rounded-sm flex-shrink-0 cursor-pointer transition-transform duration-100 hover:scale-125 ${getCellColor(cell)} ${cell.isToday ? "ring-2 ring-blue-500 ring-offset-1" : ""}`}
                      onMouseEnter={(e) => {
                        if (!cell.isFuture) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltip({ cell, x: rect.left, y: rect.top });
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      onClick={() => {
                        if (!cell.isFuture) {
                          setTooltip(tooltip?.cell?.key === cell.key ? null : { cell, x: 0, y: 0, pinned: true });
                        }
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-1.5 mt-3 justify-end">
              <span className="text-[9px] text-gray-400">Less</span>
              {["bg-gray-100", "bg-green-200", "bg-green-400", "bg-green-600"].map((c, i) => (
                <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
              ))}
              <span className="text-[9px] text-gray-400">More</span>
            </div>
          </div>
        </div>

        {/* Below graph stats */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-lg font-black text-green-600">{heatmapData.yearContributions}</p>
            <p className="text-[10px] text-gray-400 font-medium">{texts.contributionsThisYear || "this year"}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-orange-500">{currentStreak}</p>
            <p className="text-[10px] text-gray-400 font-medium">{texts.currentStreak || "Current Streak"}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-blue-600">{longestStreak}</p>
            <p className="text-[10px] text-gray-400 font-medium">{texts.longestStreak || "Longest Streak"}</p>
          </div>
        </div>
      </div>

      {/* Tooltip — pinned modal on mobile tap */}
      {tooltip && tooltip.pinned && (
        <div
          className="fixed inset-0 bg-black/20 z-50 flex items-end justify-center pb-8"
          onClick={() => setTooltip(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-blue-100 p-4 w-64 mx-4"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-xs font-black text-gray-900 mb-2">{formatTooltipDate(tooltip.cell.date)}</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">🪥 Morning</span>
                <span className={`text-xs font-bold ${tooltip.cell.morning ? "text-green-600" : "text-red-400"}`}>{tooltip.cell.morning ? "✓" : "✗"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">🌙 Night</span>
                <span className={`text-xs font-bold ${tooltip.cell.night ? "text-green-600" : "text-red-400"}`}>{tooltip.cell.night ? "✓" : "✗"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">🧵 Floss</span>
                <span className={`text-xs font-bold ${tooltip.cell.floss ? "text-green-600" : "text-red-400"}`}>{tooltip.cell.floss ? "✓" : "✗"}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-700">Total</span>
                <span className="text-xs font-black text-blue-600">{tooltip.cell.count}/3</span>
              </div>
            </div>
            <button onClick={() => setTooltip(null)} className="w-full mt-3 py-2 text-xs text-gray-400 hover:bg-gray-50 rounded-xl font-semibold">Close</button>
          </div>
        </div>
      )}

      {/* Tooltip — hover on desktop */}
      {tooltip && !tooltip.pinned && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ top: tooltip.y - 130, left: Math.min(tooltip.x, window.innerWidth - 180) }}
        >
          <div className="bg-gray-900 text-white rounded-xl p-3 shadow-xl w-44">
            <p className="text-[10px] font-bold mb-1.5">{formatTooltipDate(tooltip.cell.date)}</p>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span>🪥 Morning</span>
                <span className={tooltip.cell.morning ? "text-green-400" : "text-red-400"}>{tooltip.cell.morning ? "✓" : "✗"}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>🌙 Night</span>
                <span className={tooltip.cell.night ? "text-green-400" : "text-red-400"}>{tooltip.cell.night ? "✓" : "✗"}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>🧵 Floss</span>
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

      {/* STATS GRID */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={<Calendar className="w-5 h-5 text-blue-500" />}
          label={texts.totalDays || "Total Days"}
          value={completedDays}
          color="blue"
          subtitle={`${completionRate}% ${texts.completionRate || "completion rate"}`}
        />
        <StatCard
          icon={<Flame className="w-5 h-5 text-orange-500" />}
          label={texts.currentStreak || "Current Streak"}
          value={currentStreak}
          color="orange"
          subtitle={currentStreak > 0 ? (texts.keepGoing || "Keep it going!") : (texts.startToday || "Start today!")}
        />
        <StatCard
          icon={<Trophy className="w-5 h-5 text-yellow-500" />}
          label={texts.bestStreak || "Best Streak"}
          value={longestStreak}
          color="yellow"
          subtitle={texts.personalRecord || "Personal record"}
        />
        <StatCard
          icon={<Award className="w-5 h-5 text-purple-500" />}
          label={texts.achievements || "Achievements"}
          value={ACHIEVEMENTS.filter(a => completedDays >= a.requirement).length}
          color="purple"
          subtitle={`/ ${ACHIEVEMENTS.length} ${texts.unlocked || "unlocked"}`}
        />
      </div>

      {/* Next Achievement Tracker */}
      {nextAchievement && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <p className="font-bold text-gray-900">{texts.nextAchievement || "Next Achievement"}</p>
              </div>
              <p className="text-2xl mb-1">{nextAchievement.icon}</p>
              <p className="text-sm font-semibold text-gray-700">{nextAchievement.label}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">{texts.daysNeeded || "Days needed"}</p>
              <p className="text-3xl font-black text-purple-600">{daysUntilNext}</p>
            </div>
          </div>
          <div className="relative w-full h-3 bg-purple-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
              style={{ width: `${(completedDays / nextAchievement.requirement) * 100}%` }}
            />
          </div>
          <p className="text-xs text-purple-700 mt-2 text-center font-medium">
            {completedDays} / {nextAchievement.requirement} {texts.daysCompleted || "days completed"}
          </p>
        </div>
      )}

      {/* ACHIEVEMENTS */}
      <div className="bg-white p-6 rounded-3xl shadow-lg border border-blue-100">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-lg flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-gray-900">{texts.achievements || "Achievements"}</h3>
          </div>
          <p className="text-sm text-gray-500">
            {ACHIEVEMENTS.filter(a => completedDays >= a.requirement).length} / {ACHIEVEMENTS.length}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = completedDays >= a.requirement;
            return (
              <button
                key={a.id}
                onClick={() => setSelectedAchievement(unlocked ? a : null)}
                className={`group relative p-4 rounded-2xl text-center transition-all duration-200 ${
                  unlocked
                    ? "bg-gradient-to-br from-yellow-100 to-orange-100 shadow-md hover:shadow-lg hover:scale-105 cursor-pointer"
                    : "bg-gray-100 opacity-50 cursor-not-allowed"
                }`}
              >
                {unlocked ? (
                  <>
                    <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
                      {a.icon}
                    </div>
                    <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </>
                ) : (
                  <>
                    <Lock className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                    <div className="text-2xl mb-2 filter grayscale">{a.icon}</div>
                  </>
                )}
                <p className="text-xs font-semibold text-gray-700">{a.label}</p>
                {!unlocked && (
                  <p className="text-xs text-gray-500 mt-1">{a.requirement} {texts.days || "days"}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setSelectedAchievement(null)}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-[scaleBounce_0.3s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="text-6xl mb-4">{selectedAchievement.icon}</div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">{selectedAchievement.label}</h3>
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl px-4 py-2 inline-block mb-4">
                <p className="text-sm font-semibold text-gray-700">
                  {texts.unlocked || "Unlocked"} at {selectedAchievement.requirement} {texts.days || "days"}
                </p>
              </div>
              <p className="text-gray-600 text-sm mb-6">
                {texts.completedMessage || "You've completed"} {completedDays} {texts.perfectDays || "perfect days of dental care. Keep up the amazing work!"}
              </p>
              <button
                onClick={() => setSelectedAchievement(null)}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                {texts.awesome || "Awesome!"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Motivational Footer */}
      {completedDays > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 text-center">
          <Sparkles className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="font-bold text-gray-900 mb-1">
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

function StatCard({ icon, label, value, color, subtitle }) {
  const colorClasses = {
    blue: "from-blue-500 to-cyan-500",
    orange: "from-orange-500 to-red-500",
    yellow: "from-yellow-500 to-orange-500",
    purple: "from-purple-500 to-pink-500",
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 bg-gradient-to-br ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-black text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}
