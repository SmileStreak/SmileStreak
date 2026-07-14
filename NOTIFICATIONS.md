# Enabling production notifications

Smile Streak now uses Firebase Cloud Messaging (FCM), so reminders can arrive when the app is closed. The browser registers a device token and the scheduled Firebase function checks reminders every five minutes in the user's saved time zone.

## One-time production setup

1. In Firebase Console, open **Project settings → Cloud Messaging → Web Push certificates** and create a key pair.
2. Add the public key to the deployment environment as `VITE_FIREBASE_VAPID_KEY`. For Vercel, add it to Production and redeploy the web app.
3. Install Firebase CLI, log in, then deploy the included scheduler from the repository root:

   ```sh
   firebase use smilestreak-91302
   firebase deploy --only functions
   ```

Firebase's scheduled functions require the project to be on the Blaze plan. Keep the VAPID key public (it is designed to be exposed to browsers); never add an Admin SDK service-account key to the client or repository.

## User requirements

Users must sign in, permit notifications, and enable reminders once. On iPhone, the site must first be installed to the Home Screen before Safari will show the permission prompt.
