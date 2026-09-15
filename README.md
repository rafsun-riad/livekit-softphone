# LiveKit Softphone

Android-first softphone MVP built with Expo, React Native, TypeScript, Django, DRF, Channels, PostgreSQL, and LiveKit.

## Current Status

- Phase 0 environment verification completed.
- Phase 1 repository bootstrap completed.
- Phase 2 mobile foundation started.

## Project Layout

```text
livekit-softphone/
  backend/
  mobile/
  docs/
```

## Quick Start

### Mobile

```bash
cd mobile
npm install
npm run start
```

### Backend

```bash
cd backend
uv sync
uv run python manage.py check
```

## Documentation

- Authoritative plan: `docs/ANDROID_SOFTPHONE_IMPLEMENTATION_PLAN.md`
- Implementation log: `docs/IMPLEMENTATION_SO_FAR.md`
- Remaining work tracker: `docs/REMAINING_IMPLEMENTATION.md`
- Firebase setup guide: `docs/FIREBASE_CLOUD_MESSAGING_SETUP.md`
- Mobile USB build guide: `docs/MOBILE_USB_BUILD_AND_RUN_GUIDE.md`
