// src/utils/insights.js
// We intentionally gate insights behind minimum data thresholds
// to avoid premature or misleading behavioral conclusions.
const TASKS = ["morning", "night", "floss"];
const REFLECTION_KEYWORDS = [
  "tired",
  "late",
  "forgot",
  "stress",
  "busy",
  "school",
  "exam",
  "travel"
];

// ✅ Minimum data thresholds (added)
const MIN_DAYS_FOR_PATTERNS = 7;
const MIN_DAYS_FOR_REFLECTIONS = 3;

export function generateInsights(habitData) {
  const dates = Object.keys(habitData).filter(
    (k) => k.match(/^\d{4}-\d{2}-\d{2}$/)
  );

  let totalDays = dates.length;
  let completedDays = 0;

  const missedTaskCount = {
    morning: 0,
    night: 0,
    floss: 0
  };

  const weekdayMisses = {};
  const reflectionCounts = {};

  dates.forEach((dateKey) => {
    const day = habitData[dateKey];
    if (!day) return;

    const completedTasks = TASKS.filter((t) => day[t]).length;
    if (completedTasks === TASKS.length) {
      completedDays++;
    } else {
      // track missed tasks
      TASKS.forEach((t) => {
        if (day[t] === false) missedTaskCount[t]++;
      });

      // track weekday misses
      const weekday = new Date(dateKey).toLocaleDateString("en-US", {
        weekday: "long"
      });
      weekdayMisses[weekday] = (weekdayMisses[weekday] || 0) + 1;
    }

    // reflection keyword analysis
    if (typeof day.reflection === "string") {
      const text = day.reflection.toLowerCase();
      REFLECTION_KEYWORDS.forEach((word) => {
        if (text.includes(word)) {
          reflectionCounts[word] = (reflectionCounts[word] || 0) + 1;
        }
      });
    }
  });

  const completionRate =
    totalDays === 0 ? 0 : Math.round((completedDays / totalDays) * 100);

  const rawMostMissedTask = Object.entries(missedTaskCount).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0];

  const rawMostMissedDay = Object.entries(weekdayMisses).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0];

  const rawCommonReflectionReason = Object.entries(reflectionCounts).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0];

  // ✅ Confidence evaluation (added)
  const patternsReliable = totalDays >= MIN_DAYS_FOR_PATTERNS;
  const reflectionsReliable =
    Object.values(reflectionCounts).reduce((a, b) => a + b, 0) >=
    MIN_DAYS_FOR_REFLECTIONS;

  // ✅ Longitudinal synthesis (added)
  let summaryInsight = null;
  if (patternsReliable && rawMostMissedTask && rawMostMissedDay) {
    summaryInsight = `Missed routines most often involve ${rawMostMissedTask} care and tend to occur on ${rawMostMissedDay}s.`;
  }

  return {
    // existing outputs (unchanged names)
    totalDays,
    completedDays,
    completionRate,

    // uncertainty-aware gating (added behavior)
    mostMissedTask: patternsReliable ? rawMostMissedTask : null,
    mostMissedDay: patternsReliable ? rawMostMissedDay : null,
    commonReflectionReason: reflectionsReliable
      ? rawCommonReflectionReason
      : null,

    // ✅ confidence metadata (added)
    confidence: {
      patternsReliable,
      reflectionsReliable,
      totalDays,
      minDaysForPatterns: MIN_DAYS_FOR_PATTERNS,
      minReflectionsForInsights: MIN_DAYS_FOR_REFLECTIONS
    },

    // ✅ synthesized insight (added)
    summaryInsight
  };
}
