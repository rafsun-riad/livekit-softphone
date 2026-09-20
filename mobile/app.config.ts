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
    infoPlist: {
      NSCameraUsageDescription:
        "LiveKit Softphone uses the camera during video calls.",
      NSMicrophoneUsageDescription:
        "LiveKit Softphone uses the microphone during calls.",
    },
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
    permissions: [
      "android.permission.ACCESS_NETWORK_STATE",
      "android.permission.CAMERA",
      "android.permission.CHANGE_NETWORK_STATE",
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_CAMERA",
      "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
      "android.permission.FOREGROUND_SERVICE_MICROPHONE",
      "android.permission.MODIFY_AUDIO_SETTINGS",
      "android.permission.POST_NOTIFICATIONS",
      "android.permission.RECORD_AUDIO",
      "android.permission.USE_FULL_SCREEN_INTENT",
    ],
    softwareKeyboardLayoutMode: "resize",
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    "./plugins/with-notifee-android",
    [
      "@livekit/react-native-expo-plugin",
      {
        android: {
          audioType: "communication",
        },
        ios: {
          enableMultitaskingCameraAccess: false,
        },
      },
    ],
    "@config-plugins/react-native-webrtc",
    "expo-secure-store",
    [
      "expo-notifications",
      {
        defaultChannel: "incoming-calls",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
