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
- Phase 2 is complete in code and awaiting final hardware reconfirmation only.
- Phase 3 is complete in code and awaiting final hardware reconfirmation only.
- Phase 4 is complete.
- Phase 5 is complete in code and awaiting final hardware reconfirmation only.
- Phase 6 is complete in code and awaiting final hardware reconfirmation only.
- Phases 7 through 12 are implemented in code and now primarily blocked on final build and manual validation.

## Next Immediate Actions

1. Finish the current Android debug assemble validation and confirm the generated build installs and launches cleanly with the new LiveKit, CallKeep, and Notifee dependencies.
2. Manually validate the end-to-end call lifecycle across two signed-in Android devices: outgoing call, incoming call, accept, reject, cancel, end, busy, and timeout.
3. Manually validate real audio and video media flow, runtime camera and microphone permission prompts, and background or terminated incoming-call handling on hardware.

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

Status: Complete in code

Remaining tasks:

- Reconfirm the regenerated Android project installs and launches on hardware after the new native calling dependencies are added.

Dependencies:

- Phase 1 mobile scaffold complete.

### Phase 3: Native Calling Foundation

Status: Complete in code

Remaining tasks:

- Confirm the current native dependency set assembles cleanly and behaves correctly on hardware.

Dependencies:

- Phase 2 complete.

### Phase 4: Backend Foundation

Status: Complete

Remaining tasks:

- None.

Dependencies:

- Phase 1 backend scaffold complete.

### Phase 5: Authentication

Status: Complete in code

Remaining tasks:

- Reconfirm the secure session flow on the current Android device while testing background call actions.

Dependencies:

- Phase 4 complete.

### Phase 6 to Phase 12

Status: Mixed

### Phase 6: Contacts and Search

Status: Complete in code

Remaining tasks:

- Reconfirm the contacts and directory flow on hardware as part of the two-device call validation path.

Dependencies:

- Phase 5 mobile auth flow remains active and stable.

### Phase 7 to Phase 12

Status: Implemented in code

Remaining tasks:

- Final build validation, real-device verification, and bug-fix follow-up only.

Dependencies:

- Earlier phases complete.

## Active Blockers

- The feature implementation blockers are cleared in code. The remaining blockers are final Android native assemble confirmation and two-device hardware validation.

## Risks To Re-check During Execution

- SimpleJWT may still lag behind the requested backend stack.
- Expo Android build may still require JDK 17 instead of JDK 25.
- Real-device calling behavior cannot be signed off on emulator-only testing.
- Cloudflare Tunnel is development-only and must not be treated as production hosting.

## Deferred Decisions

- Whether Java 25 is fully usable for the Android build path.
- Whether a preview APK profile is needed beyond the direct USB development-build workflow.
- Whether additional theming variants are needed for the splash and launcher assets.
- Whether to keep the current root `app/` Expo Router structure or later move routes under `src/app/`.
- Whether Expo Router typed-route generation will later recognize the new sibling app routes without relying on relative href strings.

## Last Updated

- Date: 2026-09-16
- Updated by: GitHub Copilot
