import { lazy, Suspense, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/source-sans-3";
import "./entry.css";

const App = lazy(() => import("./App.jsx"));
const AGE_CONFIRMATION_KEY = "smilestreak-age-confirmed";
const INTRO_SEEN_KEY = "smilestreak-intro-seen";

function hasSavedAdultConfirmation() {
  try {
    return localStorage.getItem(AGE_CONFIRMATION_KEY) === "18+";
  } catch {
    return false;
  }
}

function hasSeenIntro() {
  try {
    return localStorage.getItem(INTRO_SEEN_KEY) === "yes";
  } catch {
    return false;
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
    <main className="entry-page" style={styles.page}>
      <section style={styles.panel} aria-labelledby="gate-title">
        <p style={styles.brand}>Smile<span style={{ color: "#16803c" }}>Streak</span></p>
        <h1 id="gate-title" style={styles.title}>Confirm your age</h1>
        <p style={styles.copy}>The interactive features are for adults 18 and older. Enter your date of birth for the age check; SmileStreak saves only the eligibility result, not your birth date.</p>
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

function WelcomeIntro({ onContinue }) {
  return (
    <main className="entry-page" style={styles.page}>
      <section className="entry-intro" style={styles.panel} aria-labelledby="intro-title">
        <p style={styles.brand}>Smile<span style={{ color: "#16803c" }}>Streak</span></p>
        <p style={styles.eyebrow}>A simple daily routine</p>
        <h1 id="intro-title" style={styles.title}>Small habits. A clearer picture of your week.</h1>
        <p style={styles.copy}>Log morning brushing, night brushing, and flossing. Your streak and weekly view update as you check them off.</p>
        <ol className="entry-intro__steps" style={styles.steps}>
          <li><strong>Log today.</strong> The Today page is where you record each habit.</li>
          <li><strong>See your progress.</strong> Home shows your streak and weekly activity.</li>
          <li><strong>Make it easier.</strong> Set reminders or find a dentist when you need one.</li>
        </ol>
        <button className="entry-button" type="button" onClick={onContinue} style={styles.button}>Continue to age check</button>
        <p className="entry-intro__privacy" style={styles.note}>You can use SmileStreak without signing in. Your habits stay in this browser unless you choose to sign in and sync. Optional analytics stay off unless you allow them. We check age before enabling interactive features and don’t save your birth date.</p>
        <p className="entry-intro__disclaimer">Optional photo observations are educational and aren’t a diagnosis or dental care plan.</p>
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
  const [audience, setAudience] = useState(() => hasSavedAdultConfirmation() ? "adult" : hasSeenIntro() ? "age-check" : "intro");

  useEffect(() => {
    if (audience !== "adult" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Service worker registration failed:", error);
    });
  }, [audience]);

  if (audience === "younger") return <YoungerTips />;
  if (audience === "intro") return <WelcomeIntro onContinue={() => {
    try { localStorage.setItem(INTRO_SEEN_KEY, "yes"); } catch { /* Continue when browser storage is unavailable. */ }
    setAudience("age-check");
  }} />;
  if (audience === "age-check") return <AgeGate onSubmit={setAudience} />;
  return <Suspense fallback={<main style={styles.loading}>Loading SmileStreak…</main>}><App /></Suspense>;
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
  eyebrow: { margin: "-21px 0 9px", color: "#35666c", fontSize: 12, fontWeight: 650, letterSpacing: ".06em", textTransform: "uppercase" },
  steps: { display: "grid", gap: 12, margin: "0 0 24px", padding: 0, color: "#3c3c3c", fontSize: 14, lineHeight: 1.5, listStyle: "none" },
  list: { paddingLeft: 22, color: "#3c3c3c", fontSize: 16, lineHeight: 1.65 },
  loading: { minHeight: "100vh", display: "grid", placeItems: "center", background: "#f7f8f6", color: "#6a6a6a", fontFamily: "sans-serif" },
};

createRoot(document.getElementById("root")).render(<Root />);
