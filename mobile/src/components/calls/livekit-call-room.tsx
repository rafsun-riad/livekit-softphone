import {
  AndroidAudioTypePresets,
  AudioSession,
  LiveKitRoom,
} from "@livekit/react-native";
import { PropsWithChildren, useEffect, useState } from "react";
import { Platform } from "react-native";

import type { MediaSessionState } from "@/src/features/calls/types";

type LiveKitCallRoomProps = PropsWithChildren<{
  callType: "audio" | "video";
  mediaSession: MediaSessionState;
  speakerEnabled?: boolean;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
  onMediaError?: (message: string) => void;
}>;

type RuntimeStatus = "starting" | "ready" | "error";

function buildPreferredOutputs(speakerEnabled: boolean) {
  if (speakerEnabled) {
    return ["bluetooth", "headset", "speaker", "earpiece"] as const;
  }

  return ["bluetooth", "headset", "earpiece", "speaker"] as const;
}

function buildSelectedOutput(speakerEnabled: boolean) {
  if (Platform.OS === "ios") {
    return speakerEnabled ? "force_speaker" : "default";
  }

  return speakerEnabled ? "speaker" : "earpiece";
}

export function LiveKitCallRoom({
  callType,
  children,
  mediaSession,
  onConnected,
  onDisconnected,
  onError,
  onMediaError,
  speakerEnabled = true,
}: LiveKitCallRoomProps) {
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus>("starting");

  useEffect(() => {
    let isActive = true;

    async function prepareAudioSession() {
      try {
        setRuntimeStatus("starting");
        await AudioSession.configureAudio({
          android: {
            preferredOutputList: [...buildPreferredOutputs(speakerEnabled)],
            audioTypeOptions: AndroidAudioTypePresets.communication,
          },
          ios: {
            defaultOutput: speakerEnabled ? "speaker" : "earpiece",
          },
        });
        await AudioSession.startAudioSession();

        if (isActive) {
          setRuntimeStatus("ready");
        }
      } catch (error) {
        if (isActive) {
          setRuntimeStatus("error");
          onMediaError?.(
            error instanceof Error
              ? error.message
              : "Unable to start the call audio session.",
          );
        }
      }
    }

    void prepareAudioSession();

    return () => {
      isActive = false;
      void AudioSession.stopAudioSession().catch(() => undefined);
    };
  }, [onMediaError, speakerEnabled]);

  useEffect(() => {
    if (runtimeStatus !== "ready") {
      return;
    }

    async function syncOutput() {
      try {
        const outputs = await AudioSession.getAudioOutputs();
        const nextOutput = buildSelectedOutput(speakerEnabled);

        if (outputs.includes(nextOutput)) {
          await AudioSession.selectAudioOutput(nextOutput);
        }
      } catch {
        return;
      }
    }

    void syncOutput();
  }, [runtimeStatus, speakerEnabled]);

  if (runtimeStatus !== "ready") {
    return null;
  }

  return (
    <LiveKitRoom
      audio
      connect
      connectOptions={{ autoSubscribe: true }}
      onConnected={onConnected}
      onDisconnected={onDisconnected}
      onError={onError}
      onMediaDeviceFailure={(failure) => {
        onMediaError?.(
          failure
            ? `Media device failure: ${String(failure)}`
            : "Media device failure.",
        );
      }}
      options={{ adaptiveStream: { pixelDensity: "screen" } }}
      serverUrl={mediaSession.serverUrl}
      token={mediaSession.participantToken}
      video={callType === "video"}
    >
      {children}
    </LiveKitRoom>
  );
}
