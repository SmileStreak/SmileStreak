// Import Firebase core
import { initializeApp } from "firebase/app";

// Import Auth
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Import Firestore (for saving user data)
import { getFirestore } from "firebase/firestore";

// Import Analytics (optional)
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCaKMTrcVwnl7xQhVUGC8GM9a4TOrgWJGs",
  authDomain: "smilestreak-91302.firebaseapp.com",
  projectId: "smilestreak-91302",
  storageBucket: "smilestreak-91302.firebasestorage.app",
  messagingSenderId: "698479190257",
  appId: "1:698479190257:web:f34315d38f3f9c5c0b8950",
  measurementId: "G-03FTR93G2G"
};

const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);   // ⭐ THIS is what lets you store user data

// Optional analytics
export const analytics = getAnalytics(app);

export default app;
