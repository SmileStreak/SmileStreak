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


// ===============================
// LEAGUE CONFIG
// ===============================

const LEAGUE_ORDER = [
  "Bronze",
  "Silver",
  "Gold",
  "Diamond",
  "Champion",
];

const LEAGUE_GROUP_SIZE = 50;


// Assign users into Bronze-001, Bronze-002, etc.
function assignLeagueGroups(users) {
  const groupedUsers = {};

  for (const league of LEAGUE_ORDER) {
    groupedUsers[league] = users.filter(
      (user) =>
        user.leaderboard?.league === league
    );
  }


  const assignments = {};


  for (const league of LEAGUE_ORDER) {
    const leagueUsers = groupedUsers[league];


    leagueUsers.forEach((user, index) => {
      const groupNumber =
        Math.floor(index / LEAGUE_GROUP_SIZE) + 1;


      assignments[user.id] =
        `${league}-${String(groupNumber).padStart(3, "0")}`;
    });
  }


  return assignments;
}


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
    minutes:
      Number(value.hour) * 60 +
      Number(value.minute),
  };
}


function minutesFromTime(time) {
  const [hour, minute] =
    String(time || "")
      .split(":")
      .map(Number);


  return Number.isInteger(hour) &&
    Number.isInteger(minute)
    ? hour * 60 + minute
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
        clock = localClock(
          subscription.timeZone || "UTC"
        );
      } catch {
        logger.warn(
          "Skipping notification with invalid time zone",
          {
            tokenDocument: tokenDoc.id,
          }
        );
        continue;
      }


      for (const [kind, time] of Object.entries(
        subscription.reminders || {}
      )) {
        const scheduledMinute =
          minutesFromTime(time);

        const lastSent =
          subscription.lastSent?.[kind];


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
                {
                  merge: true,
                }
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

              logger.error(
                "Unable to send reminder",
                {
                  tokenDocument: tokenDoc.id,
                  error: error.message,
                }
              );
            })
        );
      }
    }


    await Promise.all(deliveries);


    logger.info(
      "Finished scheduled reminder run",
      {
        deliveries: deliveries.length,
      }
    );
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
    logger.info(
      "Starting weekly league reset"
    );


    const usersSnapshot =
      await db.collection("users").get();


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



    // Sort users by weekly points
    users.sort(
      (a, b) =>
        (b.leaderboard?.weeklyPoints || 0) -
        (a.leaderboard?.weeklyPoints || 0)
    );



    const totalUsers = users.length;



    // ===============================
    // PROMOTION / DEMOTION
    // ===============================

    users.forEach((user, index) => {
      const rank = index + 1;

      const percentage =
        rank / totalUsers;


      let league =
        user.leaderboard?.league ||
        "Bronze";


      // promote
      if (percentage <= 0.2) {
        if (league === "Bronze")
          league = "Silver";
        else if (league === "Silver")
          league = "Gold";
        else if (league === "Gold")
          league = "Diamond";
      }


      // demote
      if (percentage > 0.8) {
        if (league === "Diamond")
          league = "Gold";
        else if (league === "Gold")
          league = "Silver";
        else if (league === "Silver")
          league = "Bronze";
      }


      user.newLeague = league;
    });



    // Apply new leagues temporarily
    users.forEach((user) => {
      user.leaderboard = {
        ...user.leaderboard,
        league: user.newLeague,
      };
    });



    // Create Bronze-001, Bronze-002, etc.
    const leagueGroups =
      assignLeagueGroups(users);



    const batch = db.batch();



    users.forEach((user, index) => {
      const ref =
        db.collection("users")
        .doc(user.id);


      batch.set(
        ref,
        {
          leaderboard: {
            ...user.leaderboard,

            league:
              user.newLeague,

            leagueGroup:
              leagueGroups[user.id] ||
              `${user.newLeague}-001`,

            weeklyPoints: 0,

            lastRank:
              index + 1,

            lastWeekPoints:
              user.leaderboard?.weeklyPoints ||
              0,

            weekId:
              new Date()
                .toISOString()
                .slice(0, 10),

            lastReset:
              FieldValue.serverTimestamp(),
          },
        },
        {
          merge: true,
        }
      );
    });



    await batch.commit();


    logger.info(
      `League reset complete: ${users.length} users processed`
    );
  }
);
