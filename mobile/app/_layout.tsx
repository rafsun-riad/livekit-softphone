import "../global.css";

import { RobotoFlex_400Regular } from "@expo-google-fonts/roboto-flex";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { AppProviders } from "@/src/providers/app-providers";
import type { AuthState } from "@/src/stores/auth-store";
import { useAuthStore } from "@/src/stores/auth-store";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const isHydrated = useAuthStore((state: AuthState) => state.isHydrated);
  const [fontsLoaded, fontError] = useFonts({
    RobotoFlex_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded]);

  useEffect(() => {
    void useAuthStore.getState().hydrate();
  }, []);

  if ((!fontsLoaded && !fontError) || !isHydrated) {
    return null;
  }

  return (
    <AppProviders colorMode="dark">
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: "#020617" },
        }}
      />
    </AppProviders>
  );
}
