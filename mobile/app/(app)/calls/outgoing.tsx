import { useEffect } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { PhoneOff } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppScrollScreen } from "@/src/components/layout/app-scroll-screen";
import { cancelCall, getCall } from "@/src/features/calls/api";
import {
  buildActiveCallRoute,
  normalizeCallIdParam,
} from "@/src/features/calls/routes";
import { getAPIErrorMessage } from "@/src/lib/api/client";
import { useCallStore } from "@/src/stores/call-store";
import { appColors, appTypography } from "@/src/theme/app-theme";

export default function OutgoingCallScreen() {
  const params = useLocalSearchParams<{ callId?: string | string[] }>();
  const callId = normalizeCallIdParam(params.callId);
  const activeCall = useCallStore((state) =>
    state.activeCall?.id === callId ? state.activeCall : null,
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

  const cancelMutation = useMutation({
    mutationFn: cancelCall,
    onSuccess: (call) => {
      upsertCall(call);
    },
  });

  const call = callQuery.data ?? activeCall;

  useEffect(() => {
    if (!call) {
      return;
    }

    upsertCall(call);
    if (["accepted", "connecting", "connected"].includes(call.state)) {
      router.replace(buildActiveCallRoute(call));
    }
  }, [call, upsertCall]);

  if (!call) {
    return (
      <AppScrollScreen centerContent contentContainerStyle={styles.content}>
        <Text style={styles.helperText}>Loading call...</Text>
      </AppScrollScreen>
    );
  }

  const calleeName =
    call.recipient.display_name || call.recipient.phone_number_normalized;

  return (
    <AppScrollScreen centerContent contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>Outgoing</Text>
      <Text style={styles.title}>{calleeName}</Text>
      <Text style={styles.subtitle}>Call state: {call.state}</Text>
      <View style={styles.heroCircle}>
        <Text style={styles.heroInitial}>
          {calleeName.slice(0, 1).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.body}>
        Waiting for the recipient to answer. If they accept, the app will move
        into the active {call.call_type} call screen automatically.
      </Text>

      {callQuery.isError ? (
        <Text style={styles.errorText}>
          {getAPIErrorMessage(callQuery.error)}
        </Text>
      ) : null}

      {cancelMutation.isError ? (
        <Text style={styles.errorText}>
          {getAPIErrorMessage(cancelMutation.error)}
        </Text>
      ) : null}

      <Pressable
        disabled={cancelMutation.isPending || !call.can_cancel}
        onPress={() => {
          cancelMutation.mutate(call.id);
        }}
        style={styles.endButton}
      >
        <PhoneOff color="#fff" size={18} strokeWidth={2.2} />
        <Text style={styles.endButtonLabel}>
          {cancelMutation.isPending ? "Cancelling..." : "Cancel call"}
        </Text>
      </Pressable>
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
    color: appColors.amber,
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
    color: appColors.primarySoft,
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
  endButton: {
    alignItems: "center",
    backgroundColor: "#b91c1c",
    borderRadius: 18,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    minWidth: 190,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  endButtonLabel: {
    color: "#fff",
    fontFamily: appTypography.fontFamily,
    fontSize: 16,
    fontWeight: "700",
  },
});
