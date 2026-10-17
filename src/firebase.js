import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCaKMTrcVwnl7xQhVUGC8GM9a4TOrgWJGs",
  authDomain: "smilestreak-91302.firebaseapp.com",
  projectId: "smilestreak-91302",
  storageBucket: "smilestreak-91302.firebasestorage.app",
  messagingSenderId: "698479190257",
  appId: "1:698479190257:web:f34315d38f3f9c5c0b8950",
  measurementId: "G-03FTR93G2G",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);

let messaging = null;

try {
  if (typeof window !== "undefined") {
    messaging = getMessaging(app);
  }
} catch (e) {
  console.warn("Firebase Messaging unavailable:", e);
}

export { messaging };

export let analytics = null;
const ANALYTICS_CONSENT_KEY = "smilestreak-analytics-consent";
let analyticsConsentRevision = 0;

export async function setAnalyticsConsent(allowed) {
  if (typeof window === "undefined") return;
  const revision = ++analyticsConsentRevision;
  localStorage.setItem(ANALYTICS_CONSENT_KEY, allowed ? "granted" : "denied");

  if (!allowed) {
    if (!analytics) return;
    const { setAnalyticsCollectionEnabled } = await import("firebase/analytics");
    if (revision === analyticsConsentRevision) setAnalyticsCollectionEnabled(analytics, false);
    return;
  }

  const { isSupported, getAnalytics, setAnalyticsCollectionEnabled } = await import("firebase/analytics");
  if (revision !== analyticsConsentRevision || localStorage.getItem(ANALYTICS_CONSENT_KEY) !== "granted") return;
  if (!(await isSupported())) return;
  if (revision !== analyticsConsentRevision || localStorage.getItem(ANALYTICS_CONSENT_KEY) !== "granted") return;
  analytics = getAnalytics(app);
  setAnalyticsCollectionEnabled(analytics, true);
}

if (typeof window !== "undefined" && localStorage.getItem(ANALYTICS_CONSENT_KEY) === "granted") {
  setAnalyticsConsent(true).catch((error) => console.warn("Analytics could not be enabled:", error));
}

export default app;
