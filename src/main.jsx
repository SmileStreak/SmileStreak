import { lazy, Suspense, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/source-sans-3";
import "./entry.css";

const App = lazy(() => import("./App.jsx"));
const AGE_CONFIRMATION_KEY = "smilestreak-age-confirmed";
const TOUR_COMPLETION_KEY = "smilestreak-tour-completed";

function hasSavedAdultConfirmation() {
  try {
    return localStorage.getItem(AGE_CONFIRMATION_KEY) === "18+";
  } catch {
    return false;
  }
}

function hasCompletedTour() {
  try {
    return localStorage.getItem(TOUR_COMPLETION_KEY) === "true";
  } catch {
    return false;
  }
}

function saveTourCompletion() {
  try {
    localStorage.setItem(TOUR_COMPLETION_KEY, "true");
  } catch {
    // Keep the completed state in memory if browser storage is unavailable.
  }
}

function ageOnDate(date, today = new Date()) {
  let age = today.getFullYear() - date.getFullYear();
  const beforeBirthday = today.getMonth() < date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() < date.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

function AgeGate({ onSubmit }) {
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState("");
  const now = new Date();
  const maxDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  function submit(event) {
    event.preventDefault();
    if (!birthDate) return setError("Enter your date of birth to continue.");
    const date = new Date(`${birthDate}T12:00:00`);
    if (Number.isNaN(date.getTime()) || birthDate > maxDate) {
      return setError("Enter a valid date of birth.");
    }
    setError("");
    const isAdult = ageOnDate(date) >= 18;
    if (isAdult) {
      try {
        // Persist only the self-reported eligibility result, never the birth date.
        localStorage.setItem(AGE_CONFIRMATION_KEY, "18+");
      } catch {
        // Continue for this visit if browser storage is unavailable.
      }
    }
    onSubmit(isAdult ? "adult" : "younger");
  }

  return (
    <main className="entry-age-gate">
      <div className="entry-age-preview" aria-hidden="true">
        <header className="entry-age-preview__header">
          <strong>smile<span>streak</span></strong>
          <nav><span>Home</span><span>Today</span><span>Progress</span><span>More</span></nav>
        </header>
        <div className="entry-age-preview__content">
          <div className="entry-age-preview__greeting"><small>YOUR DAILY CARE</small><h2>Small habits add up.</h2><p>A simple place to track brushing and flossing.</p></div>
          <section className="entry-age-preview__streak"><div><small>CURRENT STREAK</small><strong>— <span>days</span></strong></div><div><small>THIS WEEK</small><strong>— <span>check-ins</span></strong></div></section>
          <section className="entry-age-preview__routine"><div className="entry-age-preview__section-title"><strong>Today’s routine</strong><span>Log habits</span></div><div><i />Morning brushing</div><div><i />Night brushing</div><div><i />Flossing</div></section>
          <section className="entry-age-preview__week"><div className="entry-age-preview__section-title"><strong>Weekly activity</strong><span>View progress</span></div><div className="entry-age-preview__bars"><i /><i /><i /><i /><i /><i /><i /></div></section>
        </div>
      </div>
      <div className="entry-age-scrim" aria-hidden="true" />
      <section className="entry-age-panel" role="dialog" aria-modal="true" aria-labelledby="gate-title" aria-describedby="age-product gate-copy birth-date-help">
        <p style={styles.brand}>Smile<span style={{ color: "#16803c" }}>Streak</span></p>
        <h1 id="gate-title" style={styles.title}>Confirm your age</h1>
        <p id="age-product" className="entry-age-product">SmileStreak helps you track brushing and flossing and see how your routine builds over time.</p>
        <p id="gate-copy" style={styles.copy}>The interactive features are for adults 18 and older. We use your date of birth only to check whether you’re 18 or older. Your birth date is not saved. When browser storage is available, this browser remembers only that you passed the check.</p>
        <form onSubmit={submit}>
          <label htmlFor="birth-date" style={styles.label}>Date of birth</label>
          <input className="entry-input" id="birth-date" type="date" max={maxDate} value={birthDate} onChange={(event) => setBirthDate(event.target.value)} required aria-invalid={Boolean(error)} aria-describedby={error ? "birth-date-help birth-date-error" : "birth-date-help"} style={styles.input} />
          {error && <p id="birth-date-error" role="alert" style={styles.error}>{error}</p>}
          <button className="entry-button" type="submit" style={styles.button}>Continue to SmileStreak</button>
        </form>
        <p id="birth-date-help" style={styles.note}>This is a self-reported age check, not identity verification. If you are under 18, you can still view the brushing tips.</p>
      </section>
    </main>
  );
}

function YoungerTips() {
  return (
    <main className="entry-page" style={styles.page}>
      <section style={styles.panel} aria-labelledby="tips-title">
        <p style={styles.brand}>Smile<span style={{ color: "#16803c" }}>Streak</span></p>
        <h1 id="tips-title" style={styles.title}>A few good habits</h1>
        <ul style={styles.list}>
          <li>Brush gently for two minutes, morning and night.</li>
          <li>Use a soft-bristled toothbrush and fluoride toothpaste.</li>
          <li>Ask a parent or caregiver if you have questions about your teeth.</li>
        </ul>
        <p style={styles.note}>This tips page does not save or send anything. The interactive features are available only after a self-reported 18+ age check.</p>
      </section>
    </main>
  );
}

function Root() {
  const [audience, setAudience] = useState(() => {
    if (hasSavedAdultConfirmation()) return "adult";
    return "age-check";
  });
  const [startGuidedTour, setStartGuidedTour] = useState(() => (
    hasSavedAdultConfirmation() && !hasCompletedTour()
  ));

  const handleAgeSubmit = (result) => {
    setAudience(result);
    setStartGuidedTour(result === "adult" && !hasCompletedTour());
  };

  const finishGuidedTour = () => {
    saveTourCompletion();
    setStartGuidedTour(false);
  };

  useEffect(() => {
    if (audience !== "adult" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Service worker registration failed:", error);
    });
  }, [audience]);

  if (audience === "younger") return <YoungerTips />;
  if (audience === "age-check") return <AgeGate onSubmit={handleAgeSubmit} />;
  return <Suspense fallback={<main style={styles.loading}>Loading SmileStreak…</main>}><App startGuidedTour={startGuidedTour} onFinishGuidedTour={finishGuidedTour} /></Suspense>;
}

const styles = {
  page: { minHeight: "100vh", boxSizing: "border-box", display: "grid", placeItems: "center", padding: "32px 20px", background: "#f7f8f6", color: "#2a2a2a", fontFamily: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif' },
  panel: { width: "100%", maxWidth: 440, boxSizing: "border-box", padding: "36px 32px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12 },
  brand: { margin: "0 0 32px", color: "#2a2a2a", fontFamily: '"Avenir Next", Avenir, sans-serif', fontSize: 20, fontWeight: 650, letterSpacing: "-0.055em" },
  title: { margin: "0 0 12px", fontFamily: "Georgia, serif", fontSize: 30, lineHeight: 1.15, letterSpacing: "-.025em", fontWeight: 500 },
  copy: { margin: "0 0 24px", color: "#555", fontSize: 16, lineHeight: 1.55 },
  label: { display: "block", marginBottom: 7, fontSize: 14, fontWeight: 600 },
  input: { boxSizing: "border-box", width: "100%", minHeight: 46, padding: "10px 12px", border: "1px solid #cbd5df", borderRadius: 7, color: "#2a2a2a", background: "#fff", fontSize: 16 },
  button: { width: "100%", minHeight: 46, marginTop: 16, border: 0, borderRadius: 7, background: "#35666c", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" },
  error: { margin: "8px 0 0", color: "#855b58", fontSize: 14 },
  note: { margin: "18px 0 0", color: "#6a6a6a", fontSize: 13, lineHeight: 1.5 },
  list: { paddingLeft: 22, color: "#3c3c3c", fontSize: 16, lineHeight: 1.65 },
  loading: { minHeight: "100vh", display: "grid", placeItems: "center", background: "#f7f8f6", color: "#6a6a6a", fontFamily: "sans-serif" },
};

createRoot(document.getElementById("root")).render(<Root />);
