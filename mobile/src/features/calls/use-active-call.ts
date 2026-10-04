import { useEffect, useRef, useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";

import { endCall, getCall, joinMedia } from "@/src/features/calls/api";
import { formatElapsedCallDuration } from "@/src/features/calls/duration";
import { requestCallMediaPermissions } from "@/src/lib/calls/media-permissions";
import { useCallStore } from "@/src/stores/call-store";

const terminalCallStates = [
  "ended",
  "rejected",
  "cancelled",
  "busy",
  "failed",
  "timed_out",
];

const activeCallStates = ["accepted", "connecting", "connected"];

export function useActiveCall(callId: string, callType: "audio" | "video") {
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [mediaRetryCount, setMediaRetryCount] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<
    "unknown" | "granted" | "denied"
  >("unknown");
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const joinAttemptCallIdRef = useRef<string | null>(null);
  const permissionAttemptCallIdRef = useRef<string | null>(null);
  const activeCall = useCallStore((state) =>
    state.activeCall?.id === callId ? state.activeCall : null,
  );
  const mediaSession = useCallStore((state) => state.mediaSession);
  const setMediaSession = useCallStore((state) => state.setMediaSession);
  const clearActiveCall = useCallStore((state) => state.clearActiveCall);
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

      return terminalCallStates.includes(call.state) ? false : 3_000;
    },
  });

  const joinMediaMutation = useMutation({
    mutationFn: joinMedia,
    onSuccess: (payload) => {
      upsertCall(payload.call);
      setMediaSession({
        callId: payload.call.id,
        provider: payload.provider,
        serverUrl: payload.server_url,
        participantToken: payload.participant_token,
        expiresAt: payload.expires_at,
      });
    },
  });

  const endMutation = useMutation({
    mutationFn: endCall,
    onSuccess: (call) => {
      upsertCall(call);
      clearActiveCall();
      router.replace("/");
    },
  });

  const call = callQuery.data ?? activeCall;
  const durationStartedAt = call?.connected_at ?? call?.accepted_at ?? null;
  const durationLabel = formatElapsedCallDuration(durationStartedAt, clockNow);

  useEffect(() => {
    if (!durationStartedAt) {
      return;
    }

    setClockNow(Date.now());
    const intervalId = setInterval(() => {
      setClockNow(Date.now());
    }, 1_000);

    return () => {
      clearInterval(intervalId);
    };
  }, [durationStartedAt]);

  useEffect(() => {
    joinAttemptCallIdRef.current = null;
    permissionAttemptCallIdRef.current = null;
    setPermissionStatus("unknown");
    setPermissionError(null);
    setMediaError(null);
  }, [callId]);

  useEffect(() => {
    if (call) {
      upsertCall(call);
    }
  }, [call, upsertCall]);

  useEffect(() => {
    if (!call || !terminalCallStates.includes(call.state)) {
      return;
    }

    joinAttemptCallIdRef.current = null;
    clearActiveCall();
    router.replace("/");
  }, [call?.id, call?.state, clearActiveCall]);

  useEffect(() => {
    if (
      !call ||
      !activeCallStates.includes(call.state) ||
      permissionStatus !== "unknown" ||
      permissionAttemptCallIdRef.current === call.id
    ) {
      return;
    }

    permissionAttemptCallIdRef.current = call.id;
    void requestCallMediaPermissions(callType)
      .then((result) => {
        if (permissionAttemptCallIdRef.current !== call.id) {
          return;
        }

        if (result.granted) {
          setPermissionStatus("granted");
          setPermissionError(null);
          return;
        }

        setPermissionStatus("denied");
        const permissionName =
          callType === "audio" ? "Microphone" : "Camera and microphone";
        setPermissionError(
          `${permissionName} access is required for ${callType} calls. Missing: ${result.missingPermissions.join(", ")}.`,
        );
      })
      .catch((error: unknown) => {
        if (permissionAttemptCallIdRef.current !== call.id) {
          return;
        }

        setPermissionStatus("denied");
        setPermissionError(
          error instanceof Error
            ? error.message
            : "Unable to request call permissions.",
        );
      });
  }, [call?.id, call?.state, callType, permissionStatus]);

  useEffect(() => {
    if (
      !call ||
      !activeCallStates.includes(call.state) ||
      permissionStatus !== "granted" ||
      mediaSession?.callId === call.id ||
      joinAttemptCallIdRef.current === call.id ||
      joinMediaMutation.isPending
    ) {
      return;
    }

    joinAttemptCallIdRef.current = call.id;
    joinMediaMutation.mutate(call.id);
  }, [
    call?.id,
    call?.state,
    joinMediaMutation.isPending,
    joinMediaMutation.mutate,
    mediaRetryCount,
    mediaSession?.callId,
    permissionStatus,
  ]);

  function retryPermissions() {
    permissionAttemptCallIdRef.current = null;
    setPermissionError(null);
    setPermissionStatus("unknown");
  }

  function retryMediaJoin() {
    if (!call) {
      return;
    }

    joinAttemptCallIdRef.current = null;
    setMediaRetryCount((count) => count + 1);
  }

  return {
    call,
    callQueryError: callQuery.error,
    durationLabel,
    endCall: (id: string) => endMutation.mutate(id),
    endCallError: endMutation.error,
    isEnding: endMutation.isPending,
    isJoining: joinMediaMutation.isPending,
    joinMediaError: joinMediaMutation.error,
    mediaError,
    mediaSession,
    permissionError,
    permissionStatus,
    retryMediaJoin,
    retryPermissions,
    setMediaError,
  };
}
