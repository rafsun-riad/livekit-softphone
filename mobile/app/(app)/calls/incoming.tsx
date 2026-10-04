import { useEffect } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Phone, PhoneOff } from "lucide-react-native";
import { Text, View } from "react-native";

import {
  CallAvatar,
  CallControl,
  CallError,
  CallScreenShell,
  CallStatus,
} from "@/src/components/calls/call-presentation";
import { acceptCall, getCall, rejectCall } from "@/src/features/calls/api";
import {
  buildActiveCallRoute,
  normalizeCallIdParam,
} from "@/src/features/calls/routes";
import { getAPIErrorMessage } from "@/src/lib/api/client";
import { useCallStore } from "@/src/stores/call-store";

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
      <CallScreenShell>
        <View className="flex-1 items-center justify-center">
          <CallStatus>Connecting you to the caller…</CallStatus>
          {callQuery.isError ? (
            <View className="mt-6">
              <CallError>{getAPIErrorMessage(callQuery.error)}</CallError>
            </View>
          ) : null}
        </View>
      </CallScreenShell>
    );
  }

  const callerName =
    call.initiator.display_name || call.initiator.phone_number_normalized;

  return (
    <CallScreenShell>
      <View className="items-center pt-6">
        <CallStatus>Incoming {call.call_type} call</CallStatus>
      </View>

      <View className="flex-1 items-center justify-center">
        <CallAvatar name={callerName} />
        <Text className="mt-8 max-w-full text-center text-3xl font-bold text-white">
          {callerName}
        </Text>
        <Text className="mt-2 text-base text-slate-300">Calling you</Text>
      </View>

      <View className="gap-6 pb-4">
        {callQuery.isError ? (
          <CallError>{getAPIErrorMessage(callQuery.error)}</CallError>
        ) : null}
        {acceptMutation.isError ? (
          <CallError>{getAPIErrorMessage(acceptMutation.error)}</CallError>
        ) : null}
        {rejectMutation.isError ? (
          <CallError>{getAPIErrorMessage(rejectMutation.error)}</CallError>
        ) : null}

        <View className="flex-row items-center justify-center gap-10">
          <CallControl
            disabled={
              rejectMutation.isPending ||
              acceptMutation.isPending ||
              !call.can_reject
            }
            label={rejectMutation.isPending ? "Declining" : "Decline"}
            onPress={() => rejectMutation.mutate(call.id)}
            variant="danger"
          >
            <PhoneOff color="#ffffff" size={22} strokeWidth={2.2} />
          </CallControl>
          <CallControl
            disabled={
              acceptMutation.isPending ||
              rejectMutation.isPending ||
              !call.can_accept
            }
            label={acceptMutation.isPending ? "Answering" : "Answer"}
            onPress={() => acceptMutation.mutate(call.id)}
            variant="accept"
          >
            <Phone color="#052e16" size={22} strokeWidth={2.2} />
          </CallControl>
        </View>
      </View>
    </CallScreenShell>
  );
}
