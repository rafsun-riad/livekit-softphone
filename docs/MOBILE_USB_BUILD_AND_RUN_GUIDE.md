# Mobile USB Build And Run Guide

Use this guide whenever something changes in `mobile/` and you want the latest app running on a real Android device over USB.

## What this guide assumes

1. You are in this repository on the same machine used for Android development.
2. Android SDK and `adb` are already installed.
3. The `mobile/android/` project already exists from Expo prebuild.
4. Your Android phone supports Developer Options and USB debugging.

## Step 1: Prepare the Android phone once

1. Connect the phone to the computer with a USB cable.
2. On the phone, enable Developer Options if it is not enabled yet.
3. Enable USB debugging.
4. Accept the RSA trust prompt on the phone when Android asks whether to trust this computer.
5. On the computer, verify that `adb` can see the device:

```bash
adb devices
```

6. Confirm the device shows as `device`, not `unauthorized`.

## Step 2: Prepare the mobile environment

1. Move into the mobile app directory:

```bash
cd /home/md-rafsun-ul-haque/projects/livekit-softphone/mobile
```

2. If `mobile/.env` does not exist yet, create it from the example file:

```bash
cp .env.example .env
```

3. Open `mobile/.env` and set values the phone can actually reach.
4. Do not use `localhost` or `127.0.0.1` for `EXPO_PUBLIC_API_URL` if the backend is not running on the phone itself.
5. If the backend is running on your computer, use a reachable public or tunneled URL.

Example `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=https://your-reachable-api-host.example.com
EXPO_PUBLIC_WS_URL=wss://your-reachable-api-host.example.com
EXPO_PUBLIC_LIVEKIT_URL=ws://202.51.182.173
EXPO_PUBLIC_APP_ENV=development
```

## Step 3: Sync dependencies after mobile changes

Run this after pulling changes or editing dependencies:

```bash
cd /home/md-rafsun-ul-haque/projects/livekit-softphone/mobile
npm install
```

Run a quick typecheck before building:

```bash
npx tsc --noEmit
```

## Step 4: Decide whether you need a normal build or a clean native rebuild

Use a normal build for changes like these:

1. React or TypeScript screen changes.
2. Route changes under `app/`.
3. Styling changes in `global.css`, NativeWind classes, or component styles.
4. API client or Zustand store changes.
5. `.env` value changes.

For a normal build, run:

```bash
cd /home/md-rafsun-ul-haque/projects/livekit-softphone/mobile
npx expo prebuild --platform android
```

Use a clean native rebuild for changes like these:

1. `package.json` dependency changes involving native packages.
2. `app.config.ts` changes.
3. Android permission changes.
4. Splash screen or app icon asset changes.
5. Firebase or notification native setup changes.

If you need a clean native rebuild, run:

```bash
cd /home/md-rafsun-ul-haque/projects/livekit-softphone/mobile
npx expo prebuild --clean --platform android
```

## Step 5: Build and install the latest app on the phone

This is the main command to use when you want the latest app installed through USB:

```bash
cd /home/md-rafsun-ul-haque/projects/livekit-softphone/mobile
adb devices
npx expo run:android --device
```

What this does:

1. Confirms your phone is visible to `adb`.
2. Builds the Android app from the current contents of `mobile/`.
3. Installs the app on the connected phone.
4. Launches the app on the device.

If Expo asks you to choose a device, pick the USB-connected Android phone.

## Step 6: Start the Metro server for JavaScript updates

After the development build is installed, start Metro in a separate terminal:

```bash
cd /home/md-rafsun-ul-haque/projects/livekit-softphone/mobile
npx expo start --dev-client --clear
```

Use this when:

1. The app is already installed on the phone.
2. You only changed JavaScript, TypeScript, routes, styles, or other non-native code.

If the installed app opens but does not pick up the new code, stop Metro and run the install command from Step 5 again.

## Step 7: Build a debug APK manually if needed

Use this if you want a concrete APK file or want to reinstall directly with `adb`:

```bash
cd /home/md-rafsun-ul-haque/projects/livekit-softphone/mobile/android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Expected APK path:

```text
/home/md-rafsun-ul-haque/projects/livekit-softphone/mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

## Step 8: Fastest safe workflow after most mobile edits

If you only want a repeatable workflow that usually works, use these commands in order:

```bash
cd /home/md-rafsun-ul-haque/projects/livekit-softphone/mobile
npm install
npx tsc --noEmit
adb devices
npx expo run:android --device
npx expo start --dev-client --clear
```

## Step 9: When the installed app is clearly stale

If the phone still shows old behavior after a normal rebuild:

1. Stop Metro.
2. Re-run a clean prebuild.
3. Rebuild and reinstall the app.

Commands:

```bash
cd /home/md-rafsun-ul-haque/projects/livekit-softphone/mobile
npx expo prebuild --clean --platform android
npx expo run:android --device
npx expo start --dev-client --clear
```

## Step 10: Quick troubleshooting

If `adb devices` shows nothing:

1. Change the USB cable.
2. Reconnect the phone.
3. Check that USB debugging is still enabled.
4. Accept the Android trust dialog again if it reappears.

If the app installs but cannot talk to the backend:

1. Re-check `mobile/.env`.
2. Make sure `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WS_URL` point to a host reachable from the phone.
3. Do not point them at a backend URL that only works on your laptop.

If you added or changed a native dependency and the build looks wrong:

1. Run `npx expo prebuild --clean --platform android`.
2. Then run `npx expo run:android --device` again.

## Verified project commands

These commands have already been used successfully in this repository:

```bash
cd /home/md-rafsun-ul-haque/projects/livekit-softphone/mobile
npx tsc --noEmit
npx expo export --platform android
npx expo prebuild --platform android --no-install
cd android
./gradlew -version
```
