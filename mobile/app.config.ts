const branding = {
  appIcon: "./assets/branding/app-logo.png",
  adaptiveForeground: "./assets/branding/app-logo-adaptive-foreground.png",
  adaptiveMonochrome: "./assets/branding/app-logo-adaptive-monochrome.png",
  splashLogo: "./assets/branding/splash-logo.png",
};

const config = {
  name: "LiveKit Softphone",
  slug: "livekit-softphone",
  version: "1.0.0",
  orientation: "portrait",
  backgroundColor: "#020617",
  userInterfaceStyle: "dark",
  icon: branding.appIcon,
  splash: {
    image: branding.splashLogo,
    resizeMode: "contain",
    backgroundColor: "#020617",
  },
  ios: {
    backgroundColor: "#020617",
    supportsTablet: true,
    bundleIdentifier: "com.livekitsoftphone.mobile",
  },
  android: {
    backgroundColor: "#020617",
    package: "com.livekitsoftphone.mobile",
    googleServicesFile: "./google-services.json",
    adaptiveIcon: {
      backgroundColor: "#020617",
      foregroundImage: branding.adaptiveForeground,
      monochromeImage: branding.adaptiveMonochrome,
    },
    predictiveBackGestureEnabled: false,
    softwareKeyboardLayoutMode: "resize",
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "expo-notifications",
      {
        color: "#22d3ee",
        defaultChannel: "incoming-calls",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
