# Implementation So Far

Status: In progress

Purpose:

- Track completed implementation work.
- Record actual commands run, decisions made, and deviations from the plan.
- Keep this file factual and chronological.

Reference plan:

- See `docs/ANDROID_SOFTPHONE_IMPLEMENTATION_PLAN.md` for the authoritative design and execution plan.
- See `docs/COMMUNICATION_APP_REPLAN.md` for the approved communication-first addendum that will drive the next major implementation wave.
- See `docs/PROPOSED_FEATURE_LIST.md` for the concise communication feature inventory tied to that addendum.

## Current Summary

- A communication-first replan has now been saved in `docs/COMMUNICATION_APP_REPLAN.md`, with the scope summary in `docs/PROPOSED_FEATURE_LIST.md`, for review before messaging, call-history, contacts-sync, and NativeWind migration work begins.
- Phase 0 environment verification is complete.
- Phase 1 repository bootstrap is complete.
- Phase 2 mobile foundation is functionally complete in code and verified through Android export and prebuild, with keyboard-safe screens and a bottom-tab app shell in place, and only real-device install validation still pending.
- Phase 4 backend foundation is complete with the custom user model, core domain models, generated migrations, and a successful PostgreSQL migration run.
- Phase 5 authentication is in progress with working backend auth endpoints, profile editing, and the first mobile secure-session flow.
- Phase 6 contacts and search is in progress with backend discovery and contact endpoints plus first mobile contacts and search screens.
- Phase 3 native calling foundation is now implemented in code with LiveKit React Native, React Native WebRTC, CallKeep, Notifee, and Expo plugin wiring added to the mobile app.
- Django admin access is unblocked again: superuser creation now works with the custom phone-based user model, and all current backend models are registered in the admin site.
- Push-notification testing now has backend device-discovery helpers, a real registered device row, and a successful backend FCM dry-run send.
- A real Android device is now detected by Expo, and the previous Firebase manifest merge failure in the Android build was resolved by removing the conflicting Expo notification-color manifest entry.
- The Android debug build now completes successfully, the generated APK installs over USB on the connected device, and the app package accepts a direct adb launch intent.
- Backend call APIs, websocket signaling, presence events, join-media authorization, and the first mobile outgoing or incoming or active call screens are now implemented in code and pass structural validation.
- Active audio and video call screens now request runtime microphone and camera access, connect to real LiveKit rooms, publish local tracks, and render live remote or local video on device builds.
- Background and terminated incoming-call handling now includes FCM background parsing, CallKeep incoming-call presentation, Notifee incoming-call notifications, and backend-backed native answer or reject actions using the persisted device session.
- Backend call tests now cover create, accept, reject, cancel, join-media, end, and presence fanout behavior.

## Completed Phases

### Phase 0: Environment Verification

Status: Complete

Completed items:

- Verified Node.js, npm, Java, adb, Python, uv, PostgreSQL, and Android SDK presence.
- Installed uv-managed CPython 3.14.6 for the backend target runtime.

Commands run:

- `node -v`
- `npm -v`
- `java -version`
- `printf '%s\n' "$JAVA_HOME"`
- `printf '%s\n' "$ANDROID_HOME"`
- `adb --version`
- `python3 --version`
- `uv --version`
- `uv python list --only-installed`
- `psql --version`
- `uv python install cpython@3.14`

Verified versions and environment notes:

- Node.js `v24.21.0`
- npm `11.19.0`
- Java `21.0.12`
- `adb` `36.0.0`
- System Python `3.12.3`
- `uv` `0.11.28`
- PostgreSQL client `16.15`
- Android SDK directory exists at `$HOME/Android/Sdk`
- uv-managed CPython `3.14.6` installed successfully

Decisions made:

- Keep the requested backend Python target at `cpython@3.14`.
- Defer JDK 25 installation until the Android native build path needs it.

Deviations from plan:

- JDK 25 has not been installed yet because it is not required for the initial repository bootstrap.

Blockers resolved:

- Backend target Python version is now available locally.

### Phase 1: Repository Bootstrap

Status: Complete

Completed items:

- Scaffolded the Expo mobile app in `mobile/` using the blank TypeScript template.
- Installed `expo-dev-client` and `expo-router` into the mobile app.
- Scaffolded the Django backend in `backend/` with uv-managed dependencies.
- Added root repository hygiene files and environment examples.
- Added a minimal backend health endpoint and Django split-settings structure.
- Added a brief Firebase Cloud Messaging implementation guide.

Commands run:

- `npx create-expo-app@latest mobile --template blank-typescript`
- `cd mobile && npx expo install expo-dev-client expo-router`
- `mkdir -p backend && cd backend && uv init --bare --python 3.14`
- `cd backend && uv venv --python cpython@3.14 .venv`
- `cd backend && uv add "django>=6.0,<6.1" "djangorestframework>=3.18,<3.19" "djangorestframework-simplejwt[crypto]" "channels" "uvicorn" "psycopg[binary]" "python-dotenv" "phonenumbers" "livekit-api" "django-cors-headers"`
- `cd backend && uv run django-admin startproject config .`

Files created or updated:

- Root `.gitignore`
- Root `README.md`
- `mobile/` Expo project scaffold
- `backend/` Django project scaffold
- `docs/FIREBASE_CLOUD_MESSAGING_SETUP.md`
- `docs/MOBILE_USB_BUILD_AND_RUN_GUIDE.md`

Decisions made:

- Start from the stable Expo blank TypeScript template and add native-build dependencies incrementally.
- Convert Django to split settings immediately so later phases do not need a structural migration.

Deviations from plan:

- Expo Router has been installed but not wired as the app entrypoint yet.

Blockers resolved:

- Resolved the interactive `npx` prompt during Expo project creation.

### Phase 2: Mobile Foundation

Status: In progress

Completed items:

- Installed `expo-dev-client`.
- Installed `expo-router`.
- Replaced the default Expo placeholder screen with a project-specific bootstrap screen.
- Switched the mobile entrypoint to Expo Router.
- Added route groups and placeholder screens for the auth flow and app shell.
- Completed gluestack UI and NativeWind setup and verified it through Expo export.
- Added shared app providers, font loading, icon support, and secure-store plugin wiring.
- Added a dedicated branding asset structure under `mobile/assets/branding/`.
- Moved Expo configuration into `mobile/app.config.ts`.
- Added an Android-style authenticated bottom-tab shell with Home, Contacts, Search, and Profile routes.
- Added keyboard-safe scroll handling for form-driven mobile screens so input fields remain reachable when the software keyboard opens.
- Replaced the initial keyboard workaround with `react-native-keyboard-controller` so auth and form screens can stay scrollable while the keyboard remains open.
- Fixed the auth stack background path so login and register screens stay on the intended dark surface instead of flashing a light scene background.
- Generated the Android native project with `expo prebuild` and verified Gradle and Java runtime.
- Added a step-by-step USB build and real-device run guide for the mobile app.
- Resolved the Android build failure caused by duplicate `com.google.firebase.messaging.default_notification_color` manifest metadata during Expo plus React Native Firebase integration.
- Captured a full successful `assembleDebug` result for the Android project, installed the generated debug APK on the connected device, and launched the app package with adb.

Commands run:

- `cd mobile && npx expo install expo-dev-client expo-router`
- `cd mobile && npx tsc --noEmit`
- `cd mobile && npx --yes gluestack-ui@latest init --projectType app --nativewind-v5 --use-npm --path src/components/ui -y`
- `cd mobile && npm install -D babel-preset-expo`
- `cd mobile && npx expo install expo-linking react-dom react-native-web expo-font expo-splash-screen expo-system-ui expo-secure-store`
- `cd mobile && npm install @expo-google-fonts/roboto-flex lucide-react-native @tanstack/react-query zustand`
- `cd mobile && npx expo install react-native-keyboard-controller`
- `cd mobile && npx expo export --platform android`
- `cd mobile && npx expo prebuild --platform android --no-install`
- `cd mobile/android && ./gradlew -version`
- `cd mobile && npx expo run:android --device`
- `cd mobile && npx expo prebuild --platform android --no-install`
- `cd mobile/android && ./gradlew app:processDebugMainManifest --configure-on-demand --build-cache -PreactNativeDevServerPort=8081 -PreactNativeArchitectures=arm64-v8a`
- `cd mobile/android && ./gradlew app:assembleDebug -x lint -x test --configure-on-demand --build-cache -PreactNativeDevServerPort=8081 -PreactNativeArchitectures=arm64-v8a`
- `adb devices`
- `adb install -r mobile/android/app/build/outputs/apk/debug/app-debug.apk`
- `adb shell am start -n com.livekitsoftphone.mobile/.MainActivity`

Device testing notes:

- Real-device build validation is now in progress on device `CPH2743`.
- Local native generation passed without requiring a JDK switch away from Java 21.
- A full `assembleDebug` success line has now been captured locally.
- The generated debug APK installs successfully on the connected device.
- A direct adb launch intent for `com.livekitsoftphone.mobile/.MainActivity` succeeds.
- The remaining hardware gap for push work is now entirely in-app: sign in, grant notification permission, and complete Settings push sync so the first `Device` row is created.

Branding assets configured:

- Environment example file added for public mobile endpoints.
- Placeholder brand assets now live under `mobile/assets/branding/` and are wired through `mobile/app.config.ts`.

Decisions made:

- Keep the initial mobile source surface minimal until Expo Router wiring and provider setup are added together.
- Use the default root `app/` Expo Router structure now rather than delaying route setup.
- Keep brand assets replaceable through a dedicated folder plus dynamic Expo config.
- Use `RobotoFlex_400Regular` as the initial shared app font until additional weights are introduced.

Deviations from plan:

- The gluestack CLI stalled during cloning, so the final integration required manual cleanup of the generated config and dependency graph.

Blockers resolved:

- None yet.
- Resolved the NativeWind and gluestack verification issues around Babel, CSS imports, Expo Router integration, and missing peer dependencies.
- Resolved the Firebase default-notification-color manifest conflict between Expo Notifications and React Native Firebase Messaging.
- Resolved the first end-to-end Android build and install validation for the current mobile baseline.

### Phase 3: Native Calling Foundation

Status: Implemented in code, final hardware validation pending

Completed items:

- Installed `livekit-client`, `@livekit/react-native`, `@livekit/react-native-webrtc`, `@livekit/react-native-expo-plugin`, `@config-plugins/react-native-webrtc`, `@notifee/react-native`, and `react-native-callkeep`.
- Added Expo config-plugin wiring and Android permission declarations for LiveKit, WebRTC, CallKeep, and Notifee.
- Registered LiveKit globals during app startup.
- Added a reusable LiveKit room wrapper that configures and starts the mobile audio session before connecting.
- Replaced placeholder active-call media cards with real LiveKit audio and video session wiring.
- Added runtime Android microphone and camera permission requests for active call entry.
- Added CallKeep and Notifee native incoming-call handling, including FCM background message to native UI handoff and persisted-session-backed accept or reject actions.
- Added a local Expo config plugin to keep the Notifee Android Maven repository available during Expo prebuild regeneration.

Commands run:

- `cd mobile && npx expo install livekit-client @livekit/react-native @livekit/react-native-webrtc @livekit/react-native-expo-plugin @config-plugins/react-native-webrtc @notifee/react-native react-native-callkeep`
- `cd mobile && npx tsc --noEmit`
- `cd mobile && npx expo export --platform android`
- `cd mobile && npx expo prebuild --platform android --no-install`
- `cd mobile/android && ./gradlew app:assembleDebug -x lint -x test --configure-on-demand --build-cache -PreactNativeDevServerPort=8081 -PreactNativeArchitectures=arm64-v8a`

Decisions made:

- Use `LiveKitRoom` plus LiveKit hooks rather than a custom WebRTC abstraction so the audio and video transport surface stays close to the supported SDK.
- Keep Android runtime AV permissions explicit at call entry rather than requesting them on app launch.
- Use CallKeep for system incoming-call UI and Notifee for Android incoming-call notification actions and background event delivery.

Deviations from plan:

- Added a small local Expo config plugin under `mobile/plugins/` to preserve the Notifee Android Maven repository during prebuild.

Blockers resolved:

- Resolved the initial Android Notifee dependency-resolution failure for `app.notifee:core` by adding the local Maven repository to the generated Android build and to the Expo prebuild path.

### Phase 4: Backend Foundation

Status: Complete

Completed items:

- Added the planned Django app package structure under `backend/apps/`.
- Wired `apps.accounts`, `apps.contacts`, `apps.devices`, and `apps.calls` into Django settings.
- Added a UUID-based custom user model with phone and email normalization.
- Added reusable abstract UUID base models.
- Added concrete models for contacts, devices, calls, and call events.
- Generated initial migrations for `accounts`, `contacts`, `devices`, and `calls`.
- Successfully applied Django migrations against PostgreSQL.

Commands run:

- `cd backend && uv run python manage.py check`
- `cd backend && uv run python manage.py makemigrations accounts`
- `cd backend && uv run python manage.py makemigrations contacts devices calls`
- `cd backend && uv run python manage.py migrate`

Files created or updated:

- `backend/apps/common/models.py`
- `backend/apps/accounts/models.py`
- `backend/apps/accounts/admin.py`
- `backend/apps/contacts/models.py`
- `backend/apps/devices/models.py`
- `backend/apps/calls/models.py`
- `backend/apps/**/migrations/0001_initial.py`
- `backend/config/settings/base.py`

Decisions made:

- Use `phone_number_normalized` as the Django `USERNAME_FIELD` for the custom user model.
- Enforce UUID primary keys and model-level integrity constraints in the first migration set.

Deviations from plan:

- The device-session auth model is still deferred to the authentication phase.

Blockers resolved:

- PostgreSQL connectivity and migration execution are confirmed working for the backend.

### Phase 5: Authentication

Status: In progress

Completed items:

- Added a revocable `DeviceSession` model to support durable signed-in mobile sessions.
- Implemented backend `register`, `login`, `refresh`, and `logout` endpoints.
- Implemented backend `GET /api/users/me/` for authenticated profile fetch.
- Added backend auth tests covering registration, device-session refresh, logout revocation, and current-user fetch.
- Added backend support and tests for `PATCH /api/users/me/`.
- Installed mobile auth dependencies for secure storage, query state, and persisted session state.
- Added a mobile auth store backed by `expo-secure-store`.
- Added a mobile API client, auth API module, and authenticated request helper with silent refresh on `401`.
- Added a first `useAPI.ts` hook and propagated abort signals through query-backed mobile API calls.
- Replaced placeholder auth screens with functional register, login, and logout flows.
- Wrapped the mobile route shell in safe-area bounds and made the auth screens scrollable so smaller Android devices do not clip registration content.
- Added mobile Profile and Settings screens so account editing and session controls now live inside the signed-in shell.
- Firebase CLI login now succeeds for `mruhaquer@gmail.com`, but Firebase project creation is currently blocked by a Google-side `403 The caller does not have permission` response.
- Registered the Android Firebase app for package `com.livekitsoftphone.mobile` and wired `mobile/google-services.json` into Expo config.
- Added backend device registration and device invalidation endpoints for later push-token upload work.
- Added a backend device list endpoint and surfaced registered devices plus Firebase project information in the mobile settings screen.
- Installed the Firebase Admin Python SDK and added a backend FCM sending service that reads `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, and `FCM_PRIVATE_KEY` from the backend environment.
- Added a `send_test_push` Django management command for dry-run or real FCM delivery checks against a registered device.
- Installed `expo-notifications`, `expo-task-manager`, `expo-application`, `@react-native-firebase/app`, and `@react-native-firebase/messaging` in the mobile app.
- Added mobile push-registration bootstrap code that requests notification permission, fetches the native device push token, registers it with `/api/devices/register/`, and surfaces the resulting backend device UUID in Settings.
- Added Android-side Firebase messaging config in `mobile/firebase.json` and a background message handler scaffold in `mobile/index.ts`.
- Fixed the custom user-manager contract so `createsuperuser` works with the `phone_number_normalized` username field.
- Added a phone-aware Django authentication backend so Django admin login can normalize local phone input before lookup.
- Registered `User`, `DeviceSession`, `Contact`, `Device`, `Call`, and `CallEvent` in the Django admin site.
- Added `list_devices` and improved `send_test_push` management-command flows for device discovery and push-test targeting.
- Surfaced the native push token in the mobile Settings screen to make device-registration failures easier to diagnose on hardware.
- Verified a real backend device registration exists and successfully validated the FCM send path with `send_test_push --dry-run`.

Commands run:

- `cd backend && uv run python manage.py makemigrations accounts`
- `cd backend && uv run python manage.py test apps.accounts`
- `cd mobile && npx expo install expo-secure-store`
- `cd mobile && npm install @tanstack/react-query zustand`
- `cd mobile && npx tsc --noEmit`
- `cd mobile && npx expo export --platform android`
- `cd backend && uv run python manage.py test apps.accounts.tests.AuthAPITests.test_create_superuser_accepts_username_field_value apps.accounts.tests.AuthAPITests.test_authenticate_accepts_local_phone_input`
- `cd backend && uv run python manage.py test apps.devices`
- `cd backend && uv run python manage.py list_devices --inactive`
- `cd backend && uv run python manage.py check`
- `cd mobile && npx tsc --noEmit`
- `cd mobile && npx tsc --noEmit`
- `cd mobile && npx expo export --platform android`
- `cd backend && uv run python manage.py send_test_push d5d6a2e7-f100-47c0-8302-ac69f6abaa37 --dry-run --data call_id=test-call-1`

Files created or updated:

- `backend/apps/accounts/models.py`
- `backend/apps/accounts/serializers.py`
- `backend/apps/accounts/views.py`
- `backend/apps/accounts/urls.py`
- `backend/apps/accounts/user_urls.py`
- `backend/apps/accounts/tests.py`
- `mobile/src/config/env.ts`
- `mobile/src/lib/api/client.ts`
- `mobile/src/features/auth/api.ts`
- `mobile/src/features/auth/types.ts`
- `mobile/src/stores/auth-store.ts`
- `mobile/src/components/auth/auth-field.tsx`
- `mobile/src/components/layout/app-scroll-screen.tsx`
- `mobile/app/(auth)/login.tsx`
- `mobile/app/(auth)/register.tsx`
- `mobile/app/(app)/index.tsx`
- `mobile/app/(app)/profile.tsx`
- `mobile/app/(app)/settings.tsx`

Decisions made:

- Model signed-in persistence with a first-party device session token separate from JWT access tokens.
- Use secure storage plus Zustand hydration to restore the signed-in session on app launch.
- Implement silent access-token refresh in the mobile authenticated request helper before broader API work.
- Keep `phone_number_normalized` as the canonical Django username field, but normalize phone input inside a custom authentication backend so admin login and management commands remain usable.
- Default backend phone normalization to `PHONENUMBER_DEFAULT_REGION=BD` unless explicitly overridden per environment.

Deviations from plan:

- The mobile auth flow currently uses the session user summary and `GET /api/users/me/` but does not yet include a full `useAPI.ts` abstraction layer.

Blockers resolved:

- Backend auth endpoints and the first mobile auth flow are both validated end to end in local checks.
- Django admin access is restored for the custom user model.

Open follow-up notes:

- `uv run python manage.py list_devices --inactive` now reports an active registered device row for `+8801777770183`.
- Backend FCM dry-run validation succeeds for device `d5d6a2e7-f100-47c0-8302-ac69f6abaa37`.

### Phase 7: WebSocket and Presence

Status: Implemented in code, backend coverage added

Completed items:

- Added a Channels websocket consumer at `/ws/signaling/`.
- Added JWT-authenticated websocket middleware for mobile bearer-token connections.
- Added per-user signaling groups and contact-scoped presence fanout.
- Added a singleton mobile realtime provider and socket client with reconnect logic and notification-response routing.

Commands run:

- `cd backend && uv run python -c "from config.asgi import application; print(type(application).__name__)"`
- `cd mobile && npx tsc --noEmit`
- `cd mobile && npx expo export --platform android`

Decisions made:

- Use websocket Authorization headers as the primary auth path, with query-string token support left only as a compatibility fallback.
- Broadcast signaling to per-user groups and presence only to users who already hold the target as an accepted contact.

### Phase 8: LiveKit Join Flow

Status: Implemented in code, backend coverage added

Completed items:

- Added backend `POST /api/calls/{id}/join-media/` with participant-scoped LiveKit token generation.
- Added room-scoped token TTL handling and backend LiveKit configuration checks.
- Added mobile media-session storage and join-media requests from the active call screens.

Decisions made:

- Keep the call API provider-neutral with `join-media` while issuing LiveKit tokens behind that contract.

### Phase 9: Audio Calling

Status: Implemented in code with real LiveKit audio transport

Completed items:

- Added backend call creation, detail, accept, reject, cancel, end, busy, and timed-out lifecycle handling.
- Added mobile outgoing, incoming, and active audio-call screens.
- Replaced the active audio-call placeholder state with a real LiveKit audio room connection, local microphone control, audio-session startup, and speaker or earpiece routing.
- Added audio-call actions from the contacts screen and active-call return handling on the home screen.

### Phase 10: Video Calling

Status: Implemented in code with real LiveKit video transport

Completed items:

- Added a mobile active video-call screen with call-state-driven media authorization flow, real camera publishing, remote video rendering, and local preview.

### Phase 11: Background and Terminated Incoming Calls

Status: Implemented in code, hardware validation pending

Completed items:

- Added incoming-call push payload generation on the backend.
- Added notification tap parsing and fallback incoming-call routing on mobile.
- Added background message parsing so incoming-call payloads are recognized by the app runtime.
- Added CallKeep setup, native incoming-call presentation, and native answer or end event listeners.
- Added Notifee incoming-call notifications plus background and foreground action handling.
- Added background call accept or reject execution using the stored device session.

### Phase 12: Hardening and Verification

Status: In progress

Completed items:

- Added busy and timed-out server call states to the active lifecycle path.
- Added structural validation for backend checks, ASGI boot, mobile typecheck, and Expo Android export.
- Added backend call API tests for create, accept, reject, cancel, join-media, and end.
- Added presence test stabilization for async event fanout.

Remaining gap in code:

- Multi-device hardware validation and final native Android assemble confirmation are still pending.

### Phase 6: Contacts and Search

Status: In progress

Completed items:

- Implemented backend `GET /api/users/search/` for authenticated user discovery with limited public fields.
- Implemented backend `GET /api/contacts/`, `POST /api/contacts/`, and `DELETE /api/contacts/{id}/`.
- Added backend tests for user search, contact creation, contact listing, duplicate prevention, and contact deletion.
- Added the first mobile contacts API module and shared contact types.
- Added authenticated mobile contacts and user-search screens under the app shell.
- Linked the home screen to the new contacts and search routes.

Commands run:

- `cd backend && uv run python manage.py test apps.accounts apps.contacts`
- `cd mobile && npx tsc --noEmit`
- `cd mobile && npx expo export --platform android`

Decisions made:

- User discovery responses exclude email and return only the limited fields currently needed for contact selection.
- New sibling app routes use relative Expo Router hrefs in this workspace because typed-route generation did not expose the new absolute paths cleanly.

Deviations from plan:

- The first contacts and search screens are stack-based screens reached from the home shell rather than a fuller tab or section navigation model.

Blockers resolved:

- The next mobile slice now has working backend endpoints and validated app routes to build on.

### Phase 3 and Later

Status: Not started

Notes:

- Record each later phase using the same structure used above.

## Important Decisions Log

Use this section for cross-phase decisions that affect multiple parts of the project.

- Backend development settings now live under `config.settings.dev` with a split-settings package.
- Backend bootstrap uses PostgreSQL-oriented settings from environment variables instead of the Django default SQLite configuration.
- Expo Router is now the active mobile entry architecture.
- PostgreSQL connectivity is confirmed by a successful `manage.py migrate` run.
- Android prebuild works locally with Gradle `9.3.1`, Kotlin `2.2.21`, and Java `21.0.12`.
- The project now has a working first-party device-session auth flow across backend and mobile.
- The backend now includes a phone-normalizing Django authentication backend and admin registrations for all current domain models.
- Backend push testing can now target a specific device UUID or the latest active device via management commands.
- The backend now exposes a websocket signaling path and a full call lifecycle REST surface.
- The mobile app now includes a singleton realtime client plus outgoing, incoming, audio, and video call routes.

## Commands History Summary

Use this section for high-signal commands worth preserving for future reference.

- `uv python install cpython@3.14`
- `npx create-expo-app@latest mobile --template blank-typescript`
- `cd mobile && npx expo install expo-dev-client expo-router`
- `cd mobile && npx tsc --noEmit`
- `cd backend && uv add "django>=6.0,<6.1" "djangorestframework>=3.18,<3.19" "djangorestframework-simplejwt[crypto]" "channels" "uvicorn" "psycopg[binary]" "python-dotenv" "phonenumbers" "livekit-api" "django-cors-headers"`
- `cd backend && uv run python manage.py makemigrations accounts`
- `cd backend && uv run python manage.py makemigrations contacts devices calls`
- `cd backend && uv run python manage.py migrate`
- `cd backend && uv run python manage.py test apps.accounts`
- `cd backend && uv run python manage.py test apps.devices`
- `cd backend && uv run python manage.py list_devices --inactive`
- `cd backend && uv run python manage.py send_test_push d5d6a2e7-f100-47c0-8302-ac69f6abaa37 --dry-run --data call_id=test-call-1`
- `cd mobile && npx expo prebuild --platform android --no-install`
- `cd mobile/android && ./gradlew -version`
- `cd mobile && npx expo install livekit-client @livekit/react-native @livekit/react-native-webrtc @livekit/react-native-expo-plugin @config-plugins/react-native-webrtc @notifee/react-native react-native-callkeep`
- `cd backend && uv run python manage.py test apps.calls -v 2`

## Open Questions Already Answered

Use this section to capture answers that should not be rediscovered later.

- The requested backend baseline can be installed locally on CPython 3.14 with Django 6.0.8 and DRF 3.18.1.
- The local PostgreSQL configuration is valid enough for Django migrations to run successfully.
- Expo Router, NativeWind, and gluestack can coexist in this repository once the generated config is cleaned up and missing peers are installed.
- Auth screens now fit within safe areas and scroll correctly on smaller devices.
- The keyboard handling path now uses `react-native-keyboard-controller` instead of the earlier `KeyboardAvoidingView` approach.
- The custom user model now supports Django `createsuperuser` and Django admin authentication without abandoning normalized phone-number login.
- Backend device registration is now confirmed with a real device row, and backend FCM dry-run delivery validates against that registered device.

## Last Updated

- Date: 2026-09-15
- Date: 2026-09-16
- Updated by: GitHub Copilot
