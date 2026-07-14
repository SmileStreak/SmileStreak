importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyCaKMTrcVwnl7xQhVUGC8GM9a4TOrgWJGs",
  authDomain: "smilestreak-91302.firebaseapp.com",
  projectId: "smilestreak-91302",
  storageBucket: "smilestreak-91302.firebasestorage.app",
  messagingSenderId: "698479190257",
  appId: "1:698479190257:web:f34315d38f3f9c5c0b8950",
});

const messaging = firebase.messaging();

// Handle background notifications
messaging.onBackgroundMessage((payload) => {
  console.log("[sw.js] Background message:", payload);

  const notification = payload.notification || {};

  self.registration.showNotification(
    notification.title || "Smile Streak",
    {
      body: notification.body || "Time for your dental-care routine.",
      icon: "/icon-511.png",
      badge: "/icon-192.png",
      data: payload.data || {},
    }
  );
});

// Notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.link || "/reminders";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Activate immediately after update
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Allow foreground notifications from the app
self.addEventListener("message", (event) => {
  if (event.data?.type === "SHOW_NOTIFICATION") {
    self.registration.showNotification("Smile Streak", {
      body: event.data.body || "Time to brush 🪥",
      icon: "/icon-511.png",
      badge: "/icon-192.png",
    });
  }
});
