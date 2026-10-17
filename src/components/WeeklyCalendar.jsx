import { useContext, useEffect, useState } from "react";
import { TranslationContext } from "../App";
import { getDateKey } from "../utils/date";
import { Check } from "lucide-react";

export default function WeeklyCalendar({ habitData }) {
  const { t, currentLanguage } = useContext(TranslationContext);
  const [title, setTitle] = useState("Last 7 days");
  const today = new Date();

  useEffect(() => {
    let active = true;
    t("Last 7 days").then((translated) => {
      if (active) setTitle(translated);
    }).catch((error) => console.warn("Could not translate weekly calendar heading:", error));
    return () => { active = false; };
  }, [currentLanguage, t]);

  const days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    const key = getDateKey(d);
    const data = habitData[key];

    const completedCount = data
      ? ["morning", "night", "floss"].filter((habit) => data[habit] === true).length
      : 0;

    return {
      date: d,
      key,
      completedCount,
    };
  });

  const getStatus = (count) => {
    if (count === 3) return "complete";
    if (count > 0) return "partial";
    return "empty";
  };

    return (
    <section className="rounded-xl border border-slate-200 bg-white p-5" aria-labelledby="weekly-calendar-heading">
      <h3 id="weekly-calendar-heading" className="mb-4 text-sm font-semibold text-slate-900">{title}</h3>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map(({ date, completedCount, key }) => {
          const status = getStatus(completedCount);
          const isToday =
            date.toDateString() === today.toDateString();
          const dateLabel = date.toLocaleDateString(currentLanguage, { weekday: "long", month: "long", day: "numeric" });

          return (
            <div
              key={key}
              role="group"
              aria-label={`${dateLabel}: ${completedCount} of 3 habits completed`}
              title={`${dateLabel} · ${completedCount} of 3 habits`}
              className={`flex min-w-0 flex-col items-center gap-1.5 rounded-lg px-1 py-2 ${isToday ? "weekly-calendar__today" : "bg-transparent"}`}
            >
              <span className={`text-[11px] ${isToday ? "font-semibold text-slate-900" : "text-slate-600"}`}>
                {date.toLocaleDateString(currentLanguage, { weekday: "short" })}
              </span>
              <span className={`text-sm tabular-nums ${isToday ? "font-semibold text-slate-900" : "text-slate-700"}`}>{date.getDate()}</span>
              <span aria-hidden="true" className={`flex h-4 w-4 items-center justify-center rounded-full ${status === "complete" ? "bg-[var(--brand)] text-white" : status === "partial" ? "bg-slate-300" : "bg-slate-200"}`}>
                {status === "complete" && <Check size={10} strokeWidth={2.5} />}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
