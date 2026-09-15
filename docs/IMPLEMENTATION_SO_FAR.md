# Implementation So Far

Status: In progress

Purpose:

- Track completed implementation work.
- Record actual commands run, decisions made, and deviations from the plan.
- Keep this file factual and chronological.

Reference plan:

- See `docs/ANDROID_SOFTPHONE_IMPLEMENTATION_PLAN.md` for the authoritative design and execution plan.

## Current Summary

- Phase 0 environment verification is complete.
- Phase 1 repository bootstrap is complete.
- Phase 2 mobile foundation has started with the initial Expo native-build dependencies.

## Completed Phases

### Phase 0: Environment Verification

Status: Complete

Completed items:

- Verified Node.js, npm, Java, adb, Python, uv, PostgreSQL, and Android SDK presence.
- Installed uv-managed CPython 3.14.6 for the backend target runtime.

Commands run:

- `node -v`
- `npm -v`
- `java -version`
- `printf '%s\n' "$JAVA_HOME"`
- `printf '%s\n' "$ANDROID_HOME"`
- `adb --version`
- `python3 --version`
- `uv --version`
- `uv python list --only-installed`
- `psql --version`
- `uv python install cpython@3.14`

Verified versions and environment notes:

- Node.js `v24.21.0`
- npm `11.19.0`
- Java `21.0.12`
- `adb` `36.0.0`
- System Python `3.12.3`
- `uv` `0.11.28`
- PostgreSQL client `16.15`
- Android SDK directory exists at `$HOME/Android/Sdk`
- uv-managed CPython `3.14.6` installed successfully

Decisions made:

- Keep the requested backend Python target at `cpython@3.14`.
- Defer JDK 25 installation until the Android native build path needs it.

Deviations from plan:

- JDK 25 has not been installed yet because it is not required for the initial repository bootstrap.

Blockers resolved:

- Backend target Python version is now available locally.

### Phase 1: Repository Bootstrap

Status: Complete

Completed items:

- Scaffolded the Expo mobile app in `mobile/` using the blank TypeScript template.
- Installed `expo-dev-client` and `expo-router` into the mobile app.
- Scaffolded the Django backend in `backend/` with uv-managed dependencies.
- Added root repository hygiene files and environment examples.
- Added a minimal backend health endpoint and Django split-settings structure.
- Added a brief Firebase Cloud Messaging implementation guide.

Commands run:

- `npx create-expo-app@latest mobile --template blank-typescript`
- `cd mobile && npx expo install expo-dev-client expo-router`
- `mkdir -p backend && cd backend && uv init --bare --python 3.14`
- `cd backend && uv venv --python cpython@3.14 .venv`
- `cd backend && uv add "django>=6.0,<6.1" "djangorestframework>=3.18,<3.19" "djangorestframework-simplejwt[crypto]" "channels" "uvicorn" "psycopg[binary]" "python-dotenv" "phonenumbers" "livekit-api" "django-cors-headers"`
- `cd backend && uv run django-admin startproject config .`

Files created or updated:

- Root `.gitignore`
- Root `README.md`
- `mobile/` Expo project scaffold
- `backend/` Django project scaffold
- `docs/FIREBASE_CLOUD_MESSAGING_SETUP.md`

Decisions made:

- Start from the stable Expo blank TypeScript template and add native-build dependencies incrementally.
- Convert Django to split settings immediately so later phases do not need a structural migration.

Deviations from plan:

- Expo Router has been installed but not wired as the app entrypoint yet.

Blockers resolved:

- Resolved the interactive `npx` prompt during Expo project creation.

### Phase 2: Mobile Foundation

Status: In progress

Completed items:

- Installed `expo-dev-client`.
- Installed `expo-router`.
- Replaced the default Expo placeholder screen with a project-specific bootstrap screen.

Commands run:

- `cd mobile && npx expo install expo-dev-client expo-router`

Device testing notes:

- Native Android build and real-device install are still pending.

Branding assets configured:

- Environment example file added for public mobile endpoints.

Decisions made:

- Keep the initial mobile source surface minimal until Expo Router wiring and provider setup are added together.

Deviations from plan:

- gluestack UI and NativeWind are still pending.

Blockers resolved:

- None yet.

### Phase 3 and Later

Status: Not started

Notes:

- Record each later phase using the same structure used above.

## Important Decisions Log

Use this section for cross-phase decisions that affect multiple parts of the project.

- Backend development settings now live under `config.settings.dev` with a split-settings package.
- Backend bootstrap uses PostgreSQL-oriented settings from environment variables instead of the Django default SQLite configuration.

## Commands History Summary

Use this section for high-signal commands worth preserving for future reference.

- `uv python install cpython@3.14`
- `npx create-expo-app@latest mobile --template blank-typescript`
- `cd mobile && npx expo install expo-dev-client expo-router`
- `cd backend && uv add "django>=6.0,<6.1" "djangorestframework>=3.18,<3.19" "djangorestframework-simplejwt[crypto]" "channels" "uvicorn" "psycopg[binary]" "python-dotenv" "phonenumbers" "livekit-api" "django-cors-headers"`

## Open Questions Already Answered

Use this section to capture answers that should not be rediscovered later.

- The requested backend baseline can be installed locally on CPython 3.14 with Django 6.0.8 and DRF 3.18.1.

## Last Updated

- Date: 2026-09-15
- Updated by: GitHub Copilot
