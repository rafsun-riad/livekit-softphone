# Firebase Cloud Messaging Setup

This file is a short implementation guide for wiring Firebase Cloud Messaging into the Android softphone when Phase 3 and Phase 11 are implemented.

## Goal

Set up Firebase so the Android app can receive push notifications for incoming calls and the Django backend can send FCM messages securely.

## Step 1: Create the Firebase project

1. Open the Firebase Console.
2. Create a new project for the softphone.
3. Enable Cloud Messaging in the project.

Current project created for this repository:

- Firebase project ID: `livekit-softphone-mruhaq-6b385`
- Android app ID: `1:633134433774:android:8cbb98edff42f8011e7aff`
- Android package name: `com.livekitsoftphone.mobile`

## Step 2: Register the Android app

1. Add an Android app inside the Firebase project.
2. Use the Android application ID that will be configured in the Expo app.
3. Download `google-services.json` or fetch it from the MCP config tool.
4. Place it in `mobile/` and wire it through Expo config when native messaging setup begins.

## Step 3: Install the mobile packages

Install these packages in `mobile/` when FCM implementation starts:

```bash
npx expo install expo-notifications expo-task-manager
npm install @react-native-firebase/app @react-native-firebase/messaging @notifee/react-native react-native-callkeep
```

## Step 4: Configure Expo and Android native build

1. Add the Firebase config file path in `mobile/app.config.ts`.
2. Add the required Android notification settings and permissions.
3. Run a native regeneration step after config changes:

```bash
npx expo prebuild --platform android
```

4. Rebuild the Android app on a real device.

## Step 5: Generate a backend service account

1. In Firebase project settings, create or open a service account.
2. Generate a private key JSON file.
3. Do not commit that JSON file.
4. Copy the required values into backend environment variables:
   - `FCM_PROJECT_ID`
   - `FCM_CLIENT_EMAIL`
   - `FCM_PRIVATE_KEY`
5. The backend now reads `FCM_PRIVATE_KEY` in the quoted multiline format with `\n` escapes and uses it to initialize the Firebase Admin SDK.

## Step 5.1: Send a backend dry-run test

Once at least one device row exists in the backend database, send a dry-run push with:

```bash
cd backend
uv run python manage.py send_test_push <device_uuid> --dry-run --data call_id=test-call-1
```

## Step 6: Register device push tokens

1. Request notification permission in the app.
2. Read the device push token on Android.
3. Send that token to the backend device registration endpoint.
4. Store the token per device and user in the backend.

## Step 7: Send a test push

1. Use the stored device token from a logged-in Android device.
2. Send a test FCM message from the backend.
3. Confirm the app receives the notification in foreground and background states.

## Step 8: Connect push to incoming-call flow

1. On new incoming calls, Django sends a high-priority FCM data message.
2. The Android app background handler wakes up.
3. CallKeep and Notifee present the incoming call UI.
4. The app confirms accept or reject actions with Django.

## Notes

- Use FCM only for wake-up and incoming-call signaling, not as the source of truth for call state.
- Keep Django as the authoritative control plane.
- Test on real Android devices before treating the integration as complete.
