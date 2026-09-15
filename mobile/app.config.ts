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
  userInterfaceStyle: "dark",
  icon: branding.appIcon,
  splash: {
    image: branding.splashLogo,
    resizeMode: "contain",
    backgroundColor: "#020617",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.livekitsoftphone.mobile",
  },
  android: {
    package: "com.livekitsoftphone.mobile",
    adaptiveIcon: {
      backgroundColor: "#020617",
      foregroundImage: branding.adaptiveForeground,
      monochromeImage: branding.adaptiveMonochrome,
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: ["expo-router", "expo-secure-store"],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
