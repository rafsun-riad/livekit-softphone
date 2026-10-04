import { useEffect, useRef } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { PhoneOff } from "lucide-react-native";
import { Text, View } from "react-native";

import {
  CallAvatar,
  CallControl,
  CallError,
  CallScreenShell,
  CallStatus,
} from "@/src/components/calls/call-presentation";
import { cancelCall, createCall, getCall } from "@/src/features/calls/api";
import {
  buildActiveCallRoute,
  buildCallRoute,
  normalizeCallIdParam,
} from "@/src/features/calls/routes";
import { getAPIErrorMessage } from "@/src/lib/api/client";
import { useCallStore } from "@/src/stores/call-store";

function getOutgoingStatus(state: string | undefined, isStarting: boolean) {
  if (isStarting) {
    return "Starting your call…";
  }

  switch (state) {
    case "ringing":
      return "Ringing…";
    case "connecting":
      return "Connecting…";
    case "accepted":
      return "Call answered";
    case "busy":
      return "Line is busy";
    case "failed":
      return "Call could not connect";
    case "timed_out":
      return "No answer";
    case "cancelled":
    case "rejected":
    case "ended":
      return "Call ended";
    default:
      return "Preparing your call…";
  }
}

export default function OutgoingCallScreen() {
  const params = useLocalSearchParams<{
    callId?: string | string[];
    recipientUserId?: string | string[];
    recipientName?: string | string[];
    recipientPhone?: string | string[];
    callType?: string | string[];
  }>();
  const callId = normalizeCallIdParam(params.callId);
  const recipientUserId = normalizeCallIdParam(params.recipientUserId);
  const recipientName = normalizeCallIdParam(params.recipientName);
  const recipientPhone = normalizeCallIdParam(params.recipientPhone);
  const requestedCallType =
    normalizeCallIdParam(params.callType) === "video" ? "video" : "audio";
  const createAttemptedRef = useRef(false);
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

  const createMutation = useMutation({
    mutationFn: createCall,
    onSuccess: (call) => {
      upsertCall(call);
      router.replace(buildCallRoute("outgoing", call.id));
    },
  });

  const call = callQuery.data ?? activeCall ?? createMutation.data;

  useEffect(() => {
    if (callId || !recipientUserId || createAttemptedRef.current) {
      return;
    }

    createAttemptedRef.current = true;
    createMutation.mutate({
      recipientUserId,
      callType: requestedCallType,
    });
  }, [callId, createMutation, recipientUserId, requestedCallType]);

  useEffect(() => {
    if (!call) {
      return;
    }

    upsertCall(call);
    if (["accepted", "connecting", "connected"].includes(call.state)) {
      router.replace(buildActiveCallRoute(call));
    }
  }, [call, upsertCall]);

  const calleeName =
    call?.recipient.display_name ||
    call?.recipient.phone_number_normalized ||
    recipientName ||
    recipientPhone ||
    "Unknown contact";

  return (
    <CallScreenShell>
      <View className="items-center pt-6">
        <CallStatus>
          {call?.call_type ?? requestedCallType} call
        </CallStatus>
      </View>

      <View className="flex-1 items-center justify-center">
        <CallAvatar name={calleeName} />
        <Text className="mt-8 max-w-full text-center text-3xl font-bold text-white">
          {calleeName}
        </Text>
        <Text className="mt-2 text-base text-slate-300">
          {getOutgoingStatus(
            call?.state,
            createMutation.isPending || (!call && Boolean(recipientUserId)),
          )}
        </Text>
      </View>

      <View className="gap-6 pb-4">
        {callQuery.isError ? (
          <CallError>{getAPIErrorMessage(callQuery.error)}</CallError>
        ) : null}
        {createMutation.isError ? (
          <CallError>{getAPIErrorMessage(createMutation.error)}</CallError>
        ) : null}
        {cancelMutation.isError ? (
          <CallError>{getAPIErrorMessage(cancelMutation.error)}</CallError>
        ) : null}

        <View className="items-center">
          <CallControl
            disabled={
              createMutation.isPending ||
              cancelMutation.isPending ||
              Boolean(call && !call.can_cancel)
            }
            label={
              cancelMutation.isPending
                ? "Cancelling"
                : call
                  ? "Cancel call"
                  : "Back"
            }
            onPress={() => {
              if (call) {
                cancelMutation.mutate(call.id);
                return;
              }

              router.replace("/(app)/contacts");
            }}
            variant="danger"
          >
            <PhoneOff color="#ffffff" size={22} strokeWidth={2.2} />
          </CallControl>
        </View>
      </View>
    </CallScreenShell>
  );
}
