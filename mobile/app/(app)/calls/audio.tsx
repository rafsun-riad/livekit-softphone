import { useEffect, useState } from "react";

import {
  useConnectionState,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/react-native";
import { useMutation, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { LiveKitCallRoom } from "@/src/components/calls/livekit-call-room";
import { AppScrollScreen } from "@/src/components/layout/app-scroll-screen";
import { endCall, getCall, joinMedia } from "@/src/features/calls/api";
import { normalizeCallIdParam } from "@/src/features/calls/routes";
import { getAPIErrorMessage } from "@/src/lib/api/client";
import { requestCallMediaPermissions } from "@/src/lib/calls/media-permissions";
import type { AuthState } from "@/src/stores/auth-store";
import { useAuthStore } from "@/src/stores/auth-store";
import { useCallStore } from "@/src/stores/call-store";
import { appColors, appTypography } from "@/src/theme/app-theme";

function AudioCallMediaPanel({ isMuted }: { isMuted: boolean }) {
  const connectionState = useConnectionState();
  const room = useRoomContext();
  const { localParticipant, lastMicrophoneError } = useLocalParticipant();
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    void localParticipant
      .setMicrophoneEnabled(!isMuted)
      .then(() => {
        if (isActive) {
          setLocalError(null);
        }
      })
      .catch((error) => {
        if (isActive) {
          setLocalError(
            error instanceof Error
              ? error.message
              : "Unable to update microphone state.",
          );
        }
      });

    return () => {
      isActive = false;
    };
  }, [isMuted, localParticipant]);

  return (
    <View style={styles.statusCard}>
      <Text style={styles.statusTitle}>Live audio session</Text>
      <Text style={styles.statusBody}>
        Connection: {connectionState} · Participants:{" "}
        {room.remoteParticipants.size + 1}
      </Text>
      <Text style={styles.statusBody}>
        Microphone: {isMuted ? "Muted locally" : "Publishing live audio"}
      </Text>
      {localError || lastMicrophoneError ? (
        <Text style={styles.errorText}>
          {localError ?? lastMicrophoneError?.message}
        </Text>
      ) : null}
    </View>
  );
}

export default function AudioCallScreen() {
  const params = useLocalSearchParams<{ callId?: string | string[] }>();
  const callId = normalizeCallIdParam(params.callId);
  const [isMuted, setIsMuted] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<
    "unknown" | "granted" | "denied"
  >("unknown");
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const session = useAuthStore((state: AuthState) => state.session);
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

  useEffect(() => {
    if (!call) {
      return;
    }

    upsertCall(call);
    if (
      [
        "ended",
        "rejected",
        "cancelled",
        "busy",
        "failed",
        "timed_out",
      ].includes(call.state)
    ) {
      clearActiveCall();
      router.replace("/");
      return;
    }

    if (
      ["accepted", "connecting", "connected"].includes(call.state) &&
      permissionStatus === "unknown"
    ) {
      void requestCallMediaPermissions("audio").then((result) => {
        if (result.granted) {
          setPermissionStatus("granted");
          setPermissionError(null);
          return;
        }

        setPermissionStatus("denied");
        setPermissionError(
          `Microphone access is required for audio calls. Missing: ${result.missingPermissions.join(", ")}.`,
        );
      });
      return;
    }

    if (
      ["accepted", "connecting", "connected"].includes(call.state) &&
      permissionStatus === "granted" &&
      mediaSession?.callId !== call.id &&
      !joinMediaMutation.isPending
    ) {
      joinMediaMutation.mutate(call.id);
    }
  }, [
    call,
    clearActiveCall,
    joinMediaMutation,
    permissionStatus,
    mediaSession?.callId,
    upsertCall,
  ]);

  if (!call) {
    return (
      <AppScrollScreen centerContent contentContainerStyle={styles.content}>
        <Text style={styles.helperText}>Loading call...</Text>
      </AppScrollScreen>
    );
  }

  const counterpart =
    session && call.initiator.id === session.user.id
      ? call.recipient
      : call.initiator;

  return (
    <AppScrollScreen centerContent contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>Audio Call</Text>
      <Text style={styles.title}>
        {counterpart.display_name || counterpart.phone_number_normalized}
      </Text>
      <Text style={styles.subtitle}>Call state: {call.state}</Text>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Media session</Text>
        <Text style={styles.statusBody}>
          {permissionStatus !== "granted"
            ? permissionStatus === "denied"
              ? "Microphone access is not granted yet."
              : "Requesting microphone access..."
            : joinMediaMutation.isPending
              ? "Authorizing media access..."
              : mediaSession?.callId === call.id
                ? `Authorized via ${mediaSession.provider} at ${mediaSession.serverUrl}`
                : "Waiting to authorize media access."}
        </Text>
      </View>

      {permissionStatus === "denied" ? (
        <Pressable
          onPress={() => {
            setPermissionStatus("unknown");
            setPermissionError(null);
          }}
          style={styles.permissionButton}
        >
          <Text style={styles.permissionButtonLabel}>
            Grant microphone access
          </Text>
        </Pressable>
      ) : null}

      {permissionStatus === "granted" && mediaSession?.callId === call.id ? (
        <LiveKitCallRoom
          callType="audio"
          mediaSession={mediaSession}
          onMediaError={setMediaError}
          speakerEnabled={speakerEnabled}
        >
          <AudioCallMediaPanel isMuted={isMuted} />
        </LiveKitCallRoom>
      ) : null}

      <View style={styles.controlsRow}>
        <Pressable
          onPress={() => setIsMuted((value) => !value)}
          style={styles.controlButton}
        >
          {isMuted ? (
            <MicOff color={appColors.textPrimary} size={20} strokeWidth={2.2} />
          ) : (
            <Mic color={appColors.textPrimary} size={20} strokeWidth={2.2} />
          )}
          <Text style={styles.controlLabel}>{isMuted ? "Muted" : "Mute"}</Text>
        </Pressable>
        <Pressable
          onPress={() => setSpeakerEnabled((value) => !value)}
          style={styles.controlButton}
        >
          {speakerEnabled ? (
            <Volume2
              color={appColors.textPrimary}
              size={20}
              strokeWidth={2.2}
            />
          ) : (
            <VolumeX
              color={appColors.textPrimary}
              size={20}
              strokeWidth={2.2}
            />
          )}
          <Text style={styles.controlLabel}>
            {speakerEnabled ? "Speaker" : "Earpiece"}
          </Text>
        </Pressable>
      </View>

      {callQuery.isError ? (
        <Text style={styles.errorText}>
          {getAPIErrorMessage(callQuery.error)}
        </Text>
      ) : null}
      {permissionError ? (
        <Text style={styles.errorText}>{permissionError}</Text>
      ) : null}
      {mediaError ? <Text style={styles.errorText}>{mediaError}</Text> : null}
      {joinMediaMutation.isError ? (
        <Text style={styles.errorText}>
          {getAPIErrorMessage(joinMediaMutation.error)}
        </Text>
      ) : null}
      {endMutation.isError ? (
        <Text style={styles.errorText}>
          {getAPIErrorMessage(endMutation.error)}
        </Text>
      ) : null}

      <Pressable
        disabled={endMutation.isPending || !call.can_end}
        onPress={() => {
          endMutation.mutate(call.id);
        }}
        style={styles.endButton}
      >
        <PhoneOff color="#fff" size={18} strokeWidth={2.2} />
        <Text style={styles.endButtonLabel}>
          {endMutation.isPending ? "Ending..." : "End call"}
        </Text>
      </Pressable>
    </AppScrollScreen>
  );
}

const styles = StyleSheet.create({
  content: {
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
    textAlign: "center",
    textTransform: "uppercase",
  },
  title: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 38,
    textAlign: "center",
  },
  subtitle: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 15,
    marginBottom: 24,
    marginTop: 10,
    textAlign: "center",
  },
  statusCard: {
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  statusTitle: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  statusBody: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
  },
  permissionButton: {
    alignItems: "center",
    backgroundColor: appColors.surfaceStrong,
    borderColor: appColors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  permissionButtonLabel: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    fontWeight: "700",
  },
  controlsRow: {
    flexDirection: "row",
    gap: 14,
    justifyContent: "center",
    marginBottom: 20,
  },
  controlButton: {
    alignItems: "center",
    backgroundColor: appColors.surfaceStrong,
    borderColor: appColors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    minWidth: 120,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  controlLabel: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    fontWeight: "700",
  },
  helperText: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 16,
    textAlign: "center",
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
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  endButtonLabel: {
    color: "#fff",
    fontFamily: appTypography.fontFamily,
    fontSize: 16,
    fontWeight: "700",
  },
});
