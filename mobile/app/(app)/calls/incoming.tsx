import { useEffect } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Phone, PhoneOff } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppScrollScreen } from "@/src/components/layout/app-scroll-screen";
import { acceptCall, getCall, rejectCall } from "@/src/features/calls/api";
import {
  buildActiveCallRoute,
  normalizeCallIdParam,
} from "@/src/features/calls/routes";
import { getAPIErrorMessage } from "@/src/lib/api/client";
import { useCallStore } from "@/src/stores/call-store";
import { appColors, appTypography } from "@/src/theme/app-theme";

export default function IncomingCallScreen() {
  const params = useLocalSearchParams<{ callId?: string | string[] }>();
  const callId = normalizeCallIdParam(params.callId);
  const pendingIncomingCall = useCallStore((state) =>
    state.pendingIncomingCall?.id === callId ? state.pendingIncomingCall : null,
  );
  const clearPendingIncomingCall = useCallStore(
    (state) => state.clearPendingIncomingCall,
  );
  const upsertCall = useCallStore((state) => state.upsertCall);

  const callQuery = useQuery({
    enabled: Boolean(callId),
    queryFn: ({ signal }) => getCall(callId, { signal }),
    queryKey: ["calls", callId],
    refetchInterval: ({ state }) => {
      const call = state.data;
      if (!call) {
        return 3_000;
      }

      return [
        "ended",
        "rejected",
        "cancelled",
        "busy",
        "failed",
        "timed_out",
      ].includes(call.state)
        ? false
        : 3_000;
    },
  });

  const acceptMutation = useMutation({
    mutationFn: acceptCall,
    onSuccess: (call) => {
      upsertCall(call);
      clearPendingIncomingCall();
      router.replace(buildActiveCallRoute(call));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectCall,
    onSuccess: (call) => {
      upsertCall(call);
      clearPendingIncomingCall();
      router.replace("/");
    },
  });

  const call = callQuery.data ?? pendingIncomingCall;

  useEffect(() => {
    if (!call) {
      return;
    }

    upsertCall(call);
    if (["accepted", "connecting", "connected"].includes(call.state)) {
      clearPendingIncomingCall();
      router.replace(buildActiveCallRoute(call));
    }
  }, [call, clearPendingIncomingCall, upsertCall]);

  if (!call) {
    return (
      <AppScrollScreen centerContent contentContainerStyle={styles.content}>
        <Text style={styles.helperText}>Loading incoming call...</Text>
      </AppScrollScreen>
    );
  }

  const callerName =
    call.initiator.display_name || call.initiator.phone_number_normalized;

  return (
    <AppScrollScreen centerContent contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>Incoming</Text>
      <Text style={styles.title}>{callerName}</Text>
      <Text style={styles.subtitle}>Incoming {call.call_type} call</Text>
      <View style={styles.heroCircle}>
        <Text style={styles.heroInitial}>
          {callerName.slice(0, 1).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.body}>
        Accept to continue into the active call view or reject to end the call.
      </Text>

      {callQuery.isError ? (
        <Text style={styles.errorText}>
          {getAPIErrorMessage(callQuery.error)}
        </Text>
      ) : null}

      {acceptMutation.isError ? (
        <Text style={styles.errorText}>
          {getAPIErrorMessage(acceptMutation.error)}
        </Text>
      ) : null}

      {rejectMutation.isError ? (
        <Text style={styles.errorText}>
          {getAPIErrorMessage(rejectMutation.error)}
        </Text>
      ) : null}

      <View style={styles.actionsRow}>
        <Pressable
          disabled={
            rejectMutation.isPending ||
            acceptMutation.isPending ||
            !call.can_reject
          }
          onPress={() => {
            rejectMutation.mutate(call.id);
          }}
          style={styles.rejectButton}
        >
          <PhoneOff color="#fff" size={18} strokeWidth={2.2} />
          <Text style={styles.actionLabel}>Reject</Text>
        </Pressable>
        <Pressable
          disabled={
            acceptMutation.isPending ||
            rejectMutation.isPending ||
            !call.can_accept
          }
          onPress={() => {
            acceptMutation.mutate(call.id);
          }}
          style={styles.acceptButton}
        >
          <Phone color="#06230f" size={18} strokeWidth={2.2} />
          <Text style={styles.acceptLabel}>
            {acceptMutation.isPending ? "Accepting..." : "Accept"}
          </Text>
        </Pressable>
      </View>
    </AppScrollScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  kicker: {
    color: appColors.cyan,
    fontFamily: appTypography.fontFamily,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 14,
    textTransform: "uppercase",
  },
  title: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 34,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 16,
    marginTop: 10,
  },
  heroCircle: {
    alignItems: "center",
    backgroundColor: appColors.surfaceStrong,
    borderColor: appColors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 140,
    justifyContent: "center",
    marginBottom: 28,
    marginTop: 28,
    width: 140,
  },
  heroInitial: {
    color: appColors.cyanSoft,
    fontFamily: appTypography.fontFamily,
    fontSize: 48,
    fontWeight: "700",
  },
  body: {
    color: appColors.textMuted,
    fontFamily: appTypography.fontFamily,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
    maxWidth: 320,
    textAlign: "center",
  },
  helperText: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 16,
  },
  errorText: {
    color: "#fca5a5",
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
    textAlign: "center",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 16,
  },
  rejectButton: {
    alignItems: "center",
    backgroundColor: "#b91c1c",
    borderRadius: 18,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  acceptButton: {
    alignItems: "center",
    backgroundColor: "#86efac",
    borderRadius: 18,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  actionLabel: {
    color: "#fff",
    fontFamily: appTypography.fontFamily,
    fontSize: 16,
    fontWeight: "700",
  },
  acceptLabel: {
    color: "#06230f",
    fontFamily: appTypography.fontFamily,
    fontSize: 16,
    fontWeight: "700",
  },
});
