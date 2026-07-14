import { getDateKey } from "../utils/date";

export default function WeeklyCalendar({ habitData }) {
  const today = new Date();

  const days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    const key = getDateKey(d);
    const data = habitData[key];

    const completedCount = data
      ? Object.values(data).filter(Boolean).length
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
    <div className="bg-white rounded-3xl p-5 shadow-md">
      <h3 className="font-bold mb-4">Last 7 Days</h3>

      <div className="flex justify-between gap-2">
        {days.map(({ date, completedCount, key }) => {
          const status = getStatus(completedCount);
          const isToday =
            date.toDateString() === today.toDateString();

          return (
            <div
              key={key}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl w-10
                ${
                  isToday
                    ? "bg-cyan-100"
                    : "bg-gray-50"
                }`}
            >
              <span className="text-xs font-semibold">
                {date
                  .toLocaleDateString("en-US", { weekday: "short" })
                  .charAt(0)}
              </span>

              <span className="text-lg">
                {status === "complete"
                  ? "✅"
                  : status === "partial"
                  ? "◐"
                  : "○"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
