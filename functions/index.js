import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

initializeApp();

const db = getFirestore();
const messaging = getMessaging();
const SITE_URL = "https://smilestreak.vercel.app/reminders";
const REMINDER_COPY = {
  morning: "Time for your morning brush!",
  night: "Time for your night brush!",
  floss: "Don't forget to floss!",
};

function localClock(timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.filter(({ type }) => type !== "literal").map(({ type, value }) => [type, value]));
  return {
    day: `${value.year}-${value.month}-${value.day}`,
    minutes: Number(value.hour) * 60 + Number(value.minute),
  };
}

function minutesFromTime(time) {
  const [hour, minute] = String(time || "").split(":").map(Number);
  return Number.isInteger(hour) && Number.isInteger(minute) ? hour * 60 + minute : null;
}

export const sendScheduledReminders = onSchedule("every 5 minutes", async () => {
  const snapshots = await db.collectionGroup("notificationTokens").where("enabled", "==", true).get();
  const deliveries = [];

  for (const tokenDoc of snapshots.docs) {
    const subscription = tokenDoc.data();
    let clock;
    try {
      clock = localClock(subscription.timeZone || "UTC");
    } catch {
      logger.warn("Skipping notification with invalid time zone", { tokenDocument: tokenDoc.id });
      continue;
    }

    for (const [kind, time] of Object.entries(subscription.reminders || {})) {
      const scheduledMinute = minutesFromTime(time);
      const lastSent = subscription.lastSent?.[kind];
      if (
        !REMINDER_COPY[kind] ||
        scheduledMinute === null ||
        clock.minutes < scheduledMinute ||
        clock.minutes >= scheduledMinute + 5 ||
        lastSent === clock.day
      ) continue;

      deliveries.push(
        messaging.send({
          token: subscription.token,
          notification: { title: "🪥 Smile Streak", body: REMINDER_COPY[kind] },
          data: { kind, link: SITE_URL },
          webpush: { fcmOptions: { link: SITE_URL } },
        }).then(() => tokenDoc.ref.set({ lastSent: { [kind]: clock.day } }, { merge: true }))
          .catch(async (error) => {
            if (["messaging/registration-token-not-registered", "messaging/invalid-registration-token"].includes(error.code)) {
              await tokenDoc.ref.delete();
              return;
            }
            logger.error("Unable to send reminder", { tokenDocument: tokenDoc.id, error: error.message });
          })
      );
    }
  }

  await Promise.all(deliveries);
  logger.info("Finished scheduled reminder run", { deliveries: deliveries.length });
});
