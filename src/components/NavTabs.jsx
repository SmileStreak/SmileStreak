import { useState, useRef, useEffect } from "react";

const bottomTabs = [
  { label: "Home", value: "home", icon: "🏠" },
  { label: "Today", value: "today", icon: "📅" },
  { label: "Progress", value: "progress", icon: "📈" },
  { label: "Reminders", value: "reminders", icon: "🔔" },
  { label: "More", value: "more", icon: "⋯" },
];

const moreTabs = [
  { label: "Scan", value: "scan", icon: "🔍" },
  { label: "Dentists", value: "dentists", icon: "🦷" },
  { label: "Tips", value: "tips", icon: "💡" },
  { label: "Insights", value: "insights", icon: "✨" },
  { label: "Report", value: "report", icon: "📄" },
  { label: "Mission", value: "mission", icon: "🎯" },
  { label: "Legal", value: "legal", icon: "⚖️" },
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
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-xl">
        <div className="flex justify-around items-center px-2 py-2 pb-4">
          {bottomTabs.map(({ label, value, icon }) => {
            const active = value === "more" ? isMoreActive || showMore : activeTab === value;
            return (
              <button
                key={value}
                onClick={() => value === "more" ? setShowMore(!showMore) : handleTab(value)}
                className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 min-w-[56px]"
              >
                <span className={`text-xl transition-transform duration-200 ${active ? "scale-110" : "scale-100"}`}>
                  {icon}
                </span>
                <span className={`text-[11px] font-semibold transition-colors duration-200 ${active ? "text-blue-500" : "text-gray-400"}`}>
                  {value === "more" && isMoreActive
                    ? moreTabs.find(t => t.value === activeTab)?.label
                    : label}
                </span>
                {active && (
                  <div className="w-1 h-1 rounded-full bg-blue-500 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* More Bottom Sheet */}
      {showMore && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setShowMore(false)} />

          {/* Sheet */}
          <div
            ref={sheetRef}
            className="fixed bottom-20 left-4 right-4 z-50 bg-white rounded-3xl shadow-2xl p-4"
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">More</p>
            <div className="grid grid-cols-3 gap-2">
              {moreTabs.map(({ label, value, icon }) => {
                const active = activeTab === value;
                return (
                  <button
                    key={value}
                    onClick={() => handleTab(value)}
                    className={`
                      flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-200
                      ${active
                        ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"}
                    `}
                  >
                    <span className="text-2xl">{icon}</span>
                    <span className="text-xs font-semibold">{label}</span>
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
