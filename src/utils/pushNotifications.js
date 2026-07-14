import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";
import app, { db } from "../firebase";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
let foregroundListenerRegistered = false;

function tokenId(token) {
  let hash = 0;
  for (let index = 0; index < token.length; index += 1) {
    hash = (hash * 31 + token.charCodeAt(index)) | 0;
  }
  return `web-${Math.abs(hash)}`;
}

export async function savePushNotificationPreferences({ userId, reminders, enabled }) {
  if (!userId) {
    throw new Error("Sign in before enabling background reminders.");
  }

  if (!(await isSupported())) {
    throw new Error("This browser does not support background notifications.");
  }

  if (!VAPID_KEY) {
    throw new Error("Push notifications have not been configured yet.");
  }

  const registration = await navigator.serviceWorker.ready;
  const messaging = getMessaging(app);
  if (!foregroundListenerRegistered) {
    onMessage(messaging, async (payload) => {
      const notification = payload.notification || {};
      const activeRegistration = await navigator.serviceWorker.ready;
      activeRegistration.showNotification(notification.title || "Smile Streak", {
        body: notification.body || "Time for your dental-care routine.",
        icon: "/icon-511.png",
        badge: "/icon-192.png",
        data: payload.data,
      });
    });
    foregroundListenerRegistered = true;
  }
  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    throw new Error("We could not register this device for notifications.");
  }

  await setDoc(
    doc(db, "users", userId, "notificationTokens", tokenId(token)),
    {
      token,
      enabled,
      reminders,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}
