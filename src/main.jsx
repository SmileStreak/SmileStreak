import { lazy, Suspense, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/manrope";
import "./entry.css";

const App = lazy(() => import("./App.jsx"));
const AGE_CONFIRMATION_KEY = "smilestreak-age-confirmed";

function hasSavedAdultConfirmation() {
  try {
    return localStorage.getItem(AGE_CONFIRMATION_KEY) === "18+";
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
        <h1 id="gate-title" style={styles.title}>Before we begin</h1>
        <p style={styles.copy}>The interactive SmileStreak features, including AI feedback, are for adults 18 and older. Enter your date of birth to confirm your age. Your date is used for this check only and is not saved.</p>
        <form onSubmit={submit}>
          <label htmlFor="birth-date" style={styles.label}>Date of birth</label>
          <input className="entry-input" id="birth-date" type="date" max={maxDate} value={birthDate} onChange={(event) => setBirthDate(event.target.value)} required style={styles.input} />
          {error && <p role="alert" style={styles.error}>{error}</p>}
          <button className="entry-button" type="submit" style={styles.button}>Continue</button>
        </form>
        <p style={styles.note}>This is a self-reported age check, not identity verification. If you are under 18, you can still view the brushing tips.</p>
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
  const [audience, setAudience] = useState(() => hasSavedAdultConfirmation() ? "adult" : null);

  useEffect(() => {
    if (audience !== "adult" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Service worker registration failed:", error);
    });
  }, [audience]);

  if (audience === "younger") return <YoungerTips />;
  if (audience !== "adult") return <AgeGate onSubmit={setAudience} />;
  return <Suspense fallback={<main style={styles.loading}>Loading SmileStreak…</main>}><App /></Suspense>;
}

const styles = {
  page: { minHeight: "100vh", boxSizing: "border-box", display: "grid", placeItems: "center", padding: "32px 20px", background: "#f7f8f6", color: "#2a2a2a", fontFamily: '"Manrope Variable", Manrope, ui-sans-serif, system-ui, sans-serif' },
  panel: { width: "100%", maxWidth: 440, boxSizing: "border-box", padding: "36px 32px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12 },
  brand: { margin: "0 0 32px", color: "#2a2a2a", fontFamily: '"Manrope Variable", Manrope, sans-serif', fontSize: 20, fontWeight: 700, letterSpacing: "-0.045em" },
  title: { margin: "0 0 12px", fontFamily: '"Manrope Variable", Manrope, sans-serif', fontSize: 28, lineHeight: 1.2, letterSpacing: "-.035em", fontWeight: 650 },
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
