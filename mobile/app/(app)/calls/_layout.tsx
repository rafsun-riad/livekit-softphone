import { Stack } from "expo-router";

import { AccountHeaderMenu } from "@/src/components/layout/account-header-menu";
import { appColors, appTypography } from "@/src/theme/app-theme";

export default function CallsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: "#020617",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: appColors.background,
          },
          headerTintColor: appColors.textPrimary,
          headerTitle: "Calls",
          headerTitleStyle: {
            color: appColors.textPrimary,
            fontFamily: appTypography.fontFamily,
            fontSize: 18,
            fontWeight: "700",
          },
          headerRight: () => <AccountHeaderMenu />,
        }}
      />
      <Stack.Screen name="outgoing" />
      <Stack.Screen name="incoming" />
      <Stack.Screen name="audio" />
      <Stack.Screen name="video" />
    </Stack>
  );
}
