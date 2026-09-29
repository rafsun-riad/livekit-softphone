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

- No dedicated auth bootstrap flow before opening the signed-in shell
- Logout revokes the device session but does not invalidate current-device push reachability
- Device registrations are not linked to device sessions or installation identity
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

- Logout does not currently invalidate the backend device registration for the current installation.
- Device registrations can outlive the auth session that created them.
- Current shell does not match the approved product structure.

### Suspected but not yet proven

- Session loss after app reopen may be caused by websocket-disconnect-driven refresh-token rotation.
- Incoming-call notifications may duplicate because the backend sends notification text while the mobile app also renders native incoming-call UI.
- Screen timeout may be influenced by native media or call behavior rather than regular app screens.

## What This File Intentionally Does Not Claim

- It does not claim that messaging exists.
- It does not claim that the communication-product migration is nearly complete.
- It does not claim that the logout bug or screen-timeout bug has already been fixed.
- It does not claim that terminated-state notification behavior is fully validated on hardware across all Android lifecycle states.

## Next Planned Milestone

The next milestone is not messaging implementation. The next milestone is Gate 0 plus Gate 1 from `docs/COMMUNICATION_APP_REPLAN.md`:

- reconcile the planning docs with repository reality
- reproduce the auth persistence bug
- add a dedicated auth bootstrap flow
- harden device-session and device-registration behavior
- validate Android lifecycle behavior before broader product expansion

## Last Updated

- Date: 2026-09-29
- Updated by: GitHub Copilot
