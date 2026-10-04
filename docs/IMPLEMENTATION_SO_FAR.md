# Implementation So Far

Status: In progress

Purpose:

- Track completed implementation work.
- Record actual repository capabilities, not planned capabilities.
- Keep this file factual and aligned with the reconciled communication re-plan.

Reference plan:

- `docs/ANDROID_SOFTPHONE_IMPLEMENTATION_PLAN.md`
- `docs/COMMUNICATION_APP_REPLAN.md`
- `docs/PROPOSED_FEATURE_LIST.md`
- `docs/REMAINING_IMPLEMENTATION.md`

## Current Summary

- The repository is no longer greenfield and no longer softphone-only.
- Backend and mobile calling foundations are implemented in code.
- The current codebase supports custom-user auth, device sessions, device registration, websocket signaling, Firebase push, LiveKit-based calling, CallKeep, Notifee, and SecureStore-backed mobile auth persistence.
- The communication-product transition is not complete. Messaging, E2EE, phone-contact sync, end-to-end block policy, and the approved `Messages`, `Calls`, `Contacts` shell are still not implemented.
- A 2026-09-29 repository audit also identified lifecycle and reliability work that must happen before messaging implementation proceeds safely.

## Reconciliation Update On 2026-09-29

### Confirmed foundations already in code

- Backend auth endpoints and `DeviceSession`
- Backend `User`, `Contact`, `Device`, `Call`, and `CallEvent` models
- Backend websocket signaling and presence fanout
- Backend Firebase Admin push sending
- Mobile SecureStore-backed auth state and retry-on-401 refresh flow
- Mobile push registration and settings-based device inspection
- Mobile LiveKit audio and video call screens
- Mobile incoming-call handling through Firebase Messaging, Notifee, and CallKeep

### Confirmed product gaps

- No messaging backend or mobile feature module
- No E2EE implementation
- No encrypted media flow
- No phone-contact sync
- No approved `Messages`, `Calls`, `Contacts` visible shell yet
- No complete unknown-user, save-contact, block, or unblock flow

### Confirmed lifecycle gaps

- Startup auth bootstrap is implemented but has not yet been validated on physical devices.
- Logout deactivates the current push registration when its token/device row is identifiable; physical validation of the new installation and session linkage remains open.
- Call push handling needs lifecycle validation and dedup review

### Investigation items, not yet proven root causes

- Reopen-logs-out bug root cause is not yet proven, though websocket-disconnect-driven token rotation is a strong hypothesis.
- Screen-timeout bug root cause is not yet proven from source.

## Completed Foundations

### Environment and bootstrap foundations

- Expo mobile app scaffolded under `mobile/`
- Django backend scaffolded under `backend/`
- Android prebuild and debug build path verified locally
- PostgreSQL migrations run successfully

### Backend domain foundations

- `accounts` app with custom phone-based user model and `DeviceSession`
- `contacts` app with contact status model
- `devices` app with device registration endpoints and Firebase push service
- `calls` app with call lifecycle APIs, events, presence, and LiveKit join-media

### Mobile auth and shell foundations

- Expo Router app structure with auth and signed-in route groups
- SecureStore-backed auth persistence via Zustand
- Authenticated API client with refresh-on-401 behavior
- Profile and settings screens
- Push registration bootstrap and device inspection in settings

### Mobile calling foundations

- Websocket signaling provider
- Incoming, outgoing, audio, and video call routes
- LiveKit room integration for active calls
- Runtime microphone and camera permissions
- Background and terminated incoming-call handling with Notifee and CallKeep

## Features Not Yet Implemented

- Backend messaging app
- Mobile messaging UI and data layer
- E2EE key lifecycle and encrypted payload handling
- Encrypted attachment upload and download
- Phone-contact sync and matching
- Calls history tab aligned to the final shell
- Contact details with save, block, and unblock actions
- Approved three-tab navigation shell

## Confirmed Bugs And Reliability Risks

### Confirmed gaps

- Logout invalidates the current registration when the push token/device can be identified; registration-to-installation linkage remains incomplete.
- Device registrations can outlive the auth session that created them.
- Current shell does not match the approved product structure.

### Suspected but not yet proven

- Session loss after app reopen may be caused by websocket-disconnect-driven refresh-token rotation.
- Incoming-call notifications may duplicate because the backend sends notification text while the mobile app also renders native incoming-call UI.
- Screen timeout may be influenced by native media or call behavior rather than regular app screens.

## Implementation Update On 2026-10-04

### Gate 1 work started

- Added startup auth bootstrap after SecureStore hydration; private routes wait for current-user validation.
- Expired access tokens recover through the authenticated API refresh path before realtime providers mount.
- Transient network/refresh failures preserve the stored session and show a retryable startup error.
- Made refresh requests single-flight and persist the rotated device-session token before retrying the protected request.
- Removed device-session refresh and auth clearing from generic websocket disconnect handling.
- Added a stable SecureStore-backed installation identity on mobile and included it in backend device registration.
- Backend device registration now reuses the same installation across push-token changes and invalidates older active device rows that share the same installation or push token across account switches.
- Mobile login now sends the same stable installation identity used by push registration.
- Device sessions now persist installation identity, and backend logout invalidates active device rows for the same installation even if the client does not delete the device row first.
- Device registration now accepts the current device-session token and stores a direct session-to-device association for the active installation.
- Settings sign-out now deactivates the matching current-device push registration before revoking the device session, when its registration can be identified.
- Device-session-to-installation linkage, hardware reproduction, and dedicated auth regression tests remain open.

### Call screen redesign work started

- Added shared NativeWind call presentation primitives and removed standard call-stack headers.
- Redesigned incoming, outgoing, active audio, and active video screens.
- Extracted shared call polling, permission, media authorization, timer, and end-call orchestration into `mobile/src/features/calls/use-active-call.ts`.
- Added shared active-call controls for mute, speaker routing, local hold or resume, and video camera toggling through `mobile/src/features/calls/use-call-controls.ts`.
- Kept the existing call APIs, LiveKit room, permission flow, and route transitions in place.
- Physical Android lifecycle, permission-denial/retry, and media verification remain open.

### Validation completed

- Mobile TypeScript check: passed.
- Android Expo export: passed.
- Android Expo prebuild: passed.

## What This File Intentionally Does Not Claim

- It does not claim that messaging exists.
- It does not claim that the communication-product migration is nearly complete.
- It does not claim that the logout bug or screen-timeout bug has already been fixed.
- It does not claim that terminated-state notification behavior is fully validated on hardware across all Android lifecycle states.

## Next Planned Milestone

The next milestone is to finish Gate 1 and the call-screen redesign from `docs/COMMUNICATION_APP_REPLAN.md`:

- type-check and export the NativeWind call surfaces
- add focused auth lifecycle regression coverage where the existing test setup permits
- validate startup restore, explicit logout, and revoked-session behavior
- reproduce the reported auth and screen-timeout behavior on physical Android hardware
- validate incoming, outgoing, audio, and video call lifecycle behavior on physical Android hardware

## Last Updated

- Date: 2026-10-04
- Updated by: GitHub Copilot
