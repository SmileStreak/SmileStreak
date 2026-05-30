import { useState, useRef, useEffect } from "react";

const bottomTabs = [
  { label: "Home", value: "home", icon: "⌂" },
  { label: "Today", value: "today", icon: "◎" },
  { label: "Progress", value: "progress", icon: "↗" },
  { label: "Reminders", value: "reminders", icon: "○" },
  { label: "More", value: "more", icon: "···" },
];

const moreTabs = [
  { label: "Scan", value: "scan" },
  { label: "Dentists", value: "dentists" },
  { label: "Tips", value: "tips" },
  { label: "Insights", value: "insights" },
  { label: "Report", value: "report" },
  { label: "Mission", value: "mission" },
  { label: "Legal", value: "legal" },
];

export default function NavTabs({ activeTab, setActiveTab }) {
  const [showMore, setShowMore] = useState(false);
  const sheetRef = useRef(null);

  const handleTab = (value) => {
    setActiveTab(value);
    setShowMore(false);
  };

  const isMoreActive = moreTabs.some((t) => t.value === activeTab);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target)) {
        setShowMore(false);
      }
    };
    if (showMore) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMore]);

  return (
    <>
      {/* Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-lg">
        <div className="flex items-center px-2 py-2 pb-5 gap-1 justify-start pr-20">
          {bottomTabs.map(({ label, value, icon }) => {
            const active = value === "more"
              ? isMoreActive || showMore
              : activeTab === value;

            return (
              <button
                key={value}
                onClick={() => value === "more" ? setShowMore(!showMore) : handleTab(value)}
                className={`
                  flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-2xl
                  transition-all duration-200 min-w-[60px]
                  ${active ? "bg-gradient-to-br from-blue-500 to-cyan-400" : "bg-transparent"}
                `}
              >
                <span className={`text-base font-bold leading-none ${active ? "text-white" : "text-gray-400"}`}>
                  {icon}
                </span>
                <span className={`text-[10px] font-semibold ${active ? "text-white" : "text-gray-400"}`}>
                  {value === "more" && isMoreActive
                    ? moreTabs.find(t => t.value === activeTab)?.label
                    : label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* More Bottom Sheet */}
      {showMore && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowMore(false)}
          />
          <div
            ref={sheetRef}
            className="fixed bottom-20 left-4 z-50 bg-white rounded-3xl shadow-2xl p-4 w-64"
          >
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">More</p>
            <div className="flex flex-col gap-1">
              {moreTabs.map(({ label, value }) => {
                const active = activeTab === value;
                return (
                  <button
                    key={value}
                    onClick={() => handleTab(value)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold
                      transition-all duration-200 text-left
                      ${active
                        ? "bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-50"}
                    `}
                  >
                    <div className={`w-2 h-2 rounded-full ${active ? "bg-white" : "bg-gray-200"}`} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
