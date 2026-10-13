import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import {
  BadgePlus,
  ChevronRight,
  Search,
  ShieldCheck,
  UsersRound,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppScrollScreen } from "@/src/components/layout/app-scroll-screen";
import { getCurrentUser } from "@/src/features/auth/api";
import { buildActiveCallRoute } from "@/src/features/calls/routes";
import { getAPIErrorMessage } from "@/src/lib/api/client";
import { useAuthStore } from "@/src/stores/auth-store";
import { useCallStore } from "@/src/stores/call-store";
import { appColors, appTypography } from "@/src/theme/app-theme";

function getDisplayIdentity(name: string | null | undefined, phone: string) {
  return name?.trim() || phone;
}

function getInitials(name: string | null | undefined, phone: string) {
  const source = name?.trim() || phone;
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export default function MessagesScreen() {
  const session = useAuthStore((state) => state.session);
  const activeCall = useCallStore((state) => state.activeCall);
  const socketStatus = useCallStore((state) => state.socketStatus);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const activeCallCounterpart =
    activeCall && session
      ? activeCall.initiator.id === session.user.id
        ? activeCall.recipient
        : activeCall.initiator
      : null;

  const meQuery = useQuery({
    enabled: Boolean(session),
    queryFn: ({ signal }) => getCurrentUser({ signal }),
    queryKey: ["me"],
  });

  const displayName =
    meQuery.data?.display_name ||
    session?.user.display_name ||
    session?.user.phone_number_normalized ||
    "Unknown";
  const phoneNumber =
    meQuery.data?.phone_number_normalized ||
    session?.user.phone_number_normalized ||
    "";

  return (
    <AppScrollScreen contentContainerStyle={styles.content}>
      <View style={styles.topBarWrap}>
        <View style={styles.topBar}>
          <View style={styles.topBarCopy}>
            <Text style={styles.topBarTitle}>Messages</Text>
            <Text style={styles.topBarSubtitle}>Your communication hub</Text>
          </View>
          <Pressable
            accessibilityLabel="Open account menu"
            accessibilityRole="button"
            onPress={() => {
              setIsAccountMenuOpen((value) => !value);
            }}
            style={styles.avatarButton}
          >
            <Text style={styles.avatarLabel}>
              {getInitials(displayName, phoneNumber)}
            </Text>
          </Pressable>
        </View>

        {isAccountMenuOpen ? (
          <View style={styles.accountMenu}>
            <View style={styles.accountMenuHeader}>
              <Text style={styles.accountMenuTitle}>
                {getDisplayIdentity(displayName, phoneNumber)}
              </Text>
              <Text style={styles.accountMenuSubtitle}>{phoneNumber}</Text>
            </View>

            <Pressable
              onPress={() => {
                setIsAccountMenuOpen(false);
                router.push("/(app)/profile");
              }}
              style={styles.accountMenuItem}
            >
              <Text style={styles.accountMenuItemLabel}>Profile</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setIsAccountMenuOpen(false);
                router.push("/(app)/settings");
              }}
              style={styles.accountMenuItem}
            >
              <Text style={styles.accountMenuItemLabel}>Settings</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroRow}>
          <View style={styles.heroIcon}>
            <BadgePlus
              color={appColors.actionDarkText}
              size={24}
              strokeWidth={2.2}
            />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.label}>Conversation list</Text>
            <Text style={styles.title}>
              Your message inbox is ready for wiring
            </Text>
          </View>
        </View>
        <Text style={styles.body}>
          Signed in as {displayName}. The Messages tab now matches the approved
          shell structure and keeps account routes behind the avatar menu while
          messaging backend work is still ahead.
        </Text>
      </View>

      <View style={styles.callout}>
        <ShieldCheck color={appColors.cyanSoft} size={18} strokeWidth={2.2} />
        <Text style={styles.calloutText}>
          Startup restore, silent refresh, call routing, contacts, and account
          routes are active. Conversation data and delivery are the next
          messaging milestones.
        </Text>
      </View>

      <View style={styles.realtimeCard}>
        <Text style={styles.realtimeTitle}>Realtime signaling</Text>
        <Text style={styles.realtimeBody}>Socket status: {socketStatus}</Text>
        {activeCall ? (
          <Link href={buildActiveCallRoute(activeCall)} asChild>
            <Pressable style={styles.activeCallLink}>
              <View style={styles.navCopy}>
                <Text style={styles.navTitle}>Return to active call</Text>
                <Text style={styles.navBody}>
                  {activeCall.call_type} call with{" "}
                  {activeCallCounterpart?.display_name ||
                    activeCallCounterpart?.phone_number_normalized}
                </Text>
              </View>
              <ChevronRight
                color={appColors.textSecondary}
                size={18}
                strokeWidth={2.2}
              />
            </Pressable>
          </Link>
        ) : null}
      </View>

      <View style={styles.navGrid}>
        <Link href="./contacts" asChild>
          <Pressable style={styles.navCard}>
            <UsersRound
              color={appColors.primarySoft}
              size={20}
              strokeWidth={2.2}
            />
            <View style={styles.navCopy}>
              <Text style={styles.navTitle}>Contacts</Text>
              <Text style={styles.navBody}>
                See callable users and manage the list.
              </Text>
            </View>
            <ChevronRight
              color={appColors.textSecondary}
              size={18}
              strokeWidth={2.2}
            />
          </Pressable>
        </Link>

        <Link href="./search" asChild>
          <Pressable style={styles.navCard}>
            <Search color={appColors.primarySoft} size={20} strokeWidth={2.2} />
            <View style={styles.navCopy}>
              <Text style={styles.navTitle}>Add contact</Text>
              <Text style={styles.navBody}>
                Search registered users and grow your callable contacts.
              </Text>
            </View>
            <ChevronRight
              color={appColors.textSecondary}
              size={18}
              strokeWidth={2.2}
            />
          </Pressable>
        </Link>
      </View>

      {meQuery.isError ? (
        <Text style={styles.errorText}>
          {getAPIErrorMessage(meQuery.error)}
        </Text>
      ) : null}
    </AppScrollScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    backgroundColor: appColors.background,
  },
  topBarWrap: {
    marginBottom: 18,
    position: "relative",
    zIndex: 10,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  topBarCopy: {
    flex: 1,
    marginRight: 16,
  },
  topBarTitle: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 38,
  },
  topBarSubtitle: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  avatarButton: {
    alignItems: "center",
    backgroundColor: appColors.primary,
    borderColor: appColors.border,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  avatarLabel: {
    color: appColors.primarySoft,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  accountMenu: {
    backgroundColor: appColors.surfaceStrong,
    borderColor: appColors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 12,
    marginLeft: "auto",
    padding: 8,
    width: 220,
  },
  accountMenuHeader: {
    borderBottomColor: appColors.border,
    borderBottomWidth: 1,
    marginBottom: 6,
    paddingBottom: 10,
    paddingHorizontal: 10,
    paddingTop: 6,
  },
  accountMenuTitle: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  accountMenuSubtitle: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 12,
    lineHeight: 18,
  },
  accountMenuItem: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  accountMenuItemLabel: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    fontWeight: "700",
  },
  heroCard: {
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 18,
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  heroRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    marginBottom: 18,
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: appColors.actionDark,
    borderRadius: 20,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  heroCopy: {
    flex: 1,
  },
  label: {
    color: appColors.amber,
    fontFamily: appTypography.fontFamily,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  title: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 38,
  },
  body: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 360,
  },
  callout: {
    alignItems: "center",
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  calloutText: {
    color: appColors.textMuted,
    flex: 1,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
  },
  navGrid: {
    gap: 12,
    marginBottom: 20,
  },
  realtimeCard: {
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  realtimeTitle: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  realtimeBody: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
  },
  activeCallLink: {
    alignItems: "center",
    backgroundColor: appColors.surfaceStrong,
    borderColor: appColors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  navCard: {
    alignItems: "center",
    backgroundColor: appColors.surfaceStrong,
    borderColor: appColors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  navCopy: {
    flex: 1,
  },
  navTitle: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  navBody: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 13,
    lineHeight: 19,
  },
  errorText: {
    color: "#fca5a5",
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  action: {
    backgroundColor: appColors.actionDark,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  disabledAction: {
    opacity: 0.65,
  },
  actionLabel: {
    color: appColors.actionDarkText,
    fontFamily: appTypography.fontFamily,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
});
