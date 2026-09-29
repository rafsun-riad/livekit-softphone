# Proposed Feature List

Status: Reconciled for planning review

Purpose:

- Track the communication-app feature set that is still planned.
- Distinguish implemented foundations from missing product work.
- Keep the communication scope readable without forcing reviewers to parse the full re-plan.

Reference documents:

- `docs/COMMUNICATION_APP_REPLAN.md`
- `docs/ANDROID_SOFTPHONE_IMPLEMENTATION_PLAN.md`
- `docs/IMPLEMENTATION_SO_FAR.md`
- `docs/REMAINING_IMPLEMENTATION.md`

## Current Baseline Already Present

- Backend auth endpoints and device-session model
- Backend users, contacts, devices, and calls apps
- Channels websocket signaling and presence
- Firebase Admin push delivery
- LiveKit token generation and media join flow
- Mobile SecureStore-backed auth state
- Mobile authenticated request refresh flow
- Mobile push registration flow
- Mobile CallKeep, Notifee, and LiveKit calling flows

## Confirmed Gaps

- No backend messaging domain
- No mobile messaging feature area
- No E2EE implementation
- No encrypted media pipeline
- No phone-contact sync
- No end-to-end block and unblock policy
- No approved three-tab shell yet
- No dedicated auth bootstrap UX
- No completed Android lifecycle reliability matrix

## Core Product Direction

- Replace the visible app shell with `Messages`, `Calls`, and `Contacts`.
- Keep the existing backend telephony abstraction compatible with future PortaOne and Asterisk provider support.
- Preserve the working LiveKit calling architecture instead of redesigning it around messaging.
- Migrate mobile UI surfaces to NativeWind only after lifecycle-critical work is stable.

## Proposed Features

### Messages

- WhatsApp-style conversation list as the primary signed-in entry
- Top app bar with `Messages` title and avatar menu
- Search bar for filtering conversations
- New conversation floating action button
- 1:1 text messaging
- 1:1 image messaging
- 1:1 video messaging
- 1:1 voice messaging
- End-to-end encryption for all message types in first release
- Delivery and read status indicators
- Unknown-sender save or block prompt in thread view
- Push notifications for incoming messages with E2EE-safe previews
- Call action from the thread header

### Calls

- Calls tab as the second visible bottom tab
- Searchable call history list
- New call floating action button
- Initiate new call from contacts and future conversation threads
- Reuse existing outgoing, incoming, audio, and video call flows
- Save or block action for unknown callers

### Contacts

- Contacts tab as the third visible bottom tab
- Phone-contact sync and backend number matching
- Show matched app users from the phone address book
- Contact detail with message, audio call, video call, save, block, and unblock actions
- New-contact flow with app-user validation and optional phonebook sync behavior

### Navigation and profile access

- Only three visible bottom tabs
- Avatar tap opens compact menu
- Menu contains `Profile` and `Settings`
- Hidden routes remain available for active call and other secondary flows

### Auth and loading UX

- Persistent login across supported restart states
- Startup loading screen while auth bootstrap runs
- Silent refresh when access token is expired but device session is valid
- Clean logout that revokes the backend session and current-device push reachability

### Notifications and lifecycle

- Foreground, background, and supported terminated-state call notifications
- Foreground, background, and supported terminated-state message notifications
- Scoped ringtone, vibration, and wake behavior that respects Android platform limits
- No unnecessary keep-awake behavior outside active call scope

## Newly Identified Lifecycle and Reliability Requirements

- Persistent login and startup refresh hardening
- Screen-timeout bug investigation and fix
- Terminated-state message-notification design
- Terminated-state call-notification reliability validation
- Device-session and device-registration linkage policy
- FCM token rotation and replacement handling
- Android lifecycle limitation documentation

## Explicitly Deferred

- Group messaging
- Disappearing messages
- Message reactions
- Desktop client
- Web client
- PSTN or SIP provider implementation
- Actual PortaOne implementation
- Actual Asterisk implementation
- Large visual-only NativeWind migration before lifecycle hardening
