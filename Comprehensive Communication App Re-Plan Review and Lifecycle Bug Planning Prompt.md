# Comprehensive Communication App Re-Plan Review, Reconciliation, and Bug-Fix Planning

## Role

Act as a **senior mobile/backend software architect, Android lifecycle specialist, security engineer, and implementation planner**.

You are working on an existing Android communication application that is being transformed from an Android softphone MVP into a **WhatsApp/Messenger-style communication application**, while preserving the existing architecture required for future **PortaOne and Asterisk/SIP integration**.

Your task in this phase is **PLANNING AND RE-PLANNING ONLY**.

**Do not start implementing the features or fixing the bugs yet.**

First thoroughly inspect the repository, existing implementation, architecture, documentation, and current behavior. Then produce and save a comprehensive implementation plan that reconciles the existing communication-app re-plan with the actual repository state and the additional requirements below.

---

# 1. Existing Documentation Must Be Treated as the Starting Point

Before creating or modifying the plan, inspect all relevant project documentation and source code.

At minimum inspect:

```text
docs/ANDROID_SOFTPHONE_IMPLEMENTATION_PLAN.md
docs/COMMUNICATION_APP_REPLAN.md
docs/PROPOSED_FEATURE_LIST.md
docs/IMPLEMENTATION_SO_FAR.md
docs/REMAINING_IMPLEMENTATION.md
```

Also inspect the actual implementation under:

```text
backend/
mobile/
```

Do not assume that the documentation accurately describes the current code.

The existing re-plan states that the repository already contains:

- mobile authentication
- durable device sessions
- silent token refresh
- Expo Router
- backend users
- contacts
- devices
- calls
- Django Channels/WebSocket signaling
- Firebase push delivery
- LiveKit calling
- CallKeep
- Notifee
- native Android incoming-call handling
- TanStack Query
- Zustand
- Expo SecureStore

The existing re-plan also identifies messaging as the major missing product area and proposes the three-tab communication experience:

```text
Messages
Calls
Contacts
```

Verify all of these claims against the actual repository.

Do not blindly trust the existing documentation.

If documentation and code disagree, explicitly identify the discrepancy and plan how it should be resolved.

The existing re-plan is the starting point, not an unquestionable source of truth.

---

# 2. Primary Objective

Create a **new comprehensive and implementation-ready re-plan** that combines:

1. The existing communication-app re-plan.
2. The existing repository architecture.
3. The actual implementation completed so far.
4. The findings from your repository audit.
5. The previously identified architectural risks.
6. The new lifecycle/authentication requirements below.
7. The new Android screen-timeout requirement.
8. The new terminated/closed-app notification requirement.
9. The E2E encryption requirements.
10. The existing calling architecture.
11. The future PortaOne/Asterisk compatibility requirement.

The result must be detailed enough that a future Agent-mode implementation can execute it phase by phase without repeatedly rediscovering the architecture.

---

# 3. IMPORTANT: Do Not Start Coding

This task is **not an implementation task**.

Do not:

- create production feature code
- modify application behavior
- blindly refactor files
- start implementing messaging
- start implementing E2EE
- change authentication
- change push handling
- modify Android native code

Instead:

1. Inspect.
2. Understand.
3. Compare.
4. Identify gaps.
5. Identify bugs.
6. Resolve architectural ambiguities.
7. Design the implementation sequence.
8. Update the planning documentation.
9. Clearly identify what should be implemented later.

If you discover that a small investigation or diagnostic command is necessary to understand the existing system, that is acceptable.

Do not turn the planning task into an implementation task.

---

# 4. Repository Audit Before Planning

Perform a structured audit of the current repository.

## 4.1 Backend audit

Inspect:

- Django settings
- authentication configuration
- JWT configuration
- DeviceSession model
- token refresh implementation
- login
- logout
- device registration
- device invalidation
- FCM device/token registration
- user model
- contacts
- calls
- call events
- Channels/WebSocket authentication
- push notification services
- background call handling
- LiveKit token generation
- API permissions
- blocked-user behavior
- existing tests

Determine:

- What exactly represents a device session?
- How long does it remain valid?
- What revokes it?
- Is refresh-token rotation implemented?
- Is refresh-token reuse detected?
- Is logout revoking only the current device session or the entire user session?
- Can an app restart restore the same device session?
- Can an expired access token be replaced using the persisted device session?
- Does the backend correctly distinguish an expired access token from an invalid/revoked device session?
- Is the device session tied to the physical installation/device?
- Can multiple devices exist for one account?
- What happens if the same account is used on multiple Android devices?
- What happens if the app is reinstalled?
- What happens if application data is cleared?
- What happens after logout?
- What happens after token expiration?
- What happens after the device session itself expires/revokes?

Document the actual behavior.

---

# 5. Mobile Authentication and App-Boot Audit

Inspect:

```text
mobile/src/
mobile/app/
```

especially:

- auth store
- SecureStore usage
- API client
- auth API
- token refresh helper
- route guards
- Expo Router layouts
- splash/loading behavior
- app bootstrap
- TanStack Query provider
- Zustand stores
- AppState listeners
- logout handling
- API 401 handling
- device registration
- FCM token handling

Determine exactly what happens during:

### Scenario A

User logs in.

Then:

```text
close app
reopen app
```

Expected:

```text
User remains logged in.
Private routes remain accessible after successful bootstrap.
```

### Scenario B

User logs in.

Then:

```text
access token expires
close app
reopen app
```

Expected:

```text
App bootstrap detects expired access token.
Persisted device session is used to obtain a new access token.
User remains logged in.
```

### Scenario C

User logs in.

Then:

```text
kill/terminate the application
reopen application
```

Expected:

```text
Device session is still available.
Authentication is silently restored.
```

### Scenario D

Access token is invalid but device session is valid.

Expected:

```text
Silent refresh.
Retry the original/current authenticated request when appropriate.
```

### Scenario E

Device session has been revoked.

Expected:

```text
Refresh fails.
Stored authentication state is cleared.
User is returned to authentication screens.
```

### Scenario F

User explicitly logs out.

Expected:

```text
Backend device session is revoked.
Local credentials/session metadata are removed.
WebSocket is disconnected.
Push/device registration behavior is handled correctly.
Private routes become inaccessible.
```

---

# 6. CRITICAL AUTHENTICATION BUG TO INVESTIGATE

There is currently a reported production-like behavior:

> When the user closes the application and opens it again, the user is logged out.

This contradicts the existing plan/documentation, which states that durable device sessions and silent refresh already exist.

Treat this as an **existing implementation bug or incomplete implementation until proven otherwise**.

Do not simply implement another login persistence mechanism.

First determine:

1. Whether the DeviceSession is actually persisted correctly.
2. Whether the refresh credential/session identifier is actually stored securely.
3. Whether Expo SecureStore survives normal app termination.
4. Whether the app bootstrap runs before route protection redirects to login.
5. Whether the auth store hydration has a race condition.
6. Whether the route guard checks authentication before hydration completes.
7. Whether an expired access token is incorrectly treated as a logged-out state.
8. Whether refresh is attempted during startup.
9. Whether refresh is attempted too late.
10. Whether the refresh endpoint is working but the mobile client fails to persist the new token.
11. Whether a 401 handler accidentally clears the entire auth state.
12. Whether logout logic is being triggered during app shutdown/unmount.
13. Whether device registration or FCM initialization is accidentally affecting auth state.
14. Whether multiple Zustand/store initialization paths overwrite hydrated state.
15. Whether Expo Router redirects before authentication bootstrap finishes.
16. Whether the backend device session is being revoked unexpectedly.
17. Whether the refresh token/device-session credential is rotated and the new value is not persisted.
18. Whether there are separate development/build environments causing inconsistent storage behavior.

Identify the actual root cause from the code.

The plan must contain:

```text
Observed behavior
Current implementation
Expected behavior
Root-cause hypothesis
Evidence required
Proposed fix
Regression tests
Manual verification
```

Do not declare the root cause without repository evidence.

---

# 7. Authentication UX Must Feel Like a Modern Messaging App

The target behavior should be similar to modern messaging applications.

The user should NOT see:

```text
Login screen
```

every time the application is closed and reopened.

Instead:

```text
App launch
   ↓
Splash / loading state
   ↓
Hydrate persisted device session
   ↓
Validate/refresh access token with backend
   ↓
Fetch current user
   ↓
Initialize required realtime/push state
   ↓
Open private application routes
```

If the session is valid:

```text
User enters the application without seeing the login screen.
```

If the access token is expired:

```text
Refresh automatically.
```

If the device session is invalid/revoked:

```text
Clear local auth state.
Navigate to login.
```

The user should not have to manually perform any of these steps.

The loading state must hide unnecessary authentication transitions.

---

# 8. Important Architecture Clarification

Do not describe token renewal as the backend independently refreshing the user's token while the application is closed.

The actual architecture should be:

```text
Mobile app starts
       ↓
Mobile auth bootstrap
       ↓
Persisted device-session credential
       ↓
Backend refresh endpoint
       ↓
Backend validates DeviceSession
       ↓
Backend issues new access token
       ↓
Mobile securely persists updated credentials
       ↓
Authenticated app starts
```

The backend is responsible for validating the device session and issuing tokens.

The mobile app is responsible for initiating the bootstrap/refresh request when it starts.

Plan this architecture explicitly.

---

# 9. Android Screen Timeout Bug

There is another reported issue:

> The screen does not turn off while the application is open.

Expected behavior:

The application must **not prevent Android's normal screen timeout**.

If the user has configured:

```text
Screen timeout = 30 seconds
```

then simply leaving the application open must NOT keep the display awake indefinitely.

The screen should turn off according to the user's Android system setting.

Investigate whether the current application or native integration is using anything such as:

- `FLAG_KEEP_SCREEN_ON`
- `android:keepScreenOn`
- Android WakeLock
- Expo KeepAwake
- React Native KeepAwake
- LiveKit-related wake behavior
- CallKeep behavior
- Notifee behavior
- custom native modules
- foreground-service behavior
- active-call screen handling
- WebRTC behavior
- screen flags added by Expo plugins
- native Android activity/window configuration

Search the entire repository.

Do not remove a screen-awake mechanism blindly.

Some features may legitimately require the screen to remain active temporarily, such as an active call UI.

The plan must distinguish:

### Normal application browsing

```text
System screen timeout applies normally.
```

### Messaging

```text
System screen timeout applies normally.
```

### Contacts

```text
System screen timeout applies normally.
```

### Calls

Determine whether the existing calling UX intentionally requires a temporary screen-awake behavior.

If it does, scope it only to the appropriate active-call state and release it immediately when no longer required.

The final plan must specify:

- root cause investigation
- affected code
- desired lifecycle behavior
- whether any keep-awake mechanism is actually necessary
- how it will be scoped
- how it will be tested on physical Android hardware

---

# 10. Terminated/Closed-App Push Notification Requirement

The application must support incoming notifications even when the application is not currently open.

Required scenarios:

### Foreground

```text
App open
↓
Incoming message/call
↓
Notification/in-app handling
```

### Background

```text
App in background
↓
Incoming message/call
↓
Push notification
```

### Terminated

```text
App closed/terminated
↓
Incoming message/call
↓
Push notification
```

The target behavior must feel like a modern communication application.

---

# 11. IMPORTANT: Distinguish Android Termination States

Do not treat all forms of "closed app" as technically identical.

The plan must explicitly distinguish:

1. App merely backgrounded.
2. App removed/swiped from the recent-apps screen.
3. App process terminated by Android.
4. App force-stopped from Android Settings.
5. Device restarted.
6. Battery optimization restrictions.
7. OEM background execution restrictions.
8. Notification permission denied.
9. FCM registration token changed.
10. Application data cleared.
11. User logged out.

Determine which states Android/FCM can support reliably and which states are intentionally restricted by Android.

Do not promise behavior that Android itself does not permit.

Document platform limitations clearly.

---

# 12. Incoming Message Push Requirements

When a message arrives while the application is not active:

```text
FCM
 ↓
Android notification
```

The notification must:

- appear even when the app is not open, where Android/FCM permits it
- use an appropriate notification channel
- use the user's configured notification sound where applicable
- respect Android notification settings
- respect vibration settings
- avoid exposing plaintext encrypted message content when E2EE privacy rules prohibit it
- contain enough metadata for the app to open the correct conversation
- correctly handle notification taps
- avoid duplicate notifications
- correctly handle multiple incoming messages

Plan notification payloads carefully.

Do not put sensitive plaintext message content into FCM payloads if that conflicts with the E2EE design.

---

# 13. Incoming Call Push Requirements

When an incoming call arrives while the app is:

```text
foreground
background
terminated
```

the system should provide appropriate incoming-call UX.

Existing architecture already includes:

- Firebase push
- CallKeep
- Notifee
- LiveKit
- background incoming-call handling

Do not replace this architecture unnecessarily.

First inspect the existing implementation.

The plan must verify and improve it where necessary.

Expected behavior:

```text
Incoming call
     ↓
FCM
     ↓
Native Android handling
     ↓
Incoming-call UI / notification
     ↓
Phone screen wakes according to supported Android/native call behavior
     ↓
Default/system-appropriate ringtone or configured call ringtone
     ↓
Vibration according to device/user settings
     ↓
User answers
     ↓
LiveKit call connection
```

---

# 14. Screen Wake, Sound, and Vibration

For incoming calls and messages, investigate the appropriate Android mechanisms for:

### Screen

The device should wake/display the appropriate incoming notification/call UI where Android permits.

Do not keep the screen permanently awake.

### Calls

Use the appropriate native call mechanism and ringtone behavior.

Determine whether CallKeep already provides the correct system-level behavior and what configuration is required.

### Messages

Use an Android notification channel with appropriate sound/vibration behavior.

Respect:

- system notification settings
- channel settings
- Do Not Disturb behavior
- user-configured vibration
- notification permission
- Android version differences

Do not hard-code vibration patterns or sounds unnecessarily.

The user's Android notification settings should remain authoritative where appropriate.

---

# 15. Firebase/FCM Audit

Inspect the complete FCM implementation.

Verify:

- device registration
- FCM token persistence
- token refresh handling
- token replacement
- multiple-device behavior
- device-session association
- backend device model
- push sending
- notification payloads
- data-only messages
- notification messages
- background handlers
- terminated-state handling
- foreground handlers
- notification channels
- notification permissions
- Android manifest requirements
- Firebase configuration
- Notifee integration
- CallKeep integration

Determine whether the current architecture can support both:

```text
message notification
call notification
```

without creating competing or duplicate handlers.

---

# 16. E2E Encryption Must Remain a Major Architecture Gate

The existing re-plan requires E2E encryption for:

- text
- images
- videos
- voice messages

Do not allow the implementation plan to simply say:

> "Encrypt the messages."

That is insufficient.

The plan must define an E2EE architecture decision/gate covering:

### Identity

- device identity
- user identity
- public/private key pairs
- multiple devices
- device registration

### Key lifecycle

- initial key generation
- secure private-key storage
- public-key registration
- key rotation
- device replacement
- logout
- account recovery
- reinstall
- compromised device
- revoked device

### Message encryption

- encryption envelope
- sender/receiver metadata
- nonce/IV
- authentication tag
- message versioning
- replay protection
- forward secrecy considerations

### Attachments

Images, videos, and voice messages must be encrypted before or as part of upload/storage according to the chosen protocol.

The server must not receive plaintext attachment content if the E2EE requirement prohibits that.

### Push notifications

Notification payloads must not accidentally defeat E2EE.

The plan must define what can safely be included in:

```text
FCM payload
notification title
notification body
data payload
```

### Multi-device

The plan must explicitly address whether one account can have multiple device keys.

### Protocol/library

Do not invent a custom cryptographic protocol.

Evaluate an established, audited cryptographic approach/library suitable for the React Native/Android architecture.

The plan must include an **E2EE feasibility spike before full messaging implementation** if the architecture is not already proven.

---

# 17. Unknown/Unsaved User Rules

The existing re-plan changed the original behavior so users who are not saved as contacts can still:

- message each other
- call each other

Preserve this requirement unless repository evidence reveals a conflict that requires an explicit product decision.

Define consistent rules for:

- unknown sender
- unknown caller
- save contact
- block sender
- unblock sender
- message permissions
- call permissions
- push permissions
- WebSocket permissions
- LiveKit permissions
- blocked-user enforcement

The same authorization rules must apply across:

```text
REST API
WebSocket
FCM
LiveKit
```

Do not implement a situation where a user is blocked in REST but can still call through WebSocket/LiveKit.

---

# 18. Contact Synchronization

The existing re-plan requires phone-contact synchronization.

The plan must address:

```text
Phone contacts
↓
Normalize phone numbers
↓
Privacy-safe matching
↓
Backend lookup
↓
Return only app users
```

Investigate:

- Android contacts permission
- phone-number normalization
- duplicate numbers
- country codes
- privacy implications
- backend matching
- rate limits
- upload strategy
- whether raw phone numbers should be persisted
- hashing/privacy-preserving alternatives
- block behavior
- contact removal
- resynchronization

Do not implement this as a simple unrestricted phonebook upload without considering privacy and security.

---

# 19. Messaging Architecture

Plan:

### Backend

Potential areas:

```text
backend/apps/messaging/
```

Determine the correct structure based on the existing architecture.

Cover:

- conversations
- participants
- messages
- encrypted envelopes
- delivery state
- read state
- attachment metadata
- pagination
- ordering
- idempotency
- retries
- WebSocket events
- push notifications
- blocked users
- unknown users
- deletion behavior
- offline delivery

### Mobile

Determine the appropriate structure for:

```text
features/messaging/
```

including:

- API
- hooks
- types
- crypto service
- conversation list
- message thread
- composer
- attachment picker
- voice recorder
- message state
- realtime events
- notification navigation

Avoid unnecessarily placing server state into Zustand.

Use TanStack Query for server state where appropriate and Zustand only for true client/session/transient state.

---

# 20. Calling Architecture Must Not Regress

The application already contains:

- LiveKit
- audio calls
- video calls
- call history
- Django call APIs
- Channels signaling
- FCM
- CallKeep
- Notifee

The communication-app re-plan must preserve these capabilities.

The new plan must explicitly protect:

```text
Messages → Call
Calls → Call
Contacts → Call
Incoming Call
Outgoing Call
Audio Call
Video Call
Background Call
Terminated Call
```

Do not redesign the calling architecture simply to implement messaging.

Future support for:

```text
PortaOne
Asterisk
SIP
PSTN
```

must remain possible through the existing provider abstraction.

---

# 21. Three-Tab Product Structure

Preserve the approved direction:

```text
Messages
Calls
Contacts
```

### Messages

- WhatsApp-style conversation list
- search
- new conversation
- text
- image
- video
- voice
- E2EE
- delivery status
- read status
- notification
- call action

### Calls

- searchable call history
- audio/video calls
- new call
- call actions
- unknown caller handling

### Contacts

- phone-contact sync
- app-user matching
- contact details
- message
- audio call
- video call
- add contact
- block/unblock

### Avatar menu

```text
Profile
Settings
```

Do not unnecessarily expose additional bottom tabs.

---

# 22. NativeWind Migration

The existing re-plan includes migration from StyleSheet-heavy screens to NativeWind.

Keep this requirement, but do not allow UI migration to destabilize:

- authentication
- navigation
- messaging
- calls
- contacts
- push notifications
- native Android integration

The plan should define a safe migration order.

Do not combine a large UI migration with an unrelated authentication or native lifecycle rewrite unless there is a clear dependency.

---

# 23. Recommended Planning Gates

The final plan should contain explicit architecture gates.

At minimum:

## Gate 0 — Repository and Architecture Reconciliation

Confirm:

- actual current implementation
- documentation accuracy
- authentication lifecycle
- device sessions
- FCM
- native call handling
- navigation

## Gate 1 — Authentication Persistence

Prove:

```text
login
close
reopen
access-token expiry
silent refresh
session restoration
logout
revoked session
```

## Gate 2 — Android Lifecycle and Notification Reliability

Prove:

```text
foreground
background
swiped away
terminated
device reboot
```

for supported notification/call behaviors.

## Gate 3 — E2EE Feasibility

Prove:

```text
device A
↓
encrypt
↓
backend
↓
device B
↓
decrypt
```

before building the entire messaging system around an unproven crypto design.

## Gate 4 — Backend Messaging

Implement and test the server-side messaging foundation.

## Gate 5 — Mobile Messaging

Implement the text messaging flow.

## Gate 6 — Encrypted Media

Implement:

```text
image
video
voice
```

## Gate 7 — Calls + Messaging Integration

Ensure calling from:

```text
Messages
Calls
Contacts
```

## Gate 8 — Contact Synchronization

Implement phonebook matching and contact management.

## Gate 9 — UI/NativeWind Migration

Perform the UI migration after core functionality is stable.

## Gate 10 — Full Regression and Hardware Validation

Test on at least two physical Android devices.

---

# 24. Testing Requirements

Every phase must include:

### Backend automated tests

Where applicable:

- authentication
- device sessions
- refresh
- logout
- messaging
- encryption envelope validation
- authorization
- blocks
- contacts
- calls
- push dispatch
- notification payload generation

### Mobile static checks

At minimum where applicable:

```bash
npx tsc --noEmit
npx expo export --platform android
npx expo prebuild --platform android --no-install
```

### Android build

Use the repository's established Android build command and verify native integration.

### Physical-device testing

Do not consider these features fully validated using only an emulator:

- FCM
- terminated-state push
- CallKeep
- Notifee
- ringtone
- vibration
- screen wake
- Android notification channels
- contacts permission
- LiveKit calling
- background lifecycle
- screen timeout

---

# 25. Explicit Regression Matrix

Create a regression matrix in the plan.

At minimum:

| Area | Existing behavior | New behavior | Must not regress |
|---|---|---|---|
| Login | Existing auth | Persistent session | Yes |
| Logout | Explicit logout | Explicit logout only | Yes |
| Device session | Existing | Survive app restart | Yes |
| Token refresh | Existing | Automatic bootstrap refresh | Yes |
| Messages | New | E2EE messaging | N/A |
| Calls | Existing | Integrated with Messages | Yes |
| Contacts | Existing | Phone sync | Yes |
| FCM | Existing | Message + call notifications | Yes |
| CallKeep | Existing | Terminated incoming calls | Yes |
| Notifee | Existing | Notifications/actions | Yes |
| Screen timeout | Current bug | Respect system timeout | Fix |
| LiveKit | Existing | Messaging integration | Yes |
| Expo Router | Existing | Three-tab navigation | Yes |

Expand this matrix based on your repository audit.

---

# 26. Feature Tracker Synchronization

After producing the final plan, update the planning/tracking documentation consistently.

Maintain:

```text
docs/COMMUNICATION_APP_REPLAN.md
docs/PROPOSED_FEATURE_LIST.md
docs/IMPLEMENTATION_SO_FAR.md
docs/REMAINING_IMPLEMENTATION.md
```

However, because this is a planning task:

- Do not falsely mark features as implemented.
- Do not modify "Implementation So Far" to claim code exists when it does not.
- Move newly discovered bugs/features into the appropriate proposed/remaining sections.
- Record planning decisions clearly.
- Preserve factual historical implementation information.

Add a dedicated section such as:

```text
## Newly Identified Lifecycle and Reliability Requirements
```

to the communication re-plan.

Include:

1. Screen timeout bug.
2. Persistent login/device-session bug.
3. Startup token verification/refresh.
4. Terminated-state message notification.
5. Terminated-state call notification.
6. Screen wake behavior.
7. Sound/ringtone behavior.
8. Vibration behavior.
9. Android lifecycle limitations.
10. FCM reliability requirements.

---

# 27. Documentation Quality Requirements

The final re-plan must be:

- implementation-oriented
- specific
- internally consistent
- based on actual repository findings
- explicit about dependencies
- explicit about risks
- explicit about testing
- explicit about rollback considerations
- explicit about security boundaries

Avoid vague instructions such as:

> "Implement secure messaging."

Instead specify:

```text
What
Why
Where
Dependency
Implementation approach
Security considerations
Tests
Manual verification
Acceptance criteria
Rollback considerations
```

for every major phase.

---

# 28. No Pseudocode as a Substitute for Architecture

The final plan may contain:

- real file paths
- actual module names
- actual API endpoint proposals
- actual model names
- real commands
- concrete configuration names

Do not use pseudocode to hide unresolved architecture.

If something cannot yet be determined without implementation, mark it explicitly as:

```text
Architecture Decision Required
```

or:

```text
Investigation Required
```

rather than inventing an answer.

---

# 29. Copilot Must Identify Existing Code Before Creating New Code

For every planned feature, provide:

```text
Existing implementation:
- file/path
- relevant class/function/component
- current responsibility

Reuse:
- what should remain

Modify:
- what should change

Create:
- what genuinely needs a new file/module

Remove:
- what is obsolete

Risk:
- what existing feature could break
```

This is especially important for:

- authentication
- DeviceSession
- SecureStore
- FCM
- CallKeep
- Notifee
- LiveKit
- Expo Router
- Zustand
- TanStack Query
- WebSocket
- contacts

Do not duplicate existing services merely because they are difficult to understand.

---

# 30. Migration Safety

For risky changes:

1. Identify the existing behavior.
2. Identify the proposed behavior.
3. Identify dependencies.
4. Define the migration order.
5. Define validation.
6. Define rollback.

Never make a large cross-layer change without identifying the affected systems.

Particularly protect:

```text
Authentication
Device sessions
Push notifications
Incoming calls
LiveKit
Navigation
WebSocket signaling
```

---

# 31. Manual Migration Requirement

If database schema changes are required:

- explicitly describe the migration
- identify affected models
- identify data migration requirements
- identify backward compatibility concerns

Do not assume automatic migration generation should be blindly run in production.

The implementation phase must use deliberate migration files and review them before application.

---

# 32. Final Deliverable

Your final planning result must contain these sections:

```text
1. Executive Summary
2. Repository Audit Findings
3. Documentation vs Code Discrepancies
4. Current Architecture
5. Existing Features That Must Be Preserved
6. New Product Requirements
7. Authentication Lifecycle Findings
8. Device Session / Silent Refresh Bug Analysis
9. Android Screen Timeout Bug Analysis
10. FCM Lifecycle and Notification Analysis
11. Incoming Call Lifecycle
12. E2EE Architecture Gate
13. Messaging Architecture
14. Contact Synchronization Architecture
15. Calling Architecture Compatibility
16. Navigation / UI Architecture
17. NativeWind Migration Strategy
18. Backend Implementation Phases
19. Mobile Implementation Phases
20. Native Android Implementation Phases
21. Testing Strategy
22. Physical Device Test Matrix
23. Security Considerations
24. Performance Considerations
25. Failure and Recovery Scenarios
26. Regression Matrix
27. Documentation/Tracker Updates
28. Risks and Mitigations
29. Architecture Decisions Required
30. Final Recommended Execution Order
31. Definition of Done
```

---

# 33. Definition of Done

The re-plan is considered complete only when it clearly explains how the final application will achieve all of the following:

### Authentication

```text
User logs in
↓
Device session persists
↓
App closes
↓
App reopens
↓
Loading state
↓
Access token validated/refreshed
↓
User remains authenticated
```

Explicit logout must still log the user out.

A revoked device session must force authentication again.

---

### Screen Timeout

```text
App open normally
↓
User does nothing
↓
Android system timeout occurs
↓
Screen turns off according to system settings
```

No unnecessary keep-awake behavior should remain active.

---

### Incoming Message

```text
Sender sends message
↓
Recipient app foreground/background/terminated
↓
FCM
↓
Android notification
↓
Appropriate sound/vibration
↓
Notification tap
↓
Correct conversation
```

Subject to Android/FCM platform restrictions.

---

### Incoming Call

```text
Caller starts call
↓
FCM/native call handling
↓
Recipient foreground/background/terminated
↓
Incoming call UI
↓
Screen wake where supported
↓
Appropriate ringtone
↓
Vibration according to system/user settings
↓
Answer
↓
LiveKit
```

---

### E2EE

```text
Device A
↓
Encrypt
↓
Server stores/relays ciphertext
↓
Device B
↓
Decrypt
```

The server must not become a plaintext message processor if that violates the E2EE architecture.

---

### Existing Calling

Existing LiveKit audio/video calling and native incoming-call behavior must remain functional.

---

### Future Telephony

The architecture must remain compatible with future:

```text
PortaOne
Asterisk
SIP
PSTN
```

integration.

---

# 34. Most Important Instruction

Before saving the final plan, ask yourself:

> "If another senior engineer received this repository and this plan tomorrow, could they implement the next phase without guessing how the existing authentication, device sessions, push notifications, calls, LiveKit, navigation, and messaging architecture are supposed to interact?"

If the answer is no, improve the plan before finishing.

Also ask:

> "Have I actually verified the reported logout and screen-timeout problems against the repository, or am I merely assuming their causes?"

If the cause is not proven, label it as an investigation item instead of presenting speculation as fact.

---

# 35. Final Output Behavior

After completing the repository audit and planning:

1. Update the appropriate planning documentation.
2. Do not implement the planned features.
3. Summarize the most important findings.
4. Clearly identify:
   - confirmed bugs
   - suspected bugs
   - architecture gaps
   - new requirements
   - major risks
   - implementation dependencies
5. Explain the final phased implementation order.
6. Identify the first implementation phase that should be executed in Agent mode.
7. Tell me when the planning work is complete and the repository is ready for review.

Only after I review and approve the plan should implementation begin.