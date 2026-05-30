export default function NavTabs({ activeTab, setActiveTab }) {
  const tabs = [
    "Home",
    "Today",
    "Progress",
    "Tips",
    "Reminders",
    "Scan",
    "Dentists",
    "Report",
    "Insights",
    "Mission",
    "Legal"
  ];

  return (
    <div className="w-full overflow-x-auto pb-3">
      <div className="flex gap-2 px-2">

        {tabs.map((tab) => {
          const value = tab.toLowerCase();
          const active = activeTab === value;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(value)}
              className={`
                px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap
                transition-all duration-200 border
                ${
                  active
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-transparent shadow-md"
                    : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                }
              `}
            >
              {tab}
            </button>
          );
        })}

      </div>
    </div>
  );
}
