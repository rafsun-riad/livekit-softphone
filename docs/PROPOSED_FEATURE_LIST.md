# Proposed Feature List

Status: Proposed and approved for planning review

Purpose:

- Track the communication-app feature set that will be implemented next.
- Keep the product scope readable without forcing reviewers to parse the full architecture plan.

Reference documents:

- `docs/COMMUNICATION_APP_REPLAN.md`
- `docs/ANDROID_SOFTPHONE_IMPLEMENTATION_PLAN.md`
- `docs/IMPLEMENTATION_SO_FAR.md`
- `docs/REMAINING_IMPLEMENTATION.md`

## Core Product Direction

- Replace the current communication shell with a three-tab experience: Messages, Calls, Contacts.
- Keep the current backend telephony abstraction compatible with future PortaOne and Asterisk provider support.
- Preserve the dark theme direction, current fonts, and current color language.
- Migrate major mobile UI surfaces from StyleSheet-heavy screens to NativeWind-based primitives.

## Proposed Features

### Messages

- WhatsApp-style conversation list as the primary home screen
- Top app bar with `Messages` title and avatar menu
- Search bar for filtering conversations by contact name
- New conversation floating action button
- 1:1 text messaging
- 1:1 image messaging
- 1:1 video messaging
- 1:1 voice messaging
- End-to-end encryption for all message types in first release
- Delivery and read status indicators
- Unknown-sender save or block prompt in thread view
- Push notifications for incoming messages with encrypted-content-safe previews
- Call action from the message thread header

### Calls

- Calls tab as the second bottom tab
- Top app bar with `Calls` title and avatar menu
- Search bar for call history
- Searchable call list similar to modern messaging apps
- New call floating action button
- Initiate new call from contacts
- Reuse existing outgoing, incoming, audio, and video call flows
- Save or block action for unknown callers

### Contacts

- Contacts tab as the third bottom tab
- Top app bar with `Contacts` title and avatar menu
- Phone-contact sync and backend number matching
- Show phone contacts who are using the app
- Contact detail view with message, audio call, and video call actions
- New-contact floating action button
- Add-contact flow that validates whether a number belongs to an app user
- Toggle to decide whether a newly added contact should also sync to phone contacts
- Save-contact suggestion when an unknown app user messages or calls
- Block and unblock controls

### Navigation and profile access

- Only three visible bottom tabs
- Avatar tap opens compact menu
- Menu contains Profile and Settings routes
- Hidden routes remain available for active call and secondary flows

### Auth and loading UX

- Simplified login screen without unnecessary implementation text
- Centered loading spinner after splash when auth hydration or startup fetches are still running

## Existing Foundations To Reuse

- Backend auth and device sessions
- Backend contacts, calls, and devices apps
- Channels websocket signaling
- Firebase push delivery
- LiveKit media integration
- Expo Router navigation
- TanStack Query and Zustand

## Explicitly Deferred

- group messaging
- disappearing messages
- message reactions
- desktop client
- web client
- PSTN or SIP calling provider integration
- actual PortaOne implementation
- actual Asterisk implementation