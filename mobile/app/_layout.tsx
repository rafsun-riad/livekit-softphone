import "../global.css";

import { RobotoFlex_400Regular } from "@expo-google-fonts/roboto-flex";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCurrentUser } from "@/src/features/auth/api";
import { getAPIErrorMessage } from "@/src/lib/api/client";
import { AppProviders } from "@/src/providers/app-providers";
import type { AuthState } from "@/src/stores/auth-store";
import { useAuthStore } from "@/src/stores/auth-store";
import { appColors, appTypography } from "@/src/theme/app-theme";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const isHydrated = useAuthStore((state: AuthState) => state.isHydrated);
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);
  const [isBootstrapReady, setIsBootstrapReady] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
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

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    let isActive = true;

    async function bootstrapSession() {
      const { session, setUser } = useAuthStore.getState();
      if (!session) {
        setBootstrapError(null);
        setIsBootstrapReady(true);
        return;
      }

      setIsBootstrapReady(false);
      setBootstrapError(null);

      try {
        const user = await getCurrentUser();
        if (!isActive) {
          return;
        }

        await setUser(user);
        setIsBootstrapReady(true);
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (!useAuthStore.getState().session) {
          setBootstrapError(null);
          setIsBootstrapReady(true);
          return;
        }

        setBootstrapError(getAPIErrorMessage(error));
      }
    }

    void bootstrapSession();

    return () => {
      isActive = false;
    };
  }, [bootstrapAttempt, isHydrated]);

  if ((!fontsLoaded && !fontError) || !isHydrated) {
    return null;
  }

  if (!isBootstrapReady) {
    return (
      <View
        style={{
          alignItems: "center",
          backgroundColor: appColors.background,
          flex: 1,
          justifyContent: "center",
          paddingHorizontal: 28,
        }}
      >
        {bootstrapError ? (
          <>
            <Text
              style={{
                color: appColors.textPrimary,
                fontFamily: appTypography.fontFamily,
                fontSize: 20,
                fontWeight: "700",
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              Couldn’t restore your session
            </Text>
            <Text
              style={{
                color: appColors.textSecondary,
                fontFamily: appTypography.fontFamily,
                fontSize: 15,
                lineHeight: 22,
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              {bootstrapError}
            </Text>
            <Pressable
              onPress={() => setBootstrapAttempt((attempt) => attempt + 1)}
              style={{
                backgroundColor: appColors.primary,
                borderRadius: 16,
                paddingHorizontal: 22,
                paddingVertical: 14,
              }}
            >
              <Text
                style={{
                  color: appColors.primarySoft,
                  fontFamily: appTypography.fontFamily,
                  fontSize: 15,
                  fontWeight: "700",
                }}
              >
                Retry
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <ActivityIndicator color={appColors.cyan} size="large" />
            <Text
              style={{
                color: appColors.textSecondary,
                fontFamily: appTypography.fontFamily,
                fontSize: 15,
                marginTop: 18,
              }}
            >
              Restoring your session…
            </Text>
          </>
        )}
      </View>
    );
  }

  return (
    <AppProviders colorMode="dark">
      <StatusBar style="light" />
      <SafeAreaView
        edges={["top", "bottom", "left", "right"]}
        style={{ flex: 1, backgroundColor: "#020617" }}
      >
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
            contentStyle: { backgroundColor: "#020617" },
          }}
        />
      </SafeAreaView>
    </AppProviders>
  );
}
