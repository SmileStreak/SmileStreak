import { useEffect, useState } from "react";
import { X } from "lucide-react";

const steps = [
  {
    tab: "home",
    target: ".home-streak-summary",
    title: "Your Home view",
    body: "Home brings your current streak and this week’s check-ins together. Let’s open the place where you log a habit.",
    nextLabel: "Show me Today",
  },
  {
    tab: "home",
    target: '[data-tour-tab="today"]',
    title: "Open Today",
    body: "Select Today in the navigation above. That’s where you check off brushing and flossing.",
    advanceOnTab: "today",
  },
  {
    tab: "today",
    target: ".today-task-panel",
    title: "Log your daily habits",
    body: "Check off morning or night brushing and choose floss or another interdental option. Each check-in updates your streak and weekly activity. You can explore without logging anything now.",
    nextLabel: "Show me Progress",
  },
  {
    tab: "today",
    target: '[data-tour-tab="progress"]',
    title: "Open Progress",
    body: "Select Progress to see how your habits add up over time.",
    advanceOnTab: "progress",
  },
  {
    tab: "progress",
    target: ".progress-stat-strip",
    title: "Review your patterns",
    body: "Progress gives you a closer look at your streaks and consistency. It updates from the check-ins you make in Today.",
    nextLabel: "Show me Reminders",
  },
  {
    tab: "progress",
    target: '[data-tour-tab="reminders"]',
    title: "Open Reminders",
    body: "Select Reminders to set a schedule if that would help your routine.",
    advanceOnTab: "reminders",
  },
  {
    tab: "reminders",
    target: ".reminder-quick-setup",
    title: "Keep it on your terms",
    body: "Reminders are optional. Notification permission is requested only when you choose to enable them. Tips, dentist finder, and photo observations are under More; location or photo use is explained before you choose.",
    nextLabel: "Explore More",
  },
  {
    tab: "reminders",
    target: '[data-tour-tab="more"]',
    title: "Open More",
    body: "Select More in the navigation to see the other SmileStreak tools.",
    advanceOnMoreOpen: true,
  },
  {
    tab: "reminders",
    target: "#more-tabs-menu",
    title: "Choose tools when you need them",
    body: "More includes tips, dentist finder, and photo observations. The dentist search waits for your choice to use location; photo observations explain consent before sending. You can explore any tool without doing it now.",
    nextLabel: "Finish tour",
    finish: true,
  },
];

export default function GuidedTour({ activeTab, isMoreOpen, onFinish }) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];

  useEffect(() => {
    if (step.advanceOnTab && step.advanceOnTab !== activeTab) return undefined;
    if (step.advanceOnMoreOpen && !isMoreOpen) return undefined;
    if (!step.advanceOnTab && !step.advanceOnMoreOpen) return undefined;
    const timer = window.setTimeout(() => setStepIndex((current) => Math.min(current + 1, steps.length - 1)), 180);
    return () => window.clearTimeout(timer);
  }, [activeTab, isMoreOpen, step.advanceOnMoreOpen, step.advanceOnTab]);

  useEffect(() => {
    let frame = 0;
    let target = null;
    let cancelled = false;
    const startedAt = performance.now();
    const findTarget = () => {
      if (cancelled) return;
      target = document.querySelector(step.target);
      if (target) {
        target.classList.add("ss-tour-focus");
        if (target.matches("[data-tour-tab]")) {
          target.focus({ preventScroll: true });
        } else if (step.target === "#more-tabs-menu") {
          target.querySelector('[role="menuitem"], button')?.focus({ preventScroll: true });
        } else if (step.nextLabel) {
          document.querySelector(".guided-tour__next")?.focus({ preventScroll: true });
        }
        if (!step.target.startsWith("[data-tour-tab")) {
          target.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
            block: "center",
          });
        }
        return;
      }
      if (performance.now() - startedAt < 2200) frame = window.requestAnimationFrame(findTarget);
    };
    frame = window.requestAnimationFrame(findTarget);
    return () => {
      cancelled = true;
      if (frame) window.cancelAnimationFrame(frame);
      target?.classList.remove("ss-tour-focus");
    };
  }, [activeTab, stepIndex, step.target]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") onFinish();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onFinish]);

  const continueTour = () => {
    if (step.finish) {
      onFinish();
      return;
    }
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  };

  return (
    <aside className="guided-tour" aria-label="SmileStreak interactive tour">
      <div className="guided-tour__topline">
        <span>GETTING STARTED</span>
        <button type="button" onClick={onFinish} aria-label="Close tour" className="guided-tour__close"><X size={17} /></button>
      </div>
      <p className="guided-tour__progress" role="status" aria-live="polite">Step {stepIndex + 1} of {steps.length}</p>
      <h2>{step.title}</h2>
      <p className="guided-tour__body" aria-live="polite">{step.body}</p>
      {step.advanceOnTab || step.advanceOnMoreOpen ? (
        <p className="guided-tour__hint">Select the highlighted page above with Enter or Space to continue.</p>
      ) : (
        <button type="button" className="guided-tour__next" onClick={continueTour}>{step.nextLabel}</button>
      )}
      <button type="button" className="guided-tour__skip" onClick={onFinish}>Skip tour</button>
    </aside>
  );
}
