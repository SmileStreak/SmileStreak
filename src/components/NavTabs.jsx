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
   <nav aria-label="Primary navigation" className="app-tabs w-full overflow-x-auto border-b border-gray-200">
     <div className="flex min-w-max items-end gap-6 px-1">
       {primaryTabs.map((tab) => {
         const active = activeTab === tab.toLowerCase();
         return (
           <button
           key={tab}
             type="button"
             onClick={() => handleTab(tab)}
             aria-current={active ? "page" : undefined}
             className={`
               app-tab relative px-1 py-3 text-sm font-medium whitespace-nowrap border-b-2
               ${active ? "is-active" : ""}
             `}
           >
             {tab}
           </button>
         );
       })}

       <div ref={moreRef} className="relative">
         <button
           id="more-tabs-trigger"
           type="button"
           onClick={() => setShowMore((prev) => !prev)}
           aria-expanded={showMore}
           aria-controls="more-tabs-menu"
           className={`
             app-tab inline-flex items-center gap-1 px-1 py-3 text-sm font-medium whitespace-nowrap border-b-2
             ${isMoreActive || showMore ? "is-active" : ""}
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
                   type="button"
                   onClick={() => handleTab(tab)}
                   aria-current={active ? "page" : undefined}
                   className={`
                     app-tab-menu-item px-3 py-2.5 rounded-md text-sm font-medium text-left
                     ${active ? "is-active" : ""}
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
   </nav>
 );
}
