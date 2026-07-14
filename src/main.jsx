import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}

// Request notification permission (must be user-triggered)
export async function requestNotificationPermission() {
  if (!("Notification" in window)) return;

  const permission = await Notification.requestPermission();
  console.log("Notification permission:", permission);
  return permission;
}

// Send a notification request to the service worker
export async function triggerNotification(title, body) {
  if (!("serviceWorker" in navigator)) return;

  const reg = await navigator.serviceWorker.ready;

  if (reg.active) {
    reg.active.postMessage({
      type: "SHOW_NOTIFICATION",
      title,
      body,
    });
  }
}
