import { useState, useRef, useEffect } from "react";
import Presence from "./Presence";
import { ChevronDown } from "lucide-react";

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
   const handleEscape = (e) => {
     if (e.key === "Escape") {
       setShowMore(false);
       moreRef.current?.querySelector("#more-tabs-trigger")?.focus();
     }
   };
   if (showMore) {
     document.addEventListener("mousedown", handleClickOutside);
     document.addEventListener("keydown", handleEscape);
   }
   return () => {
     document.removeEventListener("mousedown", handleClickOutside);
     document.removeEventListener("keydown", handleEscape);
   };
 }, [showMore]);

 return (
   <div className="w-full overflow-x-auto border-b border-gray-200">
     <div className="flex min-w-max items-end gap-6 px-1">
       {primaryTabs.map((tab) => {
         const active = activeTab === tab.toLowerCase();
         return (
           <button
             key={tab}
             onClick={() => handleTab(tab)}
             className={`
               relative px-1 py-3 text-sm font-medium whitespace-nowrap
               transition-colors duration-200 border-b-2
               ${active
                 ? "text-blue-700 border-blue-700"
                 : "text-gray-600 border-transparent hover:text-gray-900"}
             `}
           >
             {tab}
           </button>
         );
       })}

       <div ref={moreRef} className="relative">
         <button
           id="more-tabs-trigger"
           onClick={() => setShowMore((prev) => !prev)}
           aria-haspopup="menu"
           aria-expanded={showMore}
           aria-controls="more-tabs-menu"
           className={`
             inline-flex items-center gap-1 px-1 py-3 text-sm font-medium whitespace-nowrap
             transition-colors duration-200 border-b-2
             ${isMoreActive || showMore
               ? "text-blue-700 border-blue-700"
               : "text-gray-600 border-transparent hover:text-gray-900"}
           `}
         >
           {isMoreActive
             ? activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
             : <><span>More</span><ChevronDown aria-hidden="true" size={14} /></>}
         </button>

         <Presence open={showMore}>
         {showMore && (
           <div
            id="more-tabs-menu"
            role="menu"
            data-origin="bottom-left"
            className="t-dropdown fixed z-[9999] bg-white rounded-lg border border-gray-200 p-2 flex flex-col gap-1 min-w-[160px]"
             style={{
               top: moreRef.current
                 ? moreRef.current.getBoundingClientRect().bottom + 8
                 : 0,
               left: moreRef.current
                 ? moreRef.current.getBoundingClientRect().left
                 : 0,
             }}
           >
             {moreTabs.map((tab) => {
               const active = activeTab === tab.toLowerCase();
               return (
                 <button
                   key={tab}
                   onClick={() => handleTab(tab)}
                   role="menuitem"
                   className={`
                     px-3 py-2.5 rounded-md text-sm font-medium text-left
                     transition-colors duration-200
                     ${active
                       ? "bg-slate-100 text-blue-700"
                       : "text-gray-600 hover:bg-gray-50"}
                   `}
                 >
                   {tab}
                 </button>
               );
             })}
           </div>
         )}
         </Presence>
       </div>
     </div>
   </div>
 );
}
