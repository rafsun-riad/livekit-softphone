import { Stack } from "expo-router";

import { appColors, appTypography } from "@/src/theme/app-theme";

export default function CallsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: appColors.background,
        },
        headerTintColor: appColors.textPrimary,
        headerTitleStyle: {
          color: appColors.textPrimary,
          fontFamily: appTypography.fontFamily,
          fontWeight: "700",
        },
        contentStyle: {
          backgroundColor: appColors.background,
        },
      }}
    >
      <Stack.Screen name="outgoing" options={{ title: "Outgoing Call" }} />
      <Stack.Screen name="incoming" options={{ title: "Incoming Call" }} />
      <Stack.Screen name="audio" options={{ title: "Audio Call" }} />
      <Stack.Screen name="video" options={{ title: "Video Call" }} />
    </Stack>
  );
}
