# Remaining Implementation

Status: Active planning tracker

Purpose:

- Track the remaining work to complete the project.
- Keep next actions, blockers, and phase priorities visible.
- Update this file after every completed phase.

Reference plan:

- See `docs/ANDROID_SOFTPHONE_IMPLEMENTATION_PLAN.md` for the authoritative design and execution plan.

## Current Overall State

- Implementation has not started yet.
- All planned phases remain pending.

## Next Immediate Actions

1. Review and approve `docs/ANDROID_SOFTPHONE_IMPLEMENTATION_PLAN.md`.
2. Verify environment readiness on the development machine.
3. Install uv-managed CPython 3.14.
4. Decide whether Android builds run successfully on Java 25 or should temporarily use Java 17.
5. Bootstrap the `mobile/` and `backend/` projects.

## Remaining Phases

### Phase 0: Environment Verification

Status: Pending

Remaining tasks:

- Verify Node, npm, Java, adb, uv, Python, and PostgreSQL.
- Install JDK 25 if desired target runtime is not already present.
- Install uv-managed CPython 3.14.
- Confirm Android SDK and real-device USB debugging workflow.

Dependencies:

- None.

Known risks:

- Android build may still need JDK 17 even if Java 25 is installed.

### Phase 1: Repository Bootstrap

Status: Pending

Remaining tasks:

- Scaffold `mobile/` with Expo.
- Scaffold `backend/` with Django and uv.
- Add repository hygiene files.

Dependencies:

- Phase 0 complete.

### Phase 2: Mobile Foundation

Status: Pending

Remaining tasks:

- Configure Expo development build.
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

- No active implementation blockers yet.

## Risks To Re-check During Execution

- SimpleJWT may still lag behind the requested backend stack.
- Expo Android build may still require JDK 17 instead of JDK 25.
- Real-device calling behavior cannot be signed off on emulator-only testing.
- Cloudflare Tunnel is development-only and must not be treated as production hosting.

## Deferred Decisions

- Whether Java 25 is fully usable for the Android build path.
- Whether a preview APK profile is needed beyond the direct USB development-build workflow.
- Whether additional theming variants are needed for the splash and launcher assets.

## Last Updated

- Date: Not updated yet
- Updated by: Not updated yet
