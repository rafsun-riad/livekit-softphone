import { useState } from "react";

import { router } from "expo-router";
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

export function AccountHeaderMenu() {
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
});
