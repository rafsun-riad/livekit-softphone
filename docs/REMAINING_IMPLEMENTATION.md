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

## Next Immediate Actions

1. Wire Expo Router as the mobile entry architecture and add the first app layout files.
2. Add gluestack UI v5 and NativeWind v5.
3. Run the first Android native development build check.
4. Create the PostgreSQL database and backend `.env` file.
5. Start the backend settings, app, and model foundation for accounts, contacts, devices, and calls.

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

- Wire Expo Router as the actual app entrypoint.
- Install gluestack UI v5 and NativeWind v5.
- Configure icon library and fonts.
- Define splash and app-logo asset structure.
- Confirm real Android phone installation over USB.
- Confirm debug APK generation path and install workflow.

Dependencies:

- Phase 1 mobile scaffold complete.

### Phase 3: Native Calling Foundation

Status: Pending

Remaining tasks:

- Integrate LiveKit native dependencies.
- Integrate Firebase Messaging.
- Integrate CallKeep.
- Integrate Notifee.
- Validate first real-device native build.

Dependencies:

- Phase 2 complete.

### Phase 4: Backend Foundation

Status: Pending

Remaining tasks:

- Create Django settings split.
- Configure PostgreSQL.
- Add custom user model.
- Add ASGI, Channels, and base apps.

Dependencies:

- Phase 1 backend scaffold complete.

### Phase 5: Authentication

Status: Pending

Remaining tasks:

- Validate SimpleJWT compatibility on Python 3.14 + Django 6.0 + DRF 3.18.
- If compatible, implement auth flow.
- If not compatible, stop and revise the auth dependency choice.

Dependencies:

- Phase 4 complete.

### Phase 6 to Phase 12

Status: Pending

Remaining tasks:

- Contacts and search
- WebSocket and presence
- LiveKit join flow
- Audio calling
- Video calling
- Background and terminated incoming calls
- Hardening and final verification

Dependencies:

- Earlier phases complete.

## Active Blockers

- No active blockers, but Android build validation has not started yet.

## Risks To Re-check During Execution

- SimpleJWT may still lag behind the requested backend stack.
- Expo Android build may still require JDK 17 instead of JDK 25.
- Real-device calling behavior cannot be signed off on emulator-only testing.
- Cloudflare Tunnel is development-only and must not be treated as production hosting.

## Deferred Decisions

- Whether Java 25 is fully usable for the Android build path.
- Whether a preview APK profile is needed beyond the direct USB development-build workflow.
- Whether additional theming variants are needed for the splash and launcher assets.
- Whether Expo Router should live under `app/` immediately or be introduced together with the planned `src/app/` structure.

## Last Updated

- Date: 2026-09-15
- Updated by: GitHub Copilot
