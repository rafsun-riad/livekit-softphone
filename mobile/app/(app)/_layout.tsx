import { useState } from "react";

import { Redirect, Tabs, router } from "expo-router";
import { MessageSquare, PhoneCall, UsersRound } from "lucide-react-native";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import type { AuthState } from "@/src/stores/auth-store";
import { useAuthStore } from "@/src/stores/auth-store";
import { appColors, appTypography } from "@/src/theme/app-theme";

function getInitials(name: string | null | undefined, phone: string) {
  const source = name?.trim() || phone;
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function MessagesHeaderMenu() {
  const session = useAuthStore((state: AuthState) => state.session);
  const [isOpen, setIsOpen] = useState(false);

  const displayName =
    session?.user.display_name || session?.user.phone_number_normalized || "U";
  const phoneNumber = session?.user.phone_number_normalized || "";

  return (
    <>
      <Pressable
        accessibilityLabel="Open profile menu"
        accessibilityRole="button"
        onPress={() => {
          setIsOpen(true);
        }}
        style={styles.headerAvatarButton}
      >
        <Text style={styles.headerAvatarLabel}>
          {getInitials(displayName, phoneNumber)}
        </Text>
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={() => {
          setIsOpen(false);
        }}
        transparent
        visible={isOpen}
      >
        <Pressable
          onPress={() => {
            setIsOpen(false);
          }}
          style={styles.menuBackdrop}
        >
          <Pressable style={styles.menuCard}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>{displayName}</Text>
              <Text style={styles.menuSubtitle}>{phoneNumber}</Text>
            </View>

            <Pressable
              onPress={() => {
                setIsOpen(false);
                router.push("/(app)/profile");
              }}
              style={styles.menuItem}
            >
              <Text style={styles.menuItemLabel}>Profile</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setIsOpen(false);
                router.push("/(app)/settings");
              }}
              style={styles.menuItem}
            >
              <Text style={styles.menuItemLabel}>Settings</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

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
          headerRight: () => <MessagesHeaderMenu />,
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
  headerAvatarButton: {
    alignItems: "center",
    backgroundColor: appColors.primary,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    marginRight: 10,
    width: 36,
  },
  headerAvatarLabel: {
    color: appColors.primarySoft,
    fontFamily: appTypography.fontFamily,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  menuBackdrop: {
    backgroundColor: "rgba(2, 6, 23, 0.32)",
    flex: 1,
  },
  menuCard: {
    backgroundColor: appColors.surfaceStrong,
    borderColor: appColors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginLeft: "auto",
    marginRight: 16,
    marginTop: 60,
    padding: 8,
    width: 220,
  },
  menuHeader: {
    borderBottomColor: appColors.border,
    borderBottomWidth: 1,
    marginBottom: 6,
    paddingBottom: 10,
    paddingHorizontal: 10,
    paddingTop: 6,
  },
  menuTitle: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  menuSubtitle: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 12,
    lineHeight: 18,
  },
  menuItem: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  menuItemLabel: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    fontWeight: "700",
  },
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
