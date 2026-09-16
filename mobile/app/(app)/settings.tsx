import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "expo-router";
import {
  ArrowLeft,
  BellRing,
  LogOut,
  RefreshCcw,
  Server,
  ShieldCheck,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppScrollScreen } from "@/src/components/layout/app-scroll-screen";
import { env } from "@/src/config/env";
import { logout } from "@/src/features/auth/api";
import { getDevices } from "@/src/features/devices/api";
import { getAPIErrorMessage } from "@/src/lib/api/client";
import { syncCurrentDeviceRegistration } from "@/src/lib/notifications/push-registration";
import { applyManualPushSyncResult } from "@/src/providers/push-notifications-provider";
import type { AuthState } from "@/src/stores/auth-store";
import { useAuthStore } from "@/src/stores/auth-store";
import type { PushState } from "@/src/stores/push-store";
import { usePushStore } from "@/src/stores/push-store";
import { appColors, appTypography } from "@/src/theme/app-theme";

const FIREBASE_PROJECT_ID = "livekit-softphone-mruhaq-6b385";

export default function SettingsScreen() {
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((state: AuthState) => state.clearSession);
  const session = useAuthStore((state: AuthState) => state.session);
  const permissionStatus = usePushStore(
    (state: PushState) => state.permissionStatus,
  );
  const registrationStatus = usePushStore(
    (state: PushState) => state.registrationStatus,
  );
  const registeredDeviceId = usePushStore(
    (state: PushState) => state.registeredDeviceId,
  );
  const lastError = usePushStore((state: PushState) => state.lastError);
  const lastSyncedAt = usePushStore((state: PushState) => state.lastSyncedAt);
  const devicesQuery = useQuery({
    enabled: Boolean(session),
    queryFn: getDevices,
    queryKey: ["devices"],
  });

  const syncPushMutation = useMutation({
    mutationFn: syncCurrentDeviceRegistration,
    onSuccess: async (result) => {
      applyManualPushSyncResult(result);
      await queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });

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
        <View style={styles.sectionHeader}>
          <BellRing color={appColors.cyanSoft} size={18} strokeWidth={2.2} />
          <Text style={styles.sectionTitle}>Push registration</Text>
        </View>
        <Text style={styles.metaRow}>Permission: {permissionStatus}</Text>
        <Text style={styles.metaRow}>Status: {registrationStatus}</Text>
        <Text style={styles.metaRow}>
          Backend device ID: {registeredDeviceId || "Not registered yet"}
        </Text>
        <Text style={styles.metaRow}>
          Last sync:{" "}
          {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : "Never"}
        </Text>
        {lastError ? <Text style={styles.errorText}>{lastError}</Text> : null}
        {syncPushMutation.isError ? (
          <Text style={styles.errorText}>
            {getAPIErrorMessage(syncPushMutation.error)}
          </Text>
        ) : null}
        <Pressable
          disabled={syncPushMutation.isPending || !session}
          onPress={() => {
            syncPushMutation.mutate();
          }}
          style={[
            styles.secondaryAction,
            syncPushMutation.isPending && styles.disabledAction,
          ]}
        >
          <RefreshCcw color={appColors.textMuted} size={18} strokeWidth={2.2} />
          <Text style={styles.secondaryLabel}>
            {syncPushMutation.isPending
              ? "Syncing push registration..."
              : "Sync push registration"}
          </Text>
        </Pressable>
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
        <Text style={styles.metaLabel}>Firebase project</Text>
        <Text style={styles.metaValue}>{FIREBASE_PROJECT_ID}</Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Registered devices</Text>
        {devicesQuery.isLoading ? (
          <Text style={styles.metaValue}>Loading device registrations...</Text>
        ) : null}
        {devicesQuery.isError ? (
          <Text style={styles.errorText}>
            {getAPIErrorMessage(devicesQuery.error)}
          </Text>
        ) : null}
        {!devicesQuery.isLoading && !devicesQuery.data?.length ? (
          <Text style={styles.metaValue}>
            No device registrations yet. After push sync succeeds, this list
            will show the backend UUID you can use for test pushes.
          </Text>
        ) : null}
        {devicesQuery.data?.map((device) => (
          <View key={device.id} style={styles.deviceRow}>
            <Text style={styles.deviceTitle}>
              {device.device_label || `${device.platform} device`}
            </Text>
            <Text style={styles.deviceMeta}>ID: {device.id}</Text>
            <Text style={styles.deviceMeta}>
              {device.platform} · {device.push_provider} · v{device.app_version}
            </Text>
            <Text style={styles.deviceMeta}>
              {device.is_active ? "Active" : "Inactive"}
            </Text>
          </View>
        ))}
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
  deviceRow: {
    borderColor: appColors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  deviceTitle: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },
  deviceMeta: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 13,
    lineHeight: 18,
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
