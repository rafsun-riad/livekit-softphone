# Production APK Build Guide

## Overview

**No hosting required** — The APK is a standalone installer. Your app communicates with the backend via Cloudflare tunnel after installation.

| Type                | Method               | Installation                 |
| ------------------- | -------------------- | ---------------------------- |
| **Debug (Current)** | Expo/expo-dev-client | Via Expo only                |
| **Production**      | Standalone APK       | Install like any Android app |

---

## Build Method 1: EAS CLI (Recommended - Cloud Build)

Easiest option; build on Expo servers. APK downloads automatically.

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login to Expo
eas login

# 3. Configure project (first time)
cd mobile
eas build:configure

# 4. Build production APK
eas build --platform android --profile preview

# 5. Install on phone
adb install app-release.apk
```

---

## Build Method 2: Local Build (No Cloud)

Build directly on your PC using Android SDK and Gradle.

```bash
cd mobile

# Install dependencies
npm install

# Create native Android files (one-time)
npx expo prebuild --clean

# Build APK locally
cd android
./gradlew assembleRelease

# Install on phone
adb install app/build/outputs/apk/release/app-release.apk
```

**Output location:** `mobile/android/app/build/outputs/apk/release/app-release.apk`

---

## Pre-Build Checklist

- [ ] Backend URL in API client points to Cloudflare tunnel URL
- [ ] All required Android permissions configured in `mobile/app.json`
- [ ] App version updated in `app.json` (version field)
- [ ] Package name is set (default: expo package name)

---

## Installation Options

1. **USB from PC:** `adb install app-release.apk`
2. **File Manager:** Copy APK to phone, open and tap to install
3. **File Sharing:** Email/WhatsApp share and install directly from phone

---

## Notes

- APK size: ~50-100 MB (includes React Native runtime)
- No Expo dependencies in production build
- Runs standalone without debug tools
- Same backend connection via Cloudflare tunnel
