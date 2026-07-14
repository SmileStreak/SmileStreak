import { messaging, db } from "../firebase";
import { getToken, onMessage } from "firebase/messaging";
import { doc, setDoc, arrayUnion } from "firebase/firestore";

export async function requestNotificationPermission() {
  // Check browser support
  if (!("Notification" in window)) {
    return "unsupported";
  }

  // Already granted
  if (Notification.permission === "granted") {
    return "granted";
  }

  // Already denied
  if (Notification.permission === "denied") {
    return "denied";
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error("Error requesting notification permission:", err);
    return "denied";
  }
}

export async function setupFCMToken(user) {
  if (!user) return null;

  if (!("Notification" in window)) {
    console.warn("Notifications are not supported.");
    return null;
  }

  if (!("serviceWorker" in navigator)) {
    console.warn("Service workers are not supported.");
    return null;
  }

  try {
    if (Notification.permission !== "granted") {
      console.warn("Notification permission not granted.");
      return null;
    }

    if (!messaging) {
      console.warn("Firebase Messaging is not initialized.");
      return null;
    }

    const serviceWorkerRegistration = await navigator.serviceWorker.ready;

    if (!serviceWorkerRegistration) {
      console.error("Service worker not ready.");
      return null;
    }

    console.log("Getting FCM token...");

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration,
    });

    console.log("FCM token:", token);

    if (!token) {
      console.warn("No FCM token returned.");
      return null;
    }

    await setDoc(
      doc(db, "users", user.uid),
      {
        fcmToken: token,
        fcmTokens: arrayUnion(token),
        lastUpdated: new Date().toISOString(),
      },
      { merge: true }
    );

    return token;
  } catch (err) {
    console.error("Error setting up FCM:", err);
    return null;
  }
}

export function onForegroundMessage(callback) {
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    console.log("Foreground notification:", payload);

    if (callback) {
      callback(payload);
    }
  });
}