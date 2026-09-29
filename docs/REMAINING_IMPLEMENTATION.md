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

1. Review `docs/COMMUNICATION_APP_REPLAN.md` and approve the reconciled architecture and execution order.
2. Reproduce the reopen-logs-out behavior on physical Android hardware with instrumentation.
3. Reproduce the screen-timeout behavior on physical Android hardware and determine whether it is tied to active call state or broader app state.
4. Validate current incoming-call behavior across foreground, background, swipe-away, and terminated states before changing push logic.

## Execution Gates

### Gate 0: Repository and Architecture Reconciliation

Status: Complete in documentation, awaiting review approval

Remaining tasks:

- Review and approve the reconciled communication re-plan.
- Confirm the tracker files now reflect the real repository state.

Dependencies:

- None.

### Gate 1: Authentication Persistence and Device Hardening

Status: Not started

Remaining tasks:

- Reproduce the logout-on-reopen bug.
- Add a dedicated startup auth bootstrap flow.
- Remove generic websocket-disconnect-driven token rotation.
- Decide and implement current-device logout invalidation behavior.
- Strengthen device-session and device-registration linkage.
- Add regression tests for auth restore, revoked sessions, and logout.

Dependencies:

- Gate 0 review approval.

### Gate 2: Android Lifecycle and Notification Reliability

Status: Not started

Remaining tasks:

- Define supported Android states explicitly.
- Resolve incoming-call notification dedup risk.
- Add FCM token-replacement handling.
- Define message-notification architecture for future messaging.
- Re-validate terminated incoming-call behavior after auth hardening.

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

- Date: 2026-09-29
- Updated by: GitHub Copilot
