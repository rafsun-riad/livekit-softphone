import { useMutation } from "@tanstack/react-query";
import { Link } from "expo-router";
import { ArrowLeft, LogOut, Server, ShieldCheck } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppScrollScreen } from "@/src/components/layout/app-scroll-screen";
import { env } from "@/src/config/env";
import { logout } from "@/src/features/auth/api";
import { getAPIErrorMessage } from "@/src/lib/api/client";
import type { AuthState } from "@/src/stores/auth-store";
import { useAuthStore } from "@/src/stores/auth-store";
import { appColors, appTypography } from "@/src/theme/app-theme";

export default function SettingsScreen() {
  const clearSession = useAuthStore((state: AuthState) => state.clearSession);
  const session = useAuthStore((state: AuthState) => state.session);

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      await clearSession();
    },
  });

  return (
    <AppScrollScreen contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.heroRow}>
          <View style={styles.heroIcon}>
            <Server color={appColors.primarySoft} size={22} strokeWidth={2.2} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.kicker}>Settings</Text>
            <Text style={styles.title}>Environment and session controls</Text>
          </View>
        </View>
        <Text style={styles.body}>
          Keep the signed-in device session stable, inspect current endpoints,
          and sign out cleanly when needed.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <ShieldCheck color={appColors.cyanSoft} size={18} strokeWidth={2.2} />
          <Text style={styles.sectionTitle}>Active session</Text>
        </View>
        <Text style={styles.metaRow}>
          User:{" "}
          {session?.user.display_name ||
            session?.user.phone_number_normalized ||
            "Unknown"}
        </Text>
        <Text style={styles.metaRow}>Environment: {env.appEnv}</Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Configured endpoints</Text>
        <Text style={styles.metaLabel}>API</Text>
        <Text style={styles.metaValue}>{env.apiUrl || "Not configured"}</Text>
        <Text style={styles.metaLabel}>WebSocket</Text>
        <Text style={styles.metaValue}>{env.wsUrl || "Not configured"}</Text>
        <Text style={styles.metaLabel}>LiveKit</Text>
        <Text style={styles.metaValue}>
          {env.livekitUrl || "Not configured"}
        </Text>
      </View>

      {logoutMutation.isError ? (
        <Text style={styles.errorText}>
          {getAPIErrorMessage(logoutMutation.error)}
        </Text>
      ) : null}

      <Pressable
        disabled={!session || logoutMutation.isPending}
        onPress={() => {
          if (!session) {
            return;
          }

          logoutMutation.mutate({
            accessToken: session.access_token,
            deviceSessionToken: session.device_session_token,
          });
        }}
        style={[
          styles.primaryAction,
          logoutMutation.isPending && styles.disabledAction,
        ]}
      >
        <LogOut color={appColors.actionDarkText} size={18} strokeWidth={2.2} />
        <Text style={styles.primaryLabel}>
          {logoutMutation.isPending ? "Signing out..." : "Sign out"}
        </Text>
      </Pressable>

      <Link href="./profile" asChild>
        <Pressable style={styles.secondaryAction}>
          <ArrowLeft color={appColors.textMuted} size={18} strokeWidth={2.2} />
          <Text style={styles.secondaryLabel}>Back to profile</Text>
        </Pressable>
      </Link>
    </AppScrollScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: appColors.background,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  heroCard: {
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 18,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  heroRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    marginBottom: 14,
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: appColors.actionDark,
    borderRadius: 18,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  heroCopy: {
    flex: 1,
  },
  kicker: {
    color: appColors.amber,
    fontFamily: appTypography.fontFamily,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
  },
  body: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 15,
    lineHeight: 22,
  },
  sectionCard: {
    backgroundColor: appColors.surfaceStrong,
    borderColor: appColors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
  },
  metaRow: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  metaLabel: {
    color: appColors.textMuted,
    fontFamily: appTypography.fontFamily,
    fontSize: 13,
    marginBottom: 6,
  },
  metaValue: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  errorText: {
    color: "#fca5a5",
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  primaryAction: {
    alignItems: "center",
    backgroundColor: appColors.actionDark,
    borderRadius: 18,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginBottom: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  primaryLabel: {
    color: appColors.actionDarkText,
    fontFamily: appTypography.fontFamily,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  secondaryAction: {
    alignItems: "center",
    backgroundColor: appColors.surfaceStrong,
    borderColor: appColors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  secondaryLabel: {
    color: appColors.textMuted,
    fontFamily: appTypography.fontFamily,
    fontSize: 16,
    fontWeight: "600",
  },
  disabledAction: {
    opacity: 0.65,
  },
});
