import { useState, useRef, useEffect } from "react";

const primaryTabs = ["Home", "Today", "Progress", "Reminders"];
const moreTabs = ["Tips", "Scan", "Dentists", "Insights", "Report", "Mission", "Legal"];

export default function NavTabs({ activeTab, setActiveTab }) {
 const [showMore, setShowMore] = useState(false);
 const moreRef = useRef(null);

 const isMoreActive = moreTabs.map(t => t.toLowerCase()).includes(activeTab);

 const handleTab = (tab) => {
   setActiveTab(tab.toLowerCase());
   setShowMore(false);
 };

 useEffect(() => {
   const handleClickOutside = (e) => {
     if (moreRef.current && !moreRef.current.contains(e.target)) {
       setShowMore(false);
     }
   };
   if (showMore) document.addEventListener("mousedown", handleClickOutside);
   return () => document.removeEventListener("mousedown", handleClickOutside);
 }, [showMore]);

 return (
   <div className="w-full px-2 pb-3 flex gap-2 items-center">
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

     <div ref={moreRef} className="relative">
       <button
         onClick={() => setShowMore((prev) => !prev)}
         className={`
           px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap
           transition-all duration-200 border
           ${isMoreActive || showMore
             ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-transparent shadow-md"
             : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"}
         `}
       >
         {isMoreActive
           ? activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
           : "More ▾"}
       </button>

       {showMore && (
         <div className="absolute top-11 left-0 z-[9999] bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 flex flex-col gap-1 min-w-[160px]">
           {moreTabs.map((tab) => {
             const active = activeTab === tab.toLowerCase();
             return (
               <button
                 key={tab}
                 onClick={() => handleTab(tab)}
                 className={`
                   px-4 py-2.5 rounded-xl text-sm font-semibold text-left
                   transition-all duration-200
                   ${active
                     ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                     : "text-gray-600 hover:bg-gray-50"}
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
 );
}
