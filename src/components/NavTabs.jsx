import { useState } from "react";

export default function NavTabs({ activeTab, setActiveTab }) {
  const [showMore, setShowMore] = useState(false);

  const primaryTabs = ["Home", "Today", "Progress", "Tips", "Reminders"];
  const moreTabs = ["Scan", "Dentists", "Report", "Insights", "Mission", "Legal"];

  const handleTab = (tab) => {
    setActiveTab(tab.toLowerCase());
    setShowMore(false);
  };

  return (
    <div className="w-full overflow-x-auto pb-3">
      <div className="flex gap-2 px-2">
        {primaryTabs.map((tab) => {
          const active = activeTab === tab.toLowerCase();
          return (
            <button
              key={tab}
              onClick={() => handleTab(tab)}
              className={`
                px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap
                transition-all duration-200 border
                ${active
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-transparent shadow-md"
                  : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"}
              `}
            >
              {tab}
            </button>
          );
        })}

        {/* More button */}
        <div className="relative">
          <button
            onClick={() => setShowMore(!showMore)}
            className={`
              px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap
              transition-all duration-200 border
              ${moreTabs.map(t => t.toLowerCase()).includes(activeTab)
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-transparent shadow-md"
                : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"}
            `}
          >
            {moreTabs.map(t => t.toLowerCase()).includes(activeTab)
              ? activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
              : "More ▾"}
          </button>

          {showMore && (
            <div className="absolute top-11 left-0 z-50 bg-white border border-gray-200 rounded-2xl shadow-lg p-2 flex flex-col gap-1 min-w-[140px]">
              {moreTabs.map((tab) => {
                const active = activeTab === tab.toLowerCase();
                return (
                  <button
                    key={tab}
                    onClick={() => handleTab(tab)}
                    className={`
                      px-4 py-2 rounded-xl text-sm font-semibold text-left
                      transition-all duration-200
                      ${active
                        ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                        : "text-gray-700 hover:bg-gray-100"}
                    `}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
