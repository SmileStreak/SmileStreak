self.importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
self.importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

self.firebase.initializeApp({
  apiKey: "AIzaSyCaKMTrcVwnl7xQhVUGC8GM9a4TOrgWJGs",
  authDomain: "smilestreak-91302.firebaseapp.com",
  projectId: "smilestreak-91302",
  storageBucket: "smilestreak-91302.firebasestorage.app",
  messagingSenderId: "698479190257",
  appId: "1:698479190257:web:f34315d38f3f9c5c0b8950",
});

const messaging = self.firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  self.registration.showNotification(notification.title || "Smile Streak", {
    body: notification.body || "Time for your dental-care routine.",
    icon: "/icon-511.png",
    badge: "/icon-192.png",
    data: payload.data,
  });
});

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  self.clients.claim();
});

self.addEventListener("fetch", () => {
  // no caching yet — just enabling PWA support
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SHOW_NOTIFICATION") {
    self.registration.showNotification("Smile Streak", {
      body: event.data.body || "Time to brush 🪥",
      icon: "/icon-511.png",
    });
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.link || "/reminders"));
});
