# Role

Act as a senior software architect and implementation planner specializing in:

- React Native / Expo
- Android native development with Kotlin
- Django / Django REST Framework
- channel
- uvicorn
- JWT authentication
- WebRTC / LiveKit
- PostgreSQL
- WebSockets
- TanStack Query
- Zustand
- scalable mobile application architecture
- secure authentication and API design

Your job in this task is **NOT to start implementing the application**.

Your first responsibility is to thoroughly inspect the current repository/environment and then create a **comprehensive, implementation-ready development plan** for this project.

The project is starting from essentially zero application configuration, so the plan must include all required initial setup.

---

# Project Goal

I want to build an Android softphone-style application from scratch.

The first milestone is intentionally limited:

> Two registered users should be able to log into the mobile application and call each other using LiveKit/WebRTC.

The first version must support:

- user registration
- user login
- user profile
- discovering/searching users
- adding/saving contacts inside the application
- only allowing users to initiate calls to contacts that are saved/accepted in the application
- app-to-app audio calling
- app-to-app video calling
- realtime call signaling/state
- authentication
- secure API communication
- realtime WebSocket communication
- LiveKit-based WebRTC media

Do NOT add PSTN, SIP, Asterisk, PortaOne, WhatsApp, Telegram, or other external telephony functionality in this first milestone.

However, the architecture should be designed so that external telephony providers can be added later without requiring a major rewrite.

---

# Important Future Architecture Context

In the future, I want this system to support:

- app-to-app calls through LiveKit
- app-to-external calls through Asterisk or PortaOne/PortaSIP
- Django deciding which provider should handle an external call
- potentially different providers for different tenants/users/configurations

Therefore, avoid tightly coupling the first implementation to a specific telephony provider.

For the current milestone, LiveKit is the only realtime media provider.

The architecture should conceptually allow this future evolution:

```text
                    Django Backend
                         |
                    Call Router
                         |
             +-----------+-----------+
             |                       |
        App-to-App             App-to-External
             |                       |
          LiveKit          Future provider abstraction
                                 |
                       +---------+---------+
                       |                   |
                    Asterisk          PortaOne
```

Do not implement the future providers now. Only ensure the architecture does not make them difficult to add later.

---

# Technology Stack

## Mobile

Use:

- Expo
- React Native
- TypeScript
- Expo-compatible architecture
- gluestack UI v5
- NativeWind v5
- TanStack Query for server/remote state
- Zustand for global client state
- LiveKit React Native SDK for WebRTC

The application is primarily an Android application.

Do not assume Expo Go is sufficient if the selected LiveKit/native functionality requires native modules.

Determine the appropriate Expo workflow, development build/prebuild configuration, or bare/native setup required by the current LiveKit React Native SDK.

The plan must clearly explain this.

---

# Android Native Layer

Use Kotlin only where Android-native functionality is actually necessary.

Do NOT unnecessarily rewrite functionality in Kotlin that can be handled correctly by React Native.

Potential native areas include:

- Android call handling
- Android Telecom / ConnectionService if eventually needed
- incoming call notifications
- foreground services if required
- Android audio routing
- Bluetooth/headset handling
- microphone/audio device integration
- Android permissions
- background call handling
- notification channels
- FCM integration if required
- native integration required by LiveKit
- any native functionality that Expo/React Native cannot safely provide

For the current first milestone, determine exactly which Kotlin/native Android components are actually required and which can remain entirely in React Native.

The development environment currently does NOT have Kotlin installed.

The plan must therefore determine:

1. whether Kotlin needs to be installed explicitly
2. whether the Android/Gradle toolchain bundles or manages the required Kotlin version
3. which exact Kotlin/JDK/Android SDK/Gradle configuration is required
4. commands for installing the appropriate/latest compatible versions
5. how to verify the installation

Do not blindly install an arbitrary Kotlin version.

Check the currently appropriate compatibility requirements for the chosen Expo/React Native/LiveKit Android setup and recommend the compatible stable versions.

---

# Backend

Use:

- Python
- Django
- Django REST Framework
- PostgreSQL
- JWT authentication
- Django Channels
- Uvicorn
- ASGI
- environment variables using a `.env` file

The backend should provide:

- registration
- login
- JWT access/refresh tokens
- logout/token invalidation strategy if appropriate
- user profile
- contact management
- user search/discovery
- call authorization
- call state
- LiveKit token generation
- WebSocket signaling
- call lifecycle management
- validation
- authorization
- database persistence where appropriate

Use secure and production-oriented patterns.

Do not store LiveKit secrets in the mobile application.

---

# Authentication Requirements

Users should be able to create an account using:

- phone number
- email
- password

Users should be able to log in using:

- phone number
- password

Design the user/account model carefully.

Think about:

- whether Django's default User model should be replaced with a custom user model
- phone number normalization
- email uniqueness
- phone uniqueness
- password hashing
- account activation
- JWT access token lifetime
- JWT refresh token lifetime
- token rotation
- token storage in React Native
- secure local credential storage
- logout behavior
- account deletion considerations
- validation
- future OTP/phone verification support

Do NOT need to add OTP/SMS verification for the current milestone. It is a future enhancement, mention it separately.

The plan should distinguish:

### MVP

What is strictly required now.

### Future

What should be added later.

---

# Contact System

Users should be able to:

1. search/discover another registered user
2. add that user as a contact
3. see their saved contacts
4. initiate calls only to valid contacts

Define an appropriate contact relationship model.

Consider:

- one-directional vs mutual contact relationships
- pending requests
- accepted contacts
- blocked users
- duplicate contacts
- removing contacts
- contact status
- online/offline status

For the MVP, keep the implementation simple but architect it cleanly enough to support more advanced contact functionality later.

---

# Calling Requirements

The central MVP requirement is:

> User A logs in, User B logs in, A has B saved as a contact, and A can call B.

Support:

- audio call
- video call
- incoming call
- outgoing call
- ringing
- accept
- reject
- cancel
- busy
- call connected
- call ended
- basic call state
- microphone mute/unmute
- camera enable/disable
- speaker/audio output handling
- switching camera if supported
- call duration/state
- handling disconnection

Determine which state belongs in:

### React Native local state

### Zustand

### TanStack Query

### WebSocket state

### Django database

### LiveKit room state

Do not unnecessarily duplicate state across multiple systems.

---

# LiveKit

I already have a LiveKit server running on a VPS with a minimal working setup.

The LiveKit server URL is currently an IP address and may change frequently.

Therefore the LiveKit server URL must NOT be hardcoded.

I also need LiveKit credentials/configuration such as:

- LiveKit URL
- LiveKit API key
- LiveKit API secret

The plan must determine where each of these should live.

Important security requirement:

> The LiveKit API secret must NEVER be shipped inside the React Native application.

Determine the correct architecture for:

```text
React Native
      |
      | request call/token
      v
Django
      |
      | generate LiveKit token using secret
      v
LiveKit
```

The React Native application should receive only the information it actually needs.

The LiveKit server URL can be supplied to the client if appropriate, while the API key/secret handling must remain secure.

Determine whether:

- `LIVEKIT_URL` belongs in mobile `.env`
- `LIVEKIT_URL` belongs in Django `.env`
- both should contain it
- another architecture is preferable

Make this decision based on security and maintainability.

---

# React Native Environment Variables

Create a dedicated environment-variable strategy for the React Native application.

I want frequently changing configuration in one place.

At minimum, consider variables such as:

```env
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_WS_URL=
EXPO_PUBLIC_LIVEKIT_URL=
```

However, do not assume these exact names are correct without checking the current Expo environment-variable conventions.

The plan must explain:

- how Expo environment variables work
- which variables are safe to expose publicly
- which variables must NEVER be included in the mobile app
- `.env`
- `.env.example`
- development/staging/production configuration
- how changing the API origin/WebSocket origin/LiveKit URL should work
- how the application should consume these values

Do not put secrets into Expo public variables.

---

# Django Environment Variables

Create a `.env` configuration strategy for Django.

At minimum, consider:

```env
SECRET_KEY=
DEBUG=
ALLOWED_HOSTS=

DATABASE_NAME=name
DATABASE_USERNAME=user
DATABASE_PASSWORD=password
DATABASE_HOST=localhost
DATABASE_PORT=5432

JWT_ACCESS_TOKEN_LIFETIME=
JWT_REFRESH_TOKEN_LIFETIME=

LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
```

Add any other required variables.

Create:

```text
.env.example
```

Do not commit the real `.env`.

The plan must include `.gitignore` rules.

---

# API Architecture

Create a React Native hook:

```text
useAPI.ts
```

The intention is that most HTTP API communication should go through this hook.

The plan should define how `useAPI.ts` should provide operations such as:

- GET
- POST
- PUT
- PATCH
- DELETE

It should handle, where appropriate:

- base URL
- authentication headers
- JWT access token
- refresh token handling
- request errors
- response parsing
- common error format
- timeout/cancellation
- network errors
- unauthorized responses
- token refresh
- retry behavior
- multipart/form-data if later required

Do not put all business logic inside the hook.

Instead, determine the appropriate separation between:

```text
useAPI
API client
TanStack Query
feature-specific hooks
screens/components
```

The plan should avoid creating hundreds of unnecessary abstractions while keeping the design maintainable.

For example, determine whether the architecture should resemble:

```text
useAPI()
   |
API client
   |
fetch/axios
   |
Django REST API

        +
        |
TanStack Query
        |
feature hooks
```

Choose the appropriate implementation.

---

# TanStack Query

Use TanStack Query for server/remote state.

Determine how it should manage:

- current user
- contacts
- contact requests
- user search
- call history if implemented
- online status where appropriate
- cached user data
- mutation states
- optimistic updates where useful
- invalidation
- stale times
- retries
- query keys

Do not put server state into Zustand unnecessarily.

---

# Zustand

Use Zustand for global client/application state.

Potential examples:

- authentication state
- current authenticated user
- active call UI state
- current call ID
- current room information
- global app preferences
- UI state
- connection state where appropriate

However, do not automatically put everything into Zustand.

The plan must explicitly explain which data belongs in:

- TanStack Query
- Zustand
- component state
- WebSocket state
- LiveKit state

---

# WebSocket Architecture

Create another React Native hook:

```text
useWebSocket.ts
```

All WebSocket-related consumption should primarily go through this hook.

The plan must define:

- WebSocket URL configuration
- JWT authentication
- connection lifecycle
- reconnect behavior
- heartbeat/ping/pong if needed
- event subscription
- event unsubscription
- handling duplicate subscriptions
- cleanup
- connection state
- malformed messages
- server disconnect
- app background/foreground behavior
- call signaling events

Potential event types include:

```text
incoming_call
call_ringing
call_accepted
call_rejected
call_cancelled
call_ended
call_busy
call_connected
user_online
user_offline
```

Do not assume all of these are required.

Determine a clean minimum event protocol for the first milestone.

---

# Calling Architecture

Design the call flow carefully.

A likely architecture is:

```text
User A
  |
  | HTTP/WebSocket
  v
Django
  |
  | authorize call
  | create/manage call state
  | generate LiveKit token
  v
LiveKit
  |
  | WebRTC media
  |
  +------------------+
  |                  |
User A              User B
React Native        React Native
```

But refine this architecture based on LiveKit's actual capabilities.

Important distinction:

- Django is the control/signaling/business layer.
- LiveKit is the realtime media layer.
- WebSocket should coordinate call state/signaling.
- WebRTC media should flow through LiveKit, not through Django.

Explain the exact call lifecycle.

For example:

```text
A taps Call B
      |
      v
Django verifies:
- authenticated?
- B exists?
- B is a contact?
- B can receive calls?
      |
      v
create call
      |
      v
notify B via WebSocket
      |
      v
B accepts
      |
      v
Django creates/authorizes LiveKit room
      |
      v
A/B receive LiveKit tokens
      |
      v
both connect to LiveKit
      |
      v
audio/video flows through LiveKit
```

This is only a conceptual starting point.

Verify the correct LiveKit flow and produce the technically correct sequence.

---

# LiveKit Room/Token Design

Determine:

- room naming strategy
- whether rooms should be created explicitly or implicitly
- participant identity format
- participant metadata
- token grants
- room join permissions
- publish permissions
- subscribe permissions
- audio/video permissions
- room cleanup
- call timeout
- handling abandoned calls
- handling user disconnects

Avoid using predictable insecure room names if that creates a security issue.

The backend must authorize room participation.

---

# Database Design

Design the minimum required Django models.

Likely entities include:

```text
User
Contact
Call
```

Potentially:

```text
CallParticipant
Device
```

Only introduce additional models when justified.

The plan should define:

- fields
- relationships
- indexes
- uniqueness constraints
- timestamps
- state fields
- database constraints
- soft-delete requirements if needed

For the Call model, consider states such as:

```text
initiated
ringing
accepted
rejected
connected
ended
cancelled
busy
failed
```

Use a consistent state-transition strategy.

---

# API Endpoints

Design the REST API before implementation.

Include endpoint categories such as:

### Authentication

```text
POST /api/auth/register/
POST /api/auth/login/
POST /api/auth/refresh/
POST /api/auth/logout/
```

### User

```text
GET /api/users/me/
PATCH /api/users/me/
GET /api/users/search/
```

### Contacts

```text
GET /api/contacts/
POST /api/contacts/
DELETE /api/contacts/{id}/
```

### Calls

```text
POST /api/calls/
GET /api/calls/{id}/
POST /api/calls/{id}/accept/
POST /api/calls/{id}/reject/
POST /api/calls/{id}/cancel/
POST /api/calls/{id}/end/
```

### LiveKit

Potentially:

```text
POST /api/calls/{id}/livekit-token/
```

Do not blindly use these exact endpoints.

Review the architecture and recommend the cleanest API structure.

The plan should document every endpoint with:

- method
- URL
- purpose
- authentication requirement
- request body
- response
- validation
- expected errors

---

# Project Structure

Recommend a clean project structure for both:

## React Native

Potentially something like:

```text
mobile/
  app/
  src/
    components/
    screens/
    features/
    hooks/
      useAPI.ts
      useWebSocket.ts
    services/
    stores/
    lib/
    types/
    constants/
    utils/
    config/
  assets/
  .env
  .env.example
```

But adapt this to the chosen Expo Router/project structure.

Do not create meaningless folders simply to make the tree look sophisticated.

---

## Django

Potentially:

```text
backend/
  config/
  apps/
    accounts/
    contacts/
    calls/
  manage.py
  requirements/
  .env
  .env.example
```

Again, determine the best practical structure.

Keep domain boundaries clear.

---

# UI/UX

Use:

- gluestack UI v5
- NativeWind v5

Design the minimum necessary screens:

```text
Splash / loading
Register
Login
Home
User Search
Contacts
Incoming Call
Outgoing Call
Active Audio Call
Active Video Call
Profile
Settings
```

Do not implement an enormous UI for the first milestone.

The plan should define navigation structure and screen responsibilities.

Use reusable components.

---

# Permissions

Identify all Android permissions required for:

- microphone
- camera
- notifications
- network
- Bluetooth/audio devices if required
- foreground/background behavior if required

Do not request permissions unnecessarily.

The plan should explain when each permission should be requested.

Prefer requesting permissions contextually rather than requesting everything immediately on first launch.

---

# Android Build Environment

Because this is starting from zero, the plan must include environment setup.

Determine the required:

- Node.js version
- package manager
- Java/JDK version
- Android SDK
- Android Studio
- Android SDK Platform
- Android SDK Build Tools
- Android emulator/device configuration
- Expo CLI/tooling
- EAS CLI if required
- Kotlin
- Gradle
- Android environment variables

Provide exact commands where possible.

For Linux development, include appropriate commands such as installation of:

- JDK
- Android Studio/toolchain
- Android SDK
- Kotlin if explicitly required
- Node.js
- pnpm/npm/yarn as appropriate

Do not blindly assume the operating system if it can be detected from the repository/environment.

First inspect the development environment and then tailor commands accordingly.

---

# Backend Environment Setup

The plan should include from-zero setup for:

- Python
- uv
- Django
- Django REST Framework
- SimpleJWT or another appropriate JWT package
- PostgreSQL
- Channels/WebSocket infrastructure
- Uvicorn
- ASGI server
- CORS configuration
- environment variables
- database migrations
- initial superuser
- development server
- production considerations

If Redis is needed for Django Channels at this stage, explain why.

Do not add infrastructure that is unnecessary for a two-user MVP.

---

# LiveKit Integration

Since LiveKit is already running on a VPS, the plan should focus on integrating the backend and mobile app with the existing server.

Determine:

- required LiveKit Python SDK
- token generation
- room creation/joining
- participant identity
- room permissions
- React Native LiveKit packages
- native setup
- audio/video tracks
- connection lifecycle
- reconnect behavior
- call termination
- cleanup

Use current official LiveKit documentation/API patterns rather than relying on outdated examples.

---

# Networking

The plan must clearly distinguish:

```text
HTTP API
WebSocket
WebRTC/LiveKit
```

For example:

```text
React Native
    |
    +---- HTTPS ----> Django REST API
    |
    +---- WSS ------> Django WebSocket
    |
    +---- WebRTC ---> LiveKit
```

Do not route media through Django.

The plan must also discuss:

- local development
- LAN testing
- VPS LiveKit testing
- changing IP addresses
- DNS migration later
- HTTPS/WSS requirements
- secure production configuration

---

# Security

The plan must include security considerations for:

- password hashing
- JWT security
- refresh tokens
- secure token storage
- API authentication
- WebSocket authentication
- LiveKit token generation
- LiveKit API secret protection
- CORS
- CSRF where applicable
- allowed hosts
- rate limiting
- user enumeration
- contact privacy
- call authorization
- room authorization
- WebSocket authorization
- preventing unauthorized room joining
- input validation
- environment secrets
- debug settings
- production configuration

Do not expose secrets in:

- React Native bundle
- Git repository
- `.env.example`
- logs
- API responses

---

# Error Handling

Plan how the app handles:

- invalid login
- expired JWT
- network failure
- backend unavailable
- WebSocket disconnected
- LiveKit connection failure
- user unavailable
- rejected call
- call timeout
- permission denied
- microphone unavailable
- camera unavailable
- app backgrounding
- app terminating
- duplicate calls
- user already in another call

Make the call-state machine explicit enough that race conditions are minimized.

---

# Testing

The plan must include testing at multiple levels.

## Backend

- model tests
- authentication tests
- API tests
- permission tests
- contact tests
- call authorization tests
- WebSocket tests
- LiveKit token generation tests

## Mobile

- component tests where useful
- API hook tests
- Zustand tests
- WebSocket hook tests
- authentication flow tests
- call UI tests
- permission tests

## Integration

At minimum:

```text
User A registers
User B registers
A logs in
B logs in
A adds B as contact
A calls B
B receives incoming call
B accepts
A and B connect to LiveKit
Audio works
Video works
B ends call
A receives termination
```

The plan should define a complete end-to-end test scenario.

---

# Logging and Debugging

Design useful development logging for:

- authentication
- REST requests
- WebSocket events
- call state transitions
- LiveKit connection state
- participant join/leave
- permission status

Avoid logging:

- passwords
- JWT secrets
- LiveKit API secret
- sensitive personal information

Make it possible to disable verbose logging in production.

---

# Configuration Management

Use:

```text
.env
.env.example
.gitignore
```

for both projects.

The plan should clearly document which variables belong where.

For example, determine something similar to:

## React Native

```env
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_WS_URL=
EXPO_PUBLIC_LIVEKIT_URL=
```

## Django

```env
DJANGO_SECRET_KEY=
DEBUG=
ALLOWED_HOSTS=

DATABASE_NAME=name
DATABASE_USERNAME=user
DATABASE_PASSWORD=password
DATABASE_HOST=localhost
DATABASE_PORT=5432

JWT_ACCESS_TOKEN_LIFETIME=
JWT_REFRESH_TOKEN_LIFETIME=

LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
```

But verify naming and requirements before finalizing.

---

# Git / Repository Hygiene

Include:

- `.gitignore`
- `.env.example`
- no committed secrets
- appropriate README
- development setup instructions
- migration instructions
- build instructions
- environment configuration documentation

Do not introduce unnecessary monorepo tooling unless there is a compelling reason.

---

# Important Architectural Constraints

Follow these principles:

### 1. KISS

Prefer simple, understandable architecture.

### 2. Do not over-engineer

This is an MVP.

Do not implement complex microservices, Kubernetes, event buses, Kafka, etc. unless absolutely necessary.

### 3. Keep control and media separate

Django controls the application.

LiveKit handles media.

### 4. Keep remote state separate from local state

TanStack Query should own server state.

Zustand should own global client state.

### 5. Centralize API access

`useAPI.ts` should be the primary abstraction for API communication.

### 6. Centralize WebSocket access

`useWebSocket.ts` should be the primary abstraction for socket interaction.

### 7. Never expose secrets to React Native

Especially:

```text
LIVEKIT_API_SECRET
DJANGO_SECRET_KEY
database credentials
```

### 8. Avoid hardcoding server addresses

API, WebSocket and LiveKit URLs must be configurable.

### 9. Preserve future extensibility

The future addition of Asterisk/PortaOne should be possible through backend provider abstractions rather than rewriting the mobile client.

---

# What You Must Do Before Creating the Plan

Before producing the final plan:

1. Inspect the entire repository structure.
2. Identify whether there is existing code or whether this is truly a blank project.
3. Inspect existing configuration files.
4. Identify operating system and development environment where possible.
5. Identify existing Node.js, npm/pnpm, Python, Java/JDK, Android SDK, Gradle, Kotlin, Expo, etc.
6. Check LiveKit's current React Native/Expo integration requirements.
7. Check current Expo requirements.
8. Check current gluestack UI v5 installation requirements.
9. Check current NativeWind v5 configuration.
10. Check current TanStack Query React Native setup.
11. Check current Zustand setup.
12. Check current Django/DRF/JWT/Channels recommendations.
13. Identify compatibility constraints between all selected versions.
14. Do not rely on outdated tutorials or deprecated packages.
15. Prefer official documentation for framework-specific decisions.

If something is uncertain, explicitly state the uncertainty and recommend the safest current option.

---

# Planning Output Requirements

The final plan must be comprehensive enough that another developer can follow it step-by-step without needing to redesign the architecture.

Organize the plan into sections such as:

1. Project assessment
2. Architecture overview
3. Technology/version decisions
4. Development environment setup
5. Repository/project initialization
6. React Native/Expo configuration
7. gluestack UI setup
8. NativeWind setup
9. Kotlin/native Android setup
10. Django initialization
11. PostgreSQL setup
12. JWT authentication architecture
13. User/account design
14. Contact architecture
15. WebSocket architecture
16. LiveKit architecture
17. Call state machine
18. API architecture
19. `useAPI.ts`
20. `useWebSocket.ts`
21. TanStack Query architecture
22. Zustand architecture
23. Environment configuration
24. Security model
25. Android permissions
26. UI/navigation plan
27. Backend models
28. REST endpoints
29. WebSocket events
30. LiveKit token/room strategy
31. audio/video call flow
32. error handling
33. testing strategy
34. development milestones
35. verification checklist
36. future extensibility toward Asterisk/PortaOne

---

# Include Technical Diagrams

Use Mermaid diagrams where useful.

At minimum provide diagrams for:

### System architecture

```text
React Native
     |
     +---- Django REST API
     |
     +---- Django WebSocket
     |
     +---- LiveKit WebRTC
```

### Authentication flow

```text
Mobile -> Django -> JWT -> Mobile
```

### Contact flow

```text
User A -> search -> User B -> add contact -> accepted
```

### Call flow

```text
A -> Django -> B notification
A/B -> LiveKit
A <---- WebRTC ----> LiveKit <---- WebRTC ----> B
```

### Detailed call state machine

Show:

```text
idle
initiating
ringing
accepted
connecting
connected
ending
ended
rejected
cancelled
failed
```

Adapt the states if necessary.

---

# Development Milestones

Break the implementation into logical phases.

For example:

### Phase 0

Environment and project bootstrap.

### Phase 1

Django authentication.

### Phase 2

React Native authentication.

### Phase 3

Contacts.

### Phase 4

WebSocket infrastructure.

### Phase 5

LiveKit token integration.

### Phase 6

Audio calls.

### Phase 7

Video calls.

### Phase 8

Incoming/outgoing call UX.

### Phase 9

Testing and hardening.

### Phase 10

Production readiness.

Do not assume these exact phases are optimal; refine them.

Each phase should contain:

- objective
- files/components affected
- dependencies
- implementation tasks
- test/verification criteria

---

# Definition of Done

The MVP should be considered complete only when:

- Backend starts successfully.
- Database migrations work.
- User A can register.
- User B can register.
- Both can log in.
- JWT authentication works.
- API requests are authenticated.
- WebSocket authentication works.
- A can search for B.
- A can add B as a contact.
- B appears in A's contact list.
- A cannot call unauthorized users.
- A can initiate an audio call to B.
- B receives the incoming call.
- B can accept.
- Both connect to the same LiveKit room securely.
- Audio works in both directions.
- A can initiate a video call.
- Video works in both directions.
- Mute/unmute works.
- Camera enable/disable works.
- Call rejection works.
- Call cancellation works.
- Call termination works.
- WebSocket reconnect logic does not corrupt call state.
- LiveKit reconnect behavior is handled.
- Secrets are not exposed to the mobile client.
- API/WS/LiveKit URLs can be changed through environment configuration.
- The project can be built from a clean development environment using the documented instructions.

---

# Important Planning Rules

Do NOT start writing implementation code yet.

Do NOT create random files just because they may be useful later.

Do NOT install dependencies blindly.

Do NOT hardcode IP addresses.

Do NOT put LiveKit API secrets in React Native.

Do NOT duplicate server state between TanStack Query and Zustand without a clear reason.

Do NOT make WebSocket and LiveKit responsible for the same state transitions without defining ownership.

Do NOT couple the mobile application directly to Asterisk or PortaOne.

Do NOT implement Asterisk or PortaOne now.

Do NOT use obsolete Expo/React Native/LiveKit instructions.

Do NOT assume Expo Go can run functionality requiring native modules.

Prefer official/current documentation when making version or integration decisions.

---

# Critical Final Instruction

When your planning work is complete:

1. Do NOT immediately implement the project.
2. Tell me explicitly that the plan has been generated.
3. Tell me to **change GitHub Copilot mode to Agent mode**.
4. Tell me to save the generated plan into a Markdown file for review, for example:

```text
docs/ANDROID_SOFTPHONE_IMPLEMENTATION_PLAN.md
```

5. The plan must be written so that after I review and approve it, I can switch to Agent mode and have Copilot execute the plan phase-by-phase.

The Markdown plan should be the authoritative implementation plan for this project.

Do not modify the implementation until the plan has been reviewed and approved.
