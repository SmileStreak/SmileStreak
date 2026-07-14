// Standard FCM Service Worker
// Import Firebase scripts for Service Worker compatibility
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Initialize Firebase App in Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyCaKMTrcVwnl7xQhVUGC8GM9a4TOrgWJGs",
  authDomain: "smilestreak-91302.firebaseapp.com",
  projectId: "smilestreak-91302",
  storageBucket: "smilestreak-91302.firebasestorage.app",
  messagingSenderId: "698479190257",
  appId: "1:698479190257:web:f34315d38f3f9c5c0b8950",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);
  
  const notificationTitle = payload.notification?.title || "Smile Streak";
  const notificationOptions = {
    body: payload.notification?.body || "Time to brush 🪥",
    icon: payload.notification?.icon || "/icon-511.png",
    badge: "/icon-511.png",
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
