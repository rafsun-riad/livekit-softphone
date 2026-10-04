import { useEffect, useState } from "react";

import {
  isTrackReference,
  useLocalParticipant,
  useTracks,
  VideoTrack,
} from "@livekit/react-native";
import { useLocalSearchParams } from "expo-router";
import { Track } from "livekit-client";
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Pause,
  PhoneOff,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import {
  CallAvatar,
  CallControl,
  CallError,
  CallStatus,
} from "@/src/components/calls/call-presentation";
import { LiveKitCallRoom } from "@/src/components/calls/livekit-call-room";
import { normalizeCallIdParam } from "@/src/features/calls/routes";
import { useActiveCall } from "@/src/features/calls/use-active-call";
import { useCallControls } from "@/src/features/calls/use-call-controls";
import { getAPIErrorMessage } from "@/src/lib/api/client";
import type { AuthState } from "@/src/stores/auth-store";
import { useAuthStore } from "@/src/stores/auth-store";

function VideoCallMediaPanel({
  cameraEnabled,
  microphoneEnabled,
  onHold,
  participantName,
}: {
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  onHold: boolean;
  participantName: string;
}) {
  const { lastCameraError, lastMicrophoneError, localParticipant } =
    useLocalParticipant();
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
  ]);
  const [localError, setLocalError] = useState<string | null>(null);

  const localTrack = tracks.find(
    (trackRef) => isTrackReference(trackRef) && trackRef.participant.isLocal,
  );
  const remoteTrack = tracks.find(
    (trackRef) => isTrackReference(trackRef) && !trackRef.participant.isLocal,
  );

  useEffect(() => {
    let isActive = true;

    void Promise.all([
      localParticipant.setCameraEnabled(cameraEnabled),
      localParticipant.setMicrophoneEnabled(microphoneEnabled),
    ])
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
              : "Unable to update local media state.",
          );
        }
      });

    return () => {
      isActive = false;
    };
  }, [cameraEnabled, localParticipant, microphoneEnabled]);

  return (
    <View className="absolute inset-0 bg-slate-900">
      <View className="flex-1">
        {remoteTrack && isTrackReference(remoteTrack) ? (
          <VideoTrack
            objectFit="cover"
            style={{ height: "100%", width: "100%" }}
            trackRef={remoteTrack}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-8">
            <CallAvatar name={participantName} />
            <Text className="mt-6 text-base text-slate-200">
              {onHold ? "Call is on local hold" : "Waiting for video…"}
            </Text>
          </View>
        )}
      </View>
      <View className="absolute right-5 top-20 h-40 w-28 overflow-hidden rounded-2xl border border-white/20 bg-slate-800">
        {localTrack && isTrackReference(localTrack) ? (
          <VideoTrack
            mirror
            objectFit="cover"
            style={{ height: "100%", width: "100%" }}
            trackRef={localTrack}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-2">
            <Text className="text-center text-xs font-medium text-slate-200">
              {cameraEnabled ? "Starting camera…" : "Camera off"}
            </Text>
          </View>
        )}
      </View>
      {localError || lastCameraError || lastMicrophoneError ? (
        <View className="absolute left-6 right-6 top-24">
          <CallError>
            {localError ??
              lastCameraError?.message ??
              lastMicrophoneError?.message}
          </CallError>
        </View>
      ) : null}
    </View>
  );
}

export default function VideoCallScreen() {
  const params = useLocalSearchParams<{ callId?: string | string[] }>();
  const callId = normalizeCallIdParam(params.callId);
  const controls = useCallControls("video");
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
  } = useActiveCall(callId, "video");

  if (!call) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <CallStatus>Reconnecting your call…</CallStatus>
      </View>
    );
  }

  const counterpart =
    session && call.initiator.id === session.user.id
      ? call.recipient
      : call.initiator;

  const counterpartName =
    counterpart.display_name || counterpart.phone_number_normalized;
  const hasMediaSession =
    permissionStatus === "granted" && mediaSession?.callId === call.id;

  return (
    <View className="flex-1 bg-slate-950">
      {hasMediaSession && mediaSession ? (
        <LiveKitCallRoom
          callType="video"
          mediaSession={mediaSession}
          onError={(error) => {
            setMediaError(error.message);
          }}
          onMediaError={setMediaError}
          speakerEnabled={controls.speakerEnabled}
        >
          <VideoCallMediaPanel
            cameraEnabled={controls.videoEnabled}
            microphoneEnabled={controls.microphoneEnabled}
            onHold={controls.isOnHold}
            participantName={counterpartName}
          />
        </LiveKitCallRoom>
      ) : (
        <View className="absolute inset-0 items-center justify-center">
          <CallAvatar name={counterpartName} />
          <Text className="mt-6 text-base text-slate-200">
            {permissionStatus === "denied"
              ? "Allow camera and microphone to continue"
              : "Preparing video call…"}
          </Text>
        </View>
      )}

      <View className="absolute left-0 right-0 top-0 items-center px-6 pt-3">
        <CallStatus>
          {controls.isOnHold
            ? `${counterpartName} · On local hold`
            : durationLabel
              ? `${counterpartName} · ${durationLabel}`
              : `Video call · ${counterpartName}`}
        </CallStatus>
      </View>

      <View className="absolute bottom-0 left-0 right-0 gap-3 bg-slate-950/90 px-5 pb-6 pt-5">
        {permissionStatus === "granted" && !hasMediaSession ? (
          <CallStatus>
            {isJoining ? "Connecting video…" : "Preparing video…"}
          </CallStatus>
        ) : null}
        {permissionStatus === "denied" ? (
          <Pressable
            className="self-center rounded-full bg-slate-800 px-5 py-3"
            onPress={retryPermissions}
          >
            <Text className="font-semibold text-white">
              Allow camera and microphone
            </Text>
          </Pressable>
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
            active={controls.isMuted && !controls.isOnHold}
            label={controls.isMuted ? "Unmute" : "Mute"}
            onPress={controls.toggleMute}
          >
            {controls.isMuted ? (
              <MicOff color="#ffffff" size={21} strokeWidth={2.2} />
            ) : (
              <Mic color="#ffffff" size={21} strokeWidth={2.2} />
            )}
          </CallControl>
          <CallControl
            active={controls.cameraEnabled && !controls.isOnHold}
            label={controls.cameraEnabled ? "Camera off" : "Camera on"}
            onPress={controls.toggleCamera}
          >
            {controls.cameraEnabled ? (
              <Camera color="#ffffff" size={21} strokeWidth={2.2} />
            ) : (
              <CameraOff color="#ffffff" size={21} strokeWidth={2.2} />
            )}
          </CallControl>
          <CallControl
            active={controls.speakerEnabled}
            label={controls.speakerEnabled ? "Speaker" : "Earpiece"}
            onPress={controls.toggleSpeaker}
          >
            {controls.speakerEnabled ? (
              <Volume2 color="#ffffff" size={21} strokeWidth={2.2} />
            ) : (
              <VolumeX color="#ffffff" size={21} strokeWidth={2.2} />
            )}
          </CallControl>
          <CallControl
            active={controls.isOnHold}
            label={controls.isOnHold ? "Resume" : "Hold"}
            onPress={controls.toggleHold}
          >
            {controls.isOnHold ? (
              <Play color="#ffffff" size={21} strokeWidth={2.2} />
            ) : (
              <Pause color="#ffffff" size={21} strokeWidth={2.2} />
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
    </View>
  );
}
