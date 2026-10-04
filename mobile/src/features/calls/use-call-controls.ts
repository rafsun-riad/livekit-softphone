import { useState } from "react";

export function useCallControls(callType: "audio" | "video") {
  const [isMuted, setIsMuted] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(callType === "video");
  const [isOnHold, setIsOnHold] = useState(false);

  return {
    cameraEnabled,
    isMuted,
    isOnHold,
    microphoneEnabled: !isMuted && !isOnHold,
    speakerEnabled,
    toggleCamera: () => {
      if (callType !== "video") {
        return;
      }

      setCameraEnabled((value) => !value);
    },
    toggleHold: () => {
      setIsOnHold((value) => !value);
    },
    toggleMute: () => {
      setIsMuted((value) => !value);
    },
    toggleSpeaker: () => {
      setSpeakerEnabled((value) => !value);
    },
    videoEnabled: callType === "video" ? cameraEnabled && !isOnHold : false,
  };
}
