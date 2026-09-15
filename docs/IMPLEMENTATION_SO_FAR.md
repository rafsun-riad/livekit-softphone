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
- Phase 2 mobile foundation is functionally complete in code and verified through Android export and prebuild, with only real-device install validation still pending.
- Phase 4 backend foundation is complete with the custom user model, core domain models, generated migrations, and a successful PostgreSQL migration run.
- Phase 5 authentication is in progress with working backend auth endpoints and the first mobile secure-session flow.

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
- `docs/MOBILE_USB_BUILD_AND_RUN_GUIDE.md`

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
- Switched the mobile entrypoint to Expo Router.
- Added route groups and placeholder screens for the auth flow and app shell.
- Completed gluestack UI and NativeWind setup and verified it through Expo export.
- Added shared app providers, font loading, icon support, and secure-store plugin wiring.
- Added a dedicated branding asset structure under `mobile/assets/branding/`.
- Moved Expo configuration into `mobile/app.config.ts`.
- Generated the Android native project with `expo prebuild` and verified Gradle and Java runtime.
- Added a step-by-step USB build and real-device run guide for the mobile app.

Commands run:

- `cd mobile && npx expo install expo-dev-client expo-router`
- `cd mobile && npx tsc --noEmit`
- `cd mobile && npx --yes gluestack-ui@latest init --projectType app --nativewind-v5 --use-npm --path src/components/ui -y`
- `cd mobile && npm install -D babel-preset-expo`
- `cd mobile && npx expo install expo-linking react-dom react-native-web expo-font expo-splash-screen expo-system-ui expo-secure-store`
- `cd mobile && npm install @expo-google-fonts/roboto-flex lucide-react-native @tanstack/react-query zustand`
- `cd mobile && npx expo export --platform android`
- `cd mobile && npx expo prebuild --platform android --no-install`
- `cd mobile/android && ./gradlew -version`

Device testing notes:

- Native Android build and real-device install are still pending.
- Local native generation passed without requiring a JDK switch away from Java 21.

Branding assets configured:

- Environment example file added for public mobile endpoints.
- Placeholder brand assets now live under `mobile/assets/branding/` and are wired through `mobile/app.config.ts`.

Decisions made:

- Keep the initial mobile source surface minimal until Expo Router wiring and provider setup are added together.
- Use the default root `app/` Expo Router structure now rather than delaying route setup.
- Keep brand assets replaceable through a dedicated folder plus dynamic Expo config.
- Use `RobotoFlex_400Regular` as the initial shared app font until additional weights are introduced.

Deviations from plan:

- The gluestack CLI stalled during cloning, so the final integration required manual cleanup of the generated config and dependency graph.

Blockers resolved:

- None yet.
- Resolved the NativeWind and gluestack verification issues around Babel, CSS imports, Expo Router integration, and missing peer dependencies.

### Phase 4: Backend Foundation

Status: Complete

Completed items:

- Added the planned Django app package structure under `backend/apps/`.
- Wired `apps.accounts`, `apps.contacts`, `apps.devices`, and `apps.calls` into Django settings.
- Added a UUID-based custom user model with phone and email normalization.
- Added reusable abstract UUID base models.
- Added concrete models for contacts, devices, calls, and call events.
- Generated initial migrations for `accounts`, `contacts`, `devices`, and `calls`.
- Successfully applied Django migrations against PostgreSQL.

Commands run:

- `cd backend && uv run python manage.py check`
- `cd backend && uv run python manage.py makemigrations accounts`
- `cd backend && uv run python manage.py makemigrations contacts devices calls`
- `cd backend && uv run python manage.py migrate`

Files created or updated:

- `backend/apps/common/models.py`
- `backend/apps/accounts/models.py`
- `backend/apps/accounts/admin.py`
- `backend/apps/contacts/models.py`
- `backend/apps/devices/models.py`
- `backend/apps/calls/models.py`
- `backend/apps/**/migrations/0001_initial.py`
- `backend/config/settings/base.py`

Decisions made:

- Use `phone_number_normalized` as the Django `USERNAME_FIELD` for the custom user model.
- Enforce UUID primary keys and model-level integrity constraints in the first migration set.

Deviations from plan:

- The device-session auth model is still deferred to the authentication phase.

Blockers resolved:

- PostgreSQL connectivity and migration execution are confirmed working for the backend.

### Phase 5: Authentication

Status: In progress

Completed items:

- Added a revocable `DeviceSession` model to support durable signed-in mobile sessions.
- Implemented backend `register`, `login`, `refresh`, and `logout` endpoints.
- Implemented backend `GET /api/users/me/` for authenticated profile fetch.
- Added backend auth tests covering registration, device-session refresh, logout revocation, and current-user fetch.
- Installed mobile auth dependencies for secure storage, query state, and persisted session state.
- Added a mobile auth store backed by `expo-secure-store`.
- Added a mobile API client, auth API module, and authenticated request helper with silent refresh on `401`.
- Replaced placeholder auth screens with functional register, login, and logout flows.

Commands run:

- `cd backend && uv run python manage.py makemigrations accounts`
- `cd backend && uv run python manage.py test apps.accounts`
- `cd mobile && npx expo install expo-secure-store`
- `cd mobile && npm install @tanstack/react-query zustand`
- `cd mobile && npx tsc --noEmit`
- `cd mobile && npx expo export --platform android`

Files created or updated:

- `backend/apps/accounts/models.py`
- `backend/apps/accounts/serializers.py`
- `backend/apps/accounts/views.py`
- `backend/apps/accounts/urls.py`
- `backend/apps/accounts/user_urls.py`
- `backend/apps/accounts/tests.py`
- `mobile/src/config/env.ts`
- `mobile/src/lib/api/client.ts`
- `mobile/src/features/auth/api.ts`
- `mobile/src/features/auth/types.ts`
- `mobile/src/stores/auth-store.ts`
- `mobile/src/components/auth/auth-field.tsx`
- `mobile/app/(auth)/login.tsx`
- `mobile/app/(auth)/register.tsx`
- `mobile/app/(app)/index.tsx`

Decisions made:

- Model signed-in persistence with a first-party device session token separate from JWT access tokens.
- Use secure storage plus Zustand hydration to restore the signed-in session on app launch.
- Implement silent access-token refresh in the mobile authenticated request helper before broader API work.

Deviations from plan:

- The mobile auth flow currently uses the session user summary and `GET /api/users/me/` but does not yet include a full `useAPI.ts` abstraction layer.

Blockers resolved:

- Backend auth endpoints and the first mobile auth flow are both validated end to end in local checks.

### Phase 3 and Later

Status: Not started

Notes:

- Record each later phase using the same structure used above.

## Important Decisions Log

Use this section for cross-phase decisions that affect multiple parts of the project.

- Backend development settings now live under `config.settings.dev` with a split-settings package.
- Backend bootstrap uses PostgreSQL-oriented settings from environment variables instead of the Django default SQLite configuration.
- Expo Router is now the active mobile entry architecture.
- PostgreSQL connectivity is confirmed by a successful `manage.py migrate` run.
- Android prebuild works locally with Gradle `9.3.1`, Kotlin `2.2.21`, and Java `21.0.12`.
- The project now has a working first-party device-session auth flow across backend and mobile.

## Commands History Summary

Use this section for high-signal commands worth preserving for future reference.

- `uv python install cpython@3.14`
- `npx create-expo-app@latest mobile --template blank-typescript`
- `cd mobile && npx expo install expo-dev-client expo-router`
- `cd mobile && npx tsc --noEmit`
- `cd backend && uv add "django>=6.0,<6.1" "djangorestframework>=3.18,<3.19" "djangorestframework-simplejwt[crypto]" "channels" "uvicorn" "psycopg[binary]" "python-dotenv" "phonenumbers" "livekit-api" "django-cors-headers"`
- `cd backend && uv run python manage.py makemigrations accounts`
- `cd backend && uv run python manage.py makemigrations contacts devices calls`
- `cd backend && uv run python manage.py migrate`
- `cd backend && uv run python manage.py test apps.accounts`
- `cd mobile && npx expo prebuild --platform android --no-install`
- `cd mobile/android && ./gradlew -version`

## Open Questions Already Answered

Use this section to capture answers that should not be rediscovered later.

- The requested backend baseline can be installed locally on CPython 3.14 with Django 6.0.8 and DRF 3.18.1.
- The local PostgreSQL configuration is valid enough for Django migrations to run successfully.
- Expo Router, NativeWind, and gluestack can coexist in this repository once the generated config is cleaned up and missing peers are installed.

## Last Updated

- Date: 2026-09-15
- Updated by: GitHub Copilot
