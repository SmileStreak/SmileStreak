import { useState, useRef, useEffect, useContext } from "react";
import Presence from "./Presence";
import { ChevronDown } from "lucide-react";
import { TranslationContext } from "../App";
import { translateBatch } from "../utils/translate.js";

const primaryTabs = ["Home", "Today", "Progress", "Reminders"];
const moreTabs = ["Tips", "Scan", "Dentists", "Insights", "Report", "Mission", "Legal"];

export default function NavTabs({ activeTab, setActiveTab }) {
 const [showMore, setShowMore] = useState(false);
 const [moreMenuPosition, setMoreMenuPosition] = useState({ top: 0, left: 0 });
 const [labels, setLabels] = useState({});
 const { currentLanguage } = useContext(TranslationContext);
 const moreRef = useRef(null);

 const isMoreActive = moreTabs.map(t => t.toLowerCase()).includes(activeTab);

 const handleTab = (tab, returnFocusToMore = false) => {
   setActiveTab(tab.toLowerCase());
   setShowMore(false);
   if (returnFocusToMore) {
     window.requestAnimationFrame(() => moreRef.current?.querySelector("#more-tabs-trigger")?.focus());
   }
 };

 useEffect(() => {
   let active = true;
   const tabs = [...primaryTabs, ...moreTabs];
   const keys = [...tabs.map((tab) => tab.toLowerCase()), "more", "primaryNavigation"];
   const values = [...tabs, "More", "Primary navigation"];
   translateBatch(values, currentLanguage, "en").then((translated) => {
     if (active) setLabels(Object.fromEntries(keys.map((key, index) => [key, translated[index]])));
   }).catch((error) => console.error("Could not load navigation translations:", error));
   return () => { active = false; };
 }, [currentLanguage]);

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

 useEffect(() => {
   if (!showMore) return;
   let frame = 0;
   const updatePosition = () => {
     const rect = moreRef.current?.querySelector("#more-tabs-trigger")?.getBoundingClientRect();
     if (rect) setMoreMenuPosition({ top: rect.bottom + 8, left: rect.left });
   };
   const schedulePositionUpdate = () => {
     if (frame) return;
     frame = window.requestAnimationFrame(() => {
       frame = 0;
       updatePosition();
     });
   };
   updatePosition();
   window.addEventListener("resize", schedulePositionUpdate);
   window.addEventListener("scroll", schedulePositionUpdate, true);
   return () => {
     window.removeEventListener("resize", schedulePositionUpdate);
     window.removeEventListener("scroll", schedulePositionUpdate, true);
     if (frame) window.cancelAnimationFrame(frame);
   };
 }, [showMore]);

 return (
   <nav aria-label={labels.primaryNavigation || "Primary navigation"} className="app-tabs w-full overflow-x-auto border-b border-gray-200">
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
             {labels[tab.toLowerCase()] || tab}
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
             ? labels[activeTab] || activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
             : <><span>{labels.more || "More"}</span><ChevronDown aria-hidden="true" size={14} /></>}
         </button>

         <Presence open={showMore}>
         {showMore && (
           <div
            id="more-tabs-menu"
            data-origin="bottom-left"
             className="t-dropdown fixed z-[9999] max-h-[min(70dvh,420px)] min-w-[160px] overflow-y-auto overscroll-contain rounded-lg border border-gray-200 bg-white p-2 flex flex-col gap-1"
             style={moreMenuPosition}
           >
             {moreTabs.map((tab) => {
               const active = activeTab === tab.toLowerCase();
               return (
                 <button
                   key={tab}
                   type="button"
                   onClick={() => handleTab(tab, true)}
                   aria-current={active ? "page" : undefined}
                   className={`
                     app-tab-menu-item px-3 py-2.5 rounded-md text-sm font-medium text-left
                     ${active ? "is-active" : ""}
                   `}
                 >
                   {labels[tab.toLowerCase()] || tab}
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
