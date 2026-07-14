import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
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

  const value = Object.fromEntries(
    parts
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value])
  );

  return {
    day: `${value.year}-${value.month}-${value.day}`,
    minutes: Number(value.hour) * 60 + Number(value.minute),
  };
}

function minutesFromTime(time) {
  const [hour, minute] = String(time || "").split(":").map(Number);

  return Number.isInteger(hour) && Number.isInteger(minute)
    ? hour * 60 + Number(minute)
    : null;
}


// ===============================
// PUSH NOTIFICATION REMINDERS
// ===============================

export const sendScheduledReminders = onSchedule(
  "every 5 minutes",
  async () => {
    const snapshots = await db
      .collectionGroup("notificationTokens")
      .where("enabled", "==", true)
      .get();

    const deliveries = [];

    for (const tokenDoc of snapshots.docs) {
      const subscription = tokenDoc.data();

      let clock;

      try {
        clock = localClock(subscription.timeZone || "UTC");
      } catch {
        logger.warn("Skipping notification with invalid time zone", {
          tokenDocument: tokenDoc.id,
        });
        continue;
      }

      for (const [kind, time] of Object.entries(
        subscription.reminders || {}
      )) {
        const scheduledMinute = minutesFromTime(time);
        const lastSent = subscription.lastSent?.[kind];

        if (
          !REMINDER_COPY[kind] ||
          scheduledMinute === null ||
          clock.minutes < scheduledMinute ||
          clock.minutes >= scheduledMinute + 5 ||
          lastSent === clock.day
        ) {
          continue;
        }

        deliveries.push(
          messaging
            .send({
              token: subscription.token,
              notification: {
                title: "🪥 Smile Streak",
                body: REMINDER_COPY[kind],
              },
              data: {
                kind,
                link: SITE_URL,
              },
              webpush: {
                fcmOptions: {
                  link: SITE_URL,
                },
              },
            })
            .then(() =>
              tokenDoc.ref.set(
                {
                  lastSent: {
                    [kind]: clock.day,
                  },
                },
                { merge: true }
              )
            )
            .catch(async (error) => {
              if (
                [
                  "messaging/registration-token-not-registered",
                  "messaging/invalid-registration-token",
                ].includes(error.code)
              ) {
                await tokenDoc.ref.delete();
                return;
              }

              logger.error("Unable to send reminder", {
                tokenDocument: tokenDoc.id,
                error: error.message,
              });
            })
        );
      }
    }

    await Promise.all(deliveries);

    logger.info("Finished scheduled reminder run", {
      deliveries: deliveries.length,
    });
  }
);


// ===============================
// WEEKLY LEAGUE RESET
// ===============================

export const weeklyLeagueReset = onSchedule(
  {
    schedule: "0 0 * * 0",
    timeZone: "America/Chicago",
  },
  async () => {
    logger.info("Starting weekly league reset");

    const usersSnapshot = await db.collection("users").get();

    if (usersSnapshot.empty) {
      logger.info("No users found");
      return;
    }

    const users = [];

    usersSnapshot.forEach((doc) => {
      const data = doc.data();

      if (data.username) {
        users.push({
          id: doc.id,
          ...data,
        });
      }
    });

    users.sort((a, b) => {
      return (
        (b.leaderboard?.weeklyPoints || 0) -
        (a.leaderboard?.weeklyPoints || 0)
      );
    });

    const batch = db.batch();

    users.forEach((user, index) => {
      const rank = index + 1;
      const total = users.length;
      const percentage = rank / total;

      let newLeague =
        user.leaderboard?.league || "Bronze";

      // Top 20% promote
      if (percentage <= 0.2) {
        if (newLeague === "Bronze") {
          newLeague = "Silver";
        } else if (newLeague === "Silver") {
          newLeague = "Gold";
        } else if (newLeague === "Gold") {
          newLeague = "Diamond";
        }
      }

      // Bottom 20% demote
      if (percentage > 0.8) {
        if (newLeague === "Diamond") {
          newLeague = "Gold";
        } else if (newLeague === "Gold") {
          newLeague = "Silver";
        } else if (newLeague === "Silver") {
          newLeague = "Bronze";
        }
      }

      const ref = db.collection("users").doc(user.id);

      batch.set(
        ref,
        {
          leaderboard: {
            ...user.leaderboard,
            league: newLeague,
            weeklyPoints: 0,
            lastRank: rank,
            lastWeekPoints:
              user.leaderboard?.weeklyPoints || 0,
            weekId: new Date()
              .toISOString()
              .slice(0, 10),
            lastReset: FieldValue.serverTimestamp(),
          },
        },
        { merge: true }
      );
    });

    await batch.commit();

    logger.info(
      `League reset complete: ${users.length} users processed`
    );
  }
);
