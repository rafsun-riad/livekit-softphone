# Remaining Implementation

Status: Active planning tracker

Purpose:

- Track the remaining work to complete the communication-product transition.
- Keep next actions, dependencies, blockers, and risks visible.
- Stay aligned with the reconciled repository audit rather than older completion assumptions.

Reference plan:

- `docs/ANDROID_SOFTPHONE_IMPLEMENTATION_PLAN.md`
- `docs/COMMUNICATION_APP_REPLAN.md`
- `docs/PROPOSED_FEATURE_LIST.md`
- `docs/IMPLEMENTATION_SO_FAR.md`

## Current Overall State

- The repository already contains working foundations for auth, device sessions, devices, websocket signaling, push delivery, and LiveKit calling.
- The communication-product migration remains incomplete.
- Messaging, E2EE, contact sync, unknown-user policy, block enforcement, and the approved three-tab shell are still ahead.
- The highest-priority work is lifecycle hardening, not messaging UI.

## Next Immediate Actions

1. Add focused automated auth-lifecycle regression coverage.
2. Verify the redesigned call routes on physical Android hardware.
3. Reproduce the reopen-logs-out behavior on physical Android hardware with instrumentation.
4. Reproduce the screen-timeout behavior on physical Android hardware and determine whether it is tied to active call state or broader app state.
5. Validate current incoming-call behavior across foreground, background, swipe-away, and terminated states before changing push logic.

## Execution Gates

### Gate 0: Repository and Architecture Reconciliation

Status: Complete; implementation has started from the reconciled plan

Remaining tasks:

- Reconcile the execution order and tracker files with repository state.

Dependencies:

- None.

### Gate 1: Authentication Persistence and Device Hardening

Status: In progress

Remaining tasks:

- Reproduce the logout-on-reopen bug on hardware.
- Validate startup auth bootstrap across physical restart states.
- Extend automated auth-lifecycle regression coverage from backend cases into restore-oriented mobile or integration flows where the toolchain permits.
- Validate durable installation identity behavior across physical restart, logout, and account-switch states.
- Validate the new direct device-session to device linkage across push-token rotation, logout, and account-switch states.
- Add regression tests for auth restore, revoked sessions, and logout.

Implementation begun:

- Startup bootstrap validates the current user before private routes mount.
- API refresh is single-flight and transient failures preserve the persisted session.
- Generic websocket disconnects no longer rotate credentials or clear auth.
- Mobile push registration now uses a stable installation identity persisted outside auth state.
- Backend device registration now treats installation identity as the primary current-device key and invalidates conflicting active rows during account switches or token replacement.
- Mobile login now sends the same stable installation identity used by device registration.
- Backend device sessions now persist installation identity, and logout invalidates matching active device registrations server-side.
- Device registration now sends and stores the current device-session association for the active install.
- Existing databases now migrate installation identity safely through a per-row backfill before the uniqueness constraint is applied.
- Explicit logout deletes the identifiable current-device push registration before revoking the device session.
- In-app lifecycle diagnostics are now available in Settings to capture auth, push, app-state, and realtime evidence during hardware validation.

Dependencies:

- Gate 0 complete.

### Call Screen Redesign

Status: In progress

Remaining tasks:

- Verify incoming, outgoing, active audio, and active video layouts on Android.
- Validate local hold, mute, speaker-route, and camera-toggle behavior on hardware.
- Validate permission denial/retry, call transitions, and end-call cleanup on hardware.

Implementation begun:

- Added shared NativeWind call presentation primitives and headerless routes.
- Redesigned incoming and outgoing screens and active audio/video presentation.
- Extracted shared call polling, permission, media authorization, timer, and end-call orchestration.
- Added shared local call controls for mute, speaker routing, hold or resume, and video camera toggling.
- Preserved existing call API, media-session, and route transition logic.

Dependencies:

- Gate 1 stability; physical-device auth validation remains outstanding.

### Gate 2: Android Lifecycle and Notification Reliability

Status: In progress

Remaining tasks:

- Define supported Android states explicitly.
- Validate FCM token-replacement handling across real token rotation and stale-token failure states.
- Define message-notification architecture for future messaging.
- Re-validate terminated incoming-call behavior after auth hardening.

Implementation begun:

- Incoming-call pushes now use a high-priority data-only backend payload instead of a visible backend notification body.
- Mobile incoming-call rendering remains centralized in the Notifee and CallKeep handlers fed by push data.
- Backend push sending now invalidates device registrations when Firebase reports unregistered tokens.

Dependencies:

- Gate 1 complete or stable enough for lifecycle validation.

### Gate 2A: Screen Timeout Investigation

Status: Not started

Remaining tasks:

- Reproduce the screen-timeout issue on hardware.
- Inspect generated Android behavior during idle browsing and active calls.
- Scope any necessary wake behavior to active calls only.
- Validate post-call timeout restoration.

Dependencies:

- Physical-device testing access.

### Gate 3: E2EE Feasibility

Status: Not started

Remaining tasks:

- Choose an audited protocol or library.
- Define device-key lifecycle and multi-device behavior.
- Prove encrypted device-to-device delivery on real code.
- Define safe push payload policy for encrypted messages.

Dependencies:

- Gate 1 and Gate 2 findings incorporated.

### Gate 4: Backend Messaging Foundation

Status: Not started

Remaining tasks:

- Create `backend/apps/messaging/`.
- Add conversation, message, attachment, receipt, and key-bundle models.
- Add REST and websocket contracts for messaging.
- Add authorization rules for unknown users and blocked users.

Dependencies:

- Gate 3 complete.

### Gate 5: Mobile Messaging Foundation

Status: Not started

Remaining tasks:

- Create `mobile/src/features/messaging/`.
- Add messages list, thread view, composer, and notification routing.
- Use TanStack Query for message and conversation server state.
- Convert the visible shell to `Messages`, `Calls`, and `Contacts`.

Dependencies:

- Gate 4 complete.

### Gate 6: Encrypted Media

Status: Not started

Remaining tasks:

- Add encrypted image, video, and voice upload and download flows.
- Define message attachment contracts and retry behavior.

Dependencies:

- Gates 3 through 5 complete.

### Gate 7: Calls and Messaging Integration

Status: Not started

Remaining tasks:

- Add call actions from message threads and conversation surfaces.
- Preserve all existing audio and video call flows while integrating the new shell.
- Align unknown-user and blocked-user policy across calls and messaging.

Dependencies:

- Gates 4 through 6 complete.

### Gate 8: Contact Synchronization and Contact Policy

Status: Not started

Remaining tasks:

- Add phone-contact sync and backend matching.
- Add contact-detail actions for save, block, unblock, call, and message.
- Define retention and privacy policy for normalized numbers or hashes.

Dependencies:

- Gate 7 stable enough for shared policy decisions.

### Gate 9: NativeWind Migration

Status: Not started

Remaining tasks:

- Migrate the new shell and communication surfaces safely.
- Keep lifecycle and native integrations stable during UI migration.

Dependencies:

- Gates 1 through 8 functionally stable.

### Gate 10: Full Regression and Hardware Validation

Status: Not started

Remaining tasks:

- Test on at least two physical Android devices.
- Validate auth restore, push lifecycle, call lifecycle, screen timeout, and notification behavior.
- Re-run static checks and Android build validation.

Dependencies:

- All earlier gates complete.

## Active Blockers

- Root cause of the logout-on-reopen bug is not yet proven.
- Root cause of the screen-timeout bug is not yet proven.
- Android lifecycle support boundaries are not fully documented or hardware-validated.
- E2EE design is not yet selected.

## Risks To Re-check During Execution

- SimpleJWT behavior under the chosen Python and Django stack
- Android build compatibility if Java runtime requirements change
- Realtime reconnect behavior after auth lifecycle changes
- Incoming-call reliability across OEM background restrictions
- Duplicate incoming-call notification behavior

## Deferred Decisions

- Device identity model and how to link `DeviceSession` to `Device`
- Whether session rotation policy remains enabled exactly as-is
- Final E2EE protocol and library selection
- Phone-contact sync privacy model
- Timing of the larger NativeWind migration once the new shell exists

## Last Updated

- Date: 2026-10-04
- Updated by: GitHub Copilot
