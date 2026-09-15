import { useMutation, useQuery } from "@tanstack/react-query";
import { PhoneCall, ShieldCheck } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getCurrentUser, logout } from "@/src/features/auth/api";
import { getAPIErrorMessage } from "@/src/lib/api/client";
import type { AuthState } from "@/src/stores/auth-store";
import { useAuthStore } from "@/src/stores/auth-store";
import { appColors, appTypography } from "@/src/theme/app-theme";

export default function HomeScreen() {
  const clearSession = useAuthStore((state: AuthState) => state.clearSession);
  const session = useAuthStore((state: AuthState) => state.session);

  const meQuery = useQuery({
    enabled: Boolean(session),
    queryFn: getCurrentUser,
    queryKey: ["me"],
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      await clearSession();
    },
  });

  return (
    <View style={styles.screen}>
      <View style={styles.heroRow}>
        <View style={styles.heroIcon}>
          <PhoneCall
            color={appColors.actionDarkText}
            size={24}
            strokeWidth={2.2}
          />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.label}>App Shell</Text>
          <Text style={styles.title}>
            Home route is now managed by Expo Router
          </Text>
        </View>
      </View>
      <Text style={styles.body}>
        Signed in as{" "}
        {meQuery.data?.display_name ||
          session?.user.display_name ||
          session?.user.phone_number_normalized}
        . The next step is contact search, profile fetch, and authenticated API
        hooks.
      </Text>

      <View style={styles.callout}>
        <ShieldCheck color={appColors.cyanSoft} size={18} strokeWidth={2.2} />
        <Text style={styles.calloutText}>
          Device session storage, silent refresh, route guards, and the first
          authenticated profile fetch are active in the app shell.
        </Text>
      </View>

      {meQuery.isError ? (
        <Text style={styles.errorText}>
          {getAPIErrorMessage(meQuery.error)}
        </Text>
      ) : null}

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
          styles.action,
          logoutMutation.isPending && styles.disabledAction,
        ]}
      >
        <Text style={styles.actionLabel}>
          {logoutMutation.isPending ? "Signing out..." : "Sign out"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: appColors.background,
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
    marginBottom: 28,
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
