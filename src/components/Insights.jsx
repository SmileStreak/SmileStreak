import { generateInsights } from "../utils/insights";
import { useState, useContext, useEffect } from "react";
import { 
  TrendingUp, TrendingDown, Target, Award, Calendar, Zap, Brain,
  CheckCircle2, Flame, Trophy, BarChart3, Activity,
  Sun, Moon, Share2, Download, Printer
} from "lucide-react";
import { TranslationContext } from "../App";

export default function Insights({ habitData }) {
  const { t, currentLanguage, translating } = useContext(TranslationContext);
  const [translatedText, setTranslatedText] = useState({});

  // Translation keys
  const translationKeys = {
    title: "Smart Insights",
    subtitle: "Patterns in your daily care routine",
    noDataTitle: "No Data Yet",
    noDataDesc: "Start tracking your dental habits to see personalized insights and analytics!",
    healthScore: "Routine Score",
    scoreBreakdown: "Score Breakdown",
    completionRate: "Completion Rate",
    consistency: "Consistency",
    balance: "Balance",
    improvement: "Improvement",
    daysTracked: "Days Tracked",
    perfectDays: "Perfect Days",
    bestStreak: "Best Streak",
    timePerformance: "Time-of-Day Performance",
    morning: "Morning",
    night: "Night",
    yourStrongestTime: "Your strongest time!",
    howYouCompare: "How You Compare",
    yourScore: "Your Score",
    needsWork: "Needs Work",
    good: "Good",
    excellent: "Excellent",
    detectedPatterns: "Detected Patterns",
    mostMissedTask: "Most Missed Task",
    mostMissedTaskDesc: "{task} is your most commonly skipped task",
    challengingDay: "Challenging Day",
    challengingDayDesc: "{day}s are when you're most likely to miss tasks",
    patternDetectionNote: "Pattern detection improves after {days} days of tracking",
    overview: "Overview",
    motivationExcellent: "You're crushing it! Keep up this amazing routine.",
    motivationGood: "You're building great habits. Small improvements add up!",
    motivationNeedsWork: "Every day is a new opportunity. You've got this! 💪",
    completionRateDesc: "Tasks completed vs tracked",
    consistencyDesc: "Streak performance",
    balanceDesc: "Even task distribution",
    improvementDesc: "Recent vs past performance",
    
    scoreExcellent: "Excellent",
    scoreGreat: "Great",
    scoreGood: "Good",
    scoreFair: "Fair",
    scoreNeedsWork: "Needs Work",
    
    healthDescExcellent: "Outstanding dental care routine!",
    healthDescGood: "Good habits, room to improve",
    healthDescNeedsWork: "Let's build better consistency together",
    
    needsWorkRange: "<50%",
    goodRange: "50-80%",
    excellentRange: "80%+",
    dayStreak: "Day Streak!"
  };

  // Keep translation loading mounted across empty and populated states so
  // receiving the first tracked day never changes hook order.
  useEffect(() => {
    let active = true;
    const loadTranslations = async () => {
      const translations = {};
      for (const [key, value] of Object.entries(translationKeys)) {
        translations[key] = await t(value);
      }
      if (active) setTranslatedText(translations);
    };
    loadTranslations();
    return () => { active = false; };
  }, [currentLanguage, t]);

  // Safety check for habitData
  if (!habitData || Object.keys(habitData).length === 0) {
    return (
      <div className="space-y-6 pb-8">
        <div className="page-heading-surface relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-6 h-6" />
              <h2 className="text-2xl font-black">{translatedText.title || translationKeys.title}</h2>
            </div>
            <p className="text-sm opacity-90">{translatedText.subtitle || translationKeys.subtitle}</p>
          </div>
        </div>
        
        <div className="insights-empty-state bg-white rounded-3xl p-8 shadow-lg border border-blue-100 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">{translatedText.noDataTitle || translationKeys.noDataTitle}</h3>
          <p className="text-sm text-gray-600">
            {translatedText.noDataDesc || translationKeys.noDataDesc}
          </p>
        </div>
      </div>
    );
  }

  const insights = generateInsights(habitData);

  // Calculate REAL health score based on actual data
  const calculateHealthScore = () => {
    try {
      const weights = {
        completionRate: 0.4,
        consistency: 0.3,
        balance: 0.2,
        improvement: 0.1
      };

      const completionScore = insights.completionRate || 0;
      
      // Consistency: longest streak
      const dates = Object.keys(habitData).filter(k => !k.startsWith("__")).sort();
      
      if (dates.length === 0) {
        return {
          total: 0,
          breakdown: { completion: 0, consistency: 0, balance: 0, improvement: 0 },
          streak: 0,
          maxStreak: 0
        };
      }
      
      let maxStreak = 0;
      let tempStreak = 0;
      
      dates.forEach(date => {
        const d = habitData[date];
        if (d?.morning && d?.night && d?.floss) {
          tempStreak++;
          maxStreak = Math.max(maxStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      });
      
      const currentStreak = tempStreak;
      const consistencyScore = Math.min((maxStreak / 30) * 100, 100);

      // Balance: task distribution
      const morningRate = insights.taskStats?.morning || 0;
      const nightRate = insights.taskStats?.night || 0;
      const flossRate = insights.taskStats?.floss || 0;
      const avgRate = (morningRate + nightRate + flossRate) / 3;
      const variance = ((Math.abs(morningRate - avgRate) + Math.abs(nightRate - avgRate) + Math.abs(flossRate - avgRate)) / 3);
      const balanceScore = Math.max(100 - variance, 0);

      // Improvement: recent vs older
      const recentDays = dates.slice(-7);
      const olderDays = dates.slice(-14, -7);
      
      const recentCompletion = recentDays.length > 0 ? (recentDays.filter(d => {
        const day = habitData[d];
        return day?.morning && day?.night && day?.floss;
      }).length / recentDays.length * 100) : 0;
      
      const olderCompletion = olderDays.length > 0 ? (olderDays.filter(d => {
        const day = habitData[d];
        return day?.morning && day?.night && day?.floss;
      }).length / olderDays.length * 100) : recentCompletion;
      
      const improvementScore = Math.min(Math.max(50 + (recentCompletion - olderCompletion), 0), 100);

      const totalScore = Math.round(
        completionScore * weights.completionRate +
        consistencyScore * weights.consistency +
        balanceScore * weights.balance +
        improvementScore * weights.improvement
      );

      return {
        total: isNaN(totalScore) ? 0 : totalScore,
        breakdown: {
          completion: isNaN(completionScore) ? 0 : Math.round(completionScore),
          consistency: isNaN(consistencyScore) ? 0 : Math.round(consistencyScore),
          balance: isNaN(balanceScore) ? 0 : Math.round(balanceScore),
          improvement: isNaN(improvementScore) ? 0 : Math.round(improvementScore)
        },
        streak: currentStreak,
        maxStreak
      };
    } catch (error) {
      console.error("Error calculating health score:", error);
      return {
        total: 0,
        breakdown: { completion: 0, consistency: 0, balance: 0, improvement: 0 },
        streak: 0,
        maxStreak: 0
      };
    }
  };

  const healthScore = calculateHealthScore();

  // REAL time-of-day analysis
  const getTimePatterns = () => {
    try {
      const dates = Object.keys(habitData).filter(k => !k.startsWith("__"));
      
      if (dates.length === 0) {
        return { morningRate: 0, nightRate: 0, flossRate: 0, betterTime: 'morning' };
      }
      
      let morningSuccessful = 0;
      let nightSuccessful = 0;
      let flossSuccessful = 0;
      
      dates.forEach(date => {
        const d = habitData[date];
        if (d?.morning) morningSuccessful++;
        if (d?.night) nightSuccessful++;
        if (d?.floss) flossSuccessful++;
      });

      return {
        morningRate: Math.round((morningSuccessful / dates.length) * 100) || 0,
        nightRate: Math.round((nightSuccessful / dates.length) * 100) || 0,
        flossRate: Math.round((flossSuccessful / dates.length) * 100) || 0,
        betterTime: morningSuccessful >= nightSuccessful ? 'morning' : 'night'
      };
    } catch (error) {
      console.error("Error getting time patterns:", error);
      return { morningRate: 0, nightRate: 0, flossRate: 0, betterTime: 'morning' };
    }
  };

  const timePatterns = getTimePatterns();

  // Comparative benchmarks
  const getBenchmarks = () => {
    return {
      userScore: insights.completionRate || 0
    };
  };

  const benchmarks = getBenchmarks();

  // Label the habit-based score without implying a clinical health assessment.
  const getScoreStatus = (score) => {
    if (score >= 90) return { 
      label: translatedText.scoreExcellent || translationKeys.scoreExcellent
    };
    if (score >= 75) return { 
      label: translatedText.scoreGreat || translationKeys.scoreGreat
    };
    if (score >= 60) return { 
      label: translatedText.scoreGood || translationKeys.scoreGood
    };
    if (score >= 40) return { 
      label: translatedText.scoreFair || translationKeys.scoreFair
    };
    return { 
      label: translatedText.scoreNeedsWork || translationKeys.scoreNeedsWork
    };
  };

  const scoreStatus = getScoreStatus(healthScore.total);

  // Show loading state
  if (translating || Object.keys(translatedText).length === 0) {
    return (
      <div className="space-y-6 pb-8">
        <div className="page-heading-surface">
          <div className="animate-pulse flex items-center gap-2">
            <Brain className="w-6 h-6" />
            <h2 className="text-2xl font-black">Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="page-heading-surface relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-black">{translatedText.title}</h2>
          </div>
          <p className="text-sm opacity-90">{translatedText.subtitle}</p>
        </div>
      </div>

      {/* Habit-based score */}
      <section className="insights-score-band">
        <div className="insights-score-number"><strong>{healthScore.total}</strong><span>/ 100</span></div>
        <div className="insights-score-copy">
          <h3>{translatedText.healthScore}: {scoreStatus.label}</h3>
          <p>
            {healthScore.total >= 80 ? (translatedText.healthDescExcellent || translationKeys.healthDescExcellent) :
             healthScore.total >= 60 ? (translatedText.healthDescGood || translationKeys.healthDescGood) :
             (translatedText.healthDescNeedsWork || translationKeys.healthDescNeedsWork)}
          </p>
          <div className="insights-score-track" role="img" aria-label={`${translatedText.healthScore}: ${healthScore.total} out of 100`}>
            <span style={{ width: `${healthScore.total}%` }} />
          </div>
          {healthScore.streak > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600">
              <Flame className="w-5 h-5" />
              <span className="font-bold">{healthScore.streak} {translatedText.dayStreak}</span>
            </div>
          )}
        </div>
      </section>

      {/* Score Breakdown */}
      <div className="insights-score-breakdown bg-white rounded-3xl p-6 shadow-lg border border-blue-100">
        <h3 className="font-black text-gray-900 mb-4">{translatedText.scoreBreakdown}</h3>
        
        <div className="space-y-4">
          {[
            { label: translatedText.completionRate, value: healthScore.breakdown.completion, icon: <Target className="w-5 h-5 text-slate-600" />, desc: translatedText.completionRateDesc },
            { label: translatedText.consistency, value: healthScore.breakdown.consistency, icon: <Activity className="w-5 h-5 text-slate-600" />, desc: translatedText.consistencyDesc },
            { label: translatedText.balance, value: healthScore.breakdown.balance, icon: <BarChart3 className="w-5 h-5 text-slate-600" />, desc: translatedText.balanceDesc },
            { label: translatedText.improvement, value: healthScore.breakdown.improvement, icon: <TrendingUp className="w-5 h-5 text-slate-600" />, desc: translatedText.improvementDesc }
          ].map((metric) => (
            <div key={metric.label}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  {metric.icon}
                  <span className="font-semibold text-gray-900">{metric.label}</span>
                </div>
                <span className="font-bold text-gray-900">{metric.value}%</span>
              </div>
              <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--brand-action)] transition-all duration-500"
                  style={{ width: `${metric.value}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{metric.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* A compact, scan-friendly summary */}
      <dl className="progress-stat-strip grid grid-cols-3">
        <div><dt>{translatedText.daysTracked}</dt><dd>{insights.totalDays || 0}</dd></div>
        <div><dt>{translatedText.perfectDays}</dt><dd>{insights.completedDays || 0}</dd></div>
        <div><dt>{translatedText.bestStreak}</dt><dd>{healthScore.maxStreak}</dd></div>
      </dl>

      {/* Task Breakdown */}
      <div className="insights-task-breakdown bg-white rounded-3xl p-6 shadow-lg border border-blue-100">
        <h3 className="font-black text-gray-900 mb-4">Task Breakdown</h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-slate-600" />
                <span className="font-semibold text-gray-900">{translatedText.morning}</span>
              </div>
              <span className="font-bold text-gray-900">{timePatterns.morningRate}%</span>
            </div>
            <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--brand-action)]"
                style={{ width: `${timePatterns.morningRate}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Moon className="w-5 h-5 text-slate-600" />
                <span className="font-semibold text-gray-900">{translatedText.night}</span>
              </div>
              <span className="font-bold text-gray-900">{timePatterns.nightRate}%</span>
            </div>
            <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--brand-action)]"
                style={{ width: `${timePatterns.nightRate}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-slate-600" />
                <span className="font-semibold text-gray-900">Floss</span>
              </div>
              <span className="font-bold text-gray-900">{timePatterns.flossRate}%</span>
            </div>
            <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--brand-action)]"
                style={{ width: `${timePatterns.flossRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Patterns */}
      {(insights.mostMissedTask || insights.mostMissedDay) && (
        <section className="insights-patterns">
          <h3 className="font-black text-gray-900 mb-4">{translatedText.detectedPatterns}</h3>
          <div className="insights-patterns__rows">
            {insights.mostMissedTask && (
              <div className="insights-pattern-row">
                <span>{translatedText.mostMissedTask}</span>
                <p>{insights.mostMissedTask} is your most commonly skipped task</p>
              </div>
            )}
            
            {insights.mostMissedDay && (
              <div className="insights-pattern-row">
                <span>{translatedText.challengingDay}</span>
                <p>{insights.mostMissedDay}s are when you're most likely to miss tasks</p>
              </div>
            )}
          </div>

          {insights.confidence && !insights.confidence.patternsReliable && (
            <p className="mt-4 text-xs text-gray-500 text-center">
              {(translatedText.patternDetectionNote || translationKeys.patternDetectionNote)
                .replace('{days}', insights.confidence?.minDaysForPatterns || 14)}
            </p>
          )}
        </section>
      )}

      {/* Summary Insight */}
      {insights.summaryInsight && (
        <aside className="insights-editorial-note">
          <h3>{translatedText.overview}</h3>
          <p>{insights.summaryInsight}</p>
        </aside>
      )}

      {/* Motivation */}
      <aside className="insights-motivation">
        <p>
          {healthScore.total >= 80 ? (translatedText.motivationExcellent || translationKeys.motivationExcellent) :
           healthScore.total >= 60 ? (translatedText.motivationGood || translationKeys.motivationGood) :
           (translatedText.motivationNeedsWork || translationKeys.motivationNeedsWork)}
        </p>
      </aside>

      {/* Share & Export */}
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
        <button
          onClick={() => {
            navigator.share?.({
              title: 'My SmileStreak Routine Score',
              text: `My SmileStreak routine score is ${healthScore.total}%.`
            });
          }}
          className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
        >
          <Share2 className="h-4 w-4 text-[var(--brand)]" />
          <span>Share</span>
        </button>

        <button
          onClick={() => {
            const data = JSON.stringify({
              healthScore,
              insights,
              timestamp: new Date().toISOString()
            });
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `smile-streak-insights-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
          }}
          className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
        >
          <Download className="h-4 w-4 text-[var(--brand)]" />
          <span>Export</span>
        </button>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
        >
          <Printer className="h-4 w-4 text-[var(--brand)]" />
          <span>Print</span>
        </button>
      </div>
    </div>
  );
}
