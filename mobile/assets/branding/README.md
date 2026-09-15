# Branding Assets

Replace the placeholder files in this folder to rebrand the app without changing route code.

## Files

- `app-logo.png`: main app icon source
- `app-logo-adaptive-foreground.png`: Android adaptive icon foreground
- `app-logo-adaptive-monochrome.png`: Android monochrome icon source
- `splash-logo.png`: splash screen logo

## After asset changes

Run these commands so the native project picks up the updated assets:

```bash
cd mobile
npx expo prebuild --clean --platform android
npx expo run:android --device
```
