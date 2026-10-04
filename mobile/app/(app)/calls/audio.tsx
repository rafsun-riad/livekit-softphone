import { useEffect, useState } from "react";

import {
  useConnectionState,
  useLocalParticipant,
} from "@livekit/react-native";
import { useLocalSearchParams } from "expo-router";
import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import {
  CallAvatar,
  CallControl,
  CallError,
  CallScreenShell,
  CallStatus,
} from "@/src/components/calls/call-presentation";
import { LiveKitCallRoom } from "@/src/components/calls/livekit-call-room";
import { normalizeCallIdParam } from "@/src/features/calls/routes";
import { useActiveCall } from "@/src/features/calls/use-active-call";
import { getAPIErrorMessage } from "@/src/lib/api/client";
import type { AuthState } from "@/src/stores/auth-store";
import { useAuthStore } from "@/src/stores/auth-store";

function AudioCallMediaPanel({ isMuted }: { isMuted: boolean }) {
  const connectionState = useConnectionState();
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
    <View className="items-center">
      <CallStatus>
        {connectionState === "connected" ? "Connected" : "Connecting audio…"}
      </CallStatus>
      {localError || lastMicrophoneError ? (
        <View className="mt-4">
          <CallError>{localError ?? lastMicrophoneError?.message}</CallError>
        </View>
      ) : null}
    </View>
  );
}

export default function AudioCallScreen() {
  const params = useLocalSearchParams<{ callId?: string | string[] }>();
  const callId = normalizeCallIdParam(params.callId);
  const [isMuted, setIsMuted] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const session = useAuthStore((state: AuthState) => state.session);
  const {
    call,
    callQueryError,
    durationLabel,
    endCall,
    endCallError,
    isEnding,
    isJoining,
    joinMediaError,
    mediaError,
    mediaSession,
    permissionError,
    permissionStatus,
    retryMediaJoin,
    retryPermissions,
    setMediaError,
  } = useActiveCall(callId, "audio");

  if (!call) {
    return (
      <CallScreenShell>
        <View className="flex-1 items-center justify-center">
          <CallStatus>Reconnecting your call…</CallStatus>
        </View>
      </CallScreenShell>
    );
  }

  const counterpart =
    session && call.initiator.id === session.user.id
      ? call.recipient
      : call.initiator;

  const counterpartName =
    counterpart.display_name || counterpart.phone_number_normalized;
  const callStatus =
    call.state === "connected"
      ? "Connected"
      : call.state === "connecting"
        ? "Connecting…"
        : "Starting call…";

  return (
    <CallScreenShell>
      <View className="items-center pt-2">
        <CallStatus>{callStatus}</CallStatus>
      </View>

      <View className="flex-1 items-center justify-center">
        <CallAvatar name={counterpartName} />
        <Text className="mt-8 max-w-full text-center text-3xl font-bold text-white">
          {counterpartName}
        </Text>
        <Text className="mt-2 text-lg tabular-nums text-slate-300">
          {durationLabel || "Audio call"}
        </Text>
      </View>

      {permissionStatus === "denied" ? (
        <Pressable
          className="mb-5 self-center rounded-full bg-slate-800 px-5 py-3"
          onPress={retryPermissions}
        >
          <Text className="font-semibold text-white">Allow microphone</Text>
        </Pressable>
      ) : null}

      {permissionStatus === "granted" && mediaSession?.callId === call.id ? (
        <LiveKitCallRoom
          callType="audio"
          mediaSession={mediaSession}
          onError={(error) => {
            setMediaError(error.message);
          }}
          onMediaError={setMediaError}
          speakerEnabled={speakerEnabled}
        >
          <AudioCallMediaPanel isMuted={isMuted} />
        </LiveKitCallRoom>
      ) : null}

      <View className="gap-4 pb-2">
        {permissionStatus !== "granted" ||
        (permissionStatus === "granted" && mediaSession?.callId !== call.id) ? (
          <CallStatus>
            {permissionStatus === "denied"
              ? "Microphone access is needed to talk"
              : isJoining
                ? "Connecting audio…"
                : permissionStatus === "granted"
                  ? "Preparing audio…"
                  : "Preparing microphone…"}
          </CallStatus>
        ) : null}
        {callQueryError ? (
          <CallError>{getAPIErrorMessage(callQueryError)}</CallError>
        ) : null}
        {permissionError ? <CallError>{permissionError}</CallError> : null}
        {mediaError ? <CallError>{mediaError}</CallError> : null}
        {joinMediaError ? (
          <>
            <CallError>{getAPIErrorMessage(joinMediaError)}</CallError>
            <Pressable
              className="self-center rounded-full bg-slate-800 px-5 py-3"
              onPress={retryMediaJoin}
            >
              <Text className="font-semibold text-white">Retry connection</Text>
            </Pressable>
          </>
        ) : null}
        {endCallError ? (
          <CallError>{getAPIErrorMessage(endCallError)}</CallError>
        ) : null}

        <View className="flex-row items-center justify-center gap-5">
          <CallControl
            label={isMuted ? "Unmute" : "Mute"}
            onPress={() => setIsMuted((value) => !value)}
          >
            {isMuted ? (
              <MicOff color="#ffffff" size={21} strokeWidth={2.2} />
            ) : (
              <Mic color="#ffffff" size={21} strokeWidth={2.2} />
            )}
          </CallControl>
          <CallControl
            label={speakerEnabled ? "Speaker" : "Earpiece"}
            onPress={() => setSpeakerEnabled((value) => !value)}
          >
            {speakerEnabled ? (
              <Volume2 color="#ffffff" size={21} strokeWidth={2.2} />
            ) : (
              <VolumeX color="#ffffff" size={21} strokeWidth={2.2} />
            )}
          </CallControl>
          <CallControl
            disabled={isEnding || !call.can_end}
            label={isEnding ? "Ending" : "End"}
            onPress={() => endCall(call.id)}
            variant="danger"
          >
            <PhoneOff color="#ffffff" size={21} strokeWidth={2.2} />
          </CallControl>
        </View>
      </View>
    </CallScreenShell>
  );
}
