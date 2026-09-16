# Remaining Implementation

Status: Active planning tracker

Purpose:

- Track the remaining work to complete the project.
- Keep next actions, blockers, and phase priorities visible.
- Update this file after every completed phase.

Reference plan:

- See `docs/ANDROID_SOFTPHONE_IMPLEMENTATION_PLAN.md` for the authoritative design and execution plan.

## Current Overall State

- Phase 0 is complete.
- Phase 1 is complete.
- Phase 2 is in progress.
- Phase 4 is complete.
- Phase 5 is in progress.
- Phase 6 is in progress.

## Next Immediate Actions

1. Complete the in-app hardware validation flow by signing in on the installed Android app, granting notification permission, and running Settings push sync.
2. Verify the mobile push-registration flow on hardware so the backend device UUID appears in Settings and can be used with `send_test_push` or discovered with `list_devices`.
3. Add the remaining authentication support pieces such as session bootstrap polish and broader API abstractions.
4. Expand the contacts and directory UX on mobile and validate it on device.
5. Prepare the WebSocket singleton path for Phase 7.

## Remaining Phases

### Phase 0: Environment Verification

Status: Complete

Remaining tasks:

- Install JDK 25 if desired target runtime is still required before native Android build validation.
- Confirm real-device USB debugging workflow during the first Android install.

Dependencies:

- None.

Known risks:

- Android build may still need JDK 17 even if Java 25 is installed.

### Phase 1: Repository Bootstrap

Status: Complete

Remaining tasks:

- None.

Dependencies:

- Phase 0 complete.

### Phase 2: Mobile Foundation

Status: In progress

Remaining tasks:

- Confirm the installed Android app launches correctly and reaches the login or signed-in flow on hardware.
- Confirm debug APK generation path and install workflow.
- Confirm the generated Android project installs and launches on a real device, including the updated keyboard-aware auth screens.

Dependencies:

- Phase 1 mobile scaffold complete.

### Phase 3: Native Calling Foundation

Status: Pending

Remaining tasks:

- Integrate LiveKit native dependencies.
- Complete Firebase project, Android app registration, and config-file setup before wiring FCM delivery.
- Extend the new Firebase Messaging foundation from token registration into foreground/background call-intent handling.
- Integrate CallKeep.
- Integrate Notifee.
- Validate first real-device native build.

Dependencies:

- Phase 2 complete.

### Phase 4: Backend Foundation

Status: Complete

Remaining tasks:

- None.

Dependencies:

- Phase 1 backend scaffold complete.

### Phase 5: Authentication

Status: In progress

Remaining tasks:

- Add any missing authentication edge-case tests.
- Integrate the new `useAPI.ts` abstraction further as later feature modules are added.
- Add mobile auth UX polish for loading, empty, and failure states.
- Verify the secure session flow on a real Android device.
- Verify that local-phone admin login and `createsuperuser` remain correct in the real environment after the next backend auth changes.

Dependencies:

- Phase 4 complete.

### Phase 6 to Phase 12

Status: Mixed

### Phase 6: Contacts and Search

Status: In progress

Remaining tasks:

- Add any remaining mobile polish around duplicate-contact feedback and empty states.
- Connect the future push-token acquisition flow to the new mobile devices API surface and confirm it creates `Device` rows on hardware.
- Validate the contacts and directory flow on a real Android device.
- Decide whether search should later include additional privacy-preserving filters or throttling.

Dependencies:

- Phase 5 mobile auth flow remains active and stable.

### Phase 7 to Phase 12

Status: Pending

Remaining tasks:

- WebSocket and presence
- LiveKit join flow
- Audio calling
- Video calling
- Background and terminated incoming calls
- Hardening and final verification

Dependencies:

- Earlier phases complete.

## Active Blockers

- Firebase Android app registration, backend FCM sending, and mobile token-registration code are in place; the remaining blocker is hardware validation of that path.
- The live database currently has no registered `Device` rows, so `send_test_push` cannot exercise real delivery until a hardware push sync succeeds.
- The earlier Expo plus React Native Firebase manifest conflict is resolved, and the debug APK now builds and installs successfully; the remaining hardware blocker is in-app sign-in plus successful push sync creating the first `Device` row.

## Risks To Re-check During Execution

- SimpleJWT may still lag behind the requested backend stack.
- Expo Android build may still require JDK 17 instead of JDK 25.
- Real-device calling behavior cannot be signed off on emulator-only testing.
- Cloudflare Tunnel is development-only and must not be treated as production hosting.

## Deferred Decisions

- Whether Java 25 is fully usable for the Android build path.
- Whether a preview APK profile is needed beyond the direct USB development-build workflow.
- Whether additional theming variants are needed for the splash and launcher assets.
- Whether to keep the current root `app/` Expo Router structure or later move routes under `src/app/`.
- Whether Expo Router typed-route generation will later recognize the new sibling app routes without relying on relative href strings.

## Last Updated

- Date: 2026-09-16
- Updated by: GitHub Copilot
