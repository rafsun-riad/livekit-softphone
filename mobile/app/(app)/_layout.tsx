import { Redirect, Tabs } from "expo-router";
import { MessageSquare, PhoneCall, UsersRound } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import type { AuthState } from "@/src/stores/auth-store";
import { useAuthStore } from "@/src/stores/auth-store";
import { appColors, appTypography } from "@/src/theme/app-theme";

export default function AppLayout() {
  const isHydrated = useAuthStore((state: AuthState) => state.isHydrated);
  const session = useAuthStore((state: AuthState) => state.session);

  if (!isHydrated) {
    return null;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: appColors.background,
        },
        headerTintColor: appColors.textPrimary,
        headerTitleStyle: {
          color: appColors.textPrimary,
          fontFamily: appTypography.fontFamily,
          fontSize: 18,
          fontWeight: "700",
        },
        sceneStyle: {
          backgroundColor: appColors.background,
        },
        tabBarActiveTintColor: appColors.primarySoft,
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: appColors.textSecondary,
        tabBarLabelStyle: {
          fontFamily: appTypography.fontFamily,
          fontSize: 12,
          fontWeight: "700",
        },
        tabBarStyle: {
          backgroundColor: "#081120",
          borderTopColor: appColors.border,
          height: 74,
          paddingBottom: 10,
          paddingTop: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
              <MessageSquare color={color} size={18} strokeWidth={2.4} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{
          title: "Calls",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
              <PhoneCall color={color} size={18} strokeWidth={2.4} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: "Contacts",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
              <UsersRound color={color} size={18} strokeWidth={2.4} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: null,
          title: "Search",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          title: "Profile",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
          title: "Settings",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    alignItems: "center",
    borderRadius: 12,
    height: 34,
    justifyContent: "center",
    width: 42,
  },
  tabIconFocused: {
    backgroundColor: appColors.primary,
  },
});
