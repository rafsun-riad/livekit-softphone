import { create } from "zustand";

import type {
  CallRecord,
  MediaSessionState,
  PresencePayload,
} from "@/src/features/calls/types";

type SocketConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

type CallStore = {
  activeCall: CallRecord | null;
  pendingIncomingCall: CallRecord | null;
  mediaSession: MediaSessionState | null;
  socketStatus: SocketConnectionStatus;
  onlineUsers: Record<string, boolean>;
  setSocketStatus: (status: SocketConnectionStatus) => void;
  upsertCall: (call: CallRecord) => void;
  clearActiveCall: () => void;
  clearPendingIncomingCall: () => void;
  setMediaSession: (session: MediaSessionState) => void;
  clearMediaSession: () => void;
  setIncomingCall: (call: CallRecord) => void;
  applyPresence: (
    eventType: "presence.user_online" | "presence.user_offline",
    payload: PresencePayload,
  ) => void;
  resetRealtimeState: () => void;
};

const terminalStates = new Set([
  "ended",
  "rejected",
  "cancelled",
  "busy",
  "failed",
  "timed_out",
]);

export const useCallStore = create<CallStore>((set) => ({
  activeCall: null,
  pendingIncomingCall: null,
  mediaSession: null,
  socketStatus: "disconnected",
  onlineUsers: {},
  setSocketStatus: (status) => {
    set({ socketStatus: status });
  },
  upsertCall: (call) => {
    set((state) => {
      const nextState: Partial<CallStore> = {
        activeCall: call,
      };

      if (call.state === "ringing" && call.can_accept) {
        nextState.pendingIncomingCall = call;
      }

      if (terminalStates.has(call.state)) {
        if (state.pendingIncomingCall?.id === call.id) {
          nextState.pendingIncomingCall = null;
        }
        if (state.mediaSession?.callId === call.id) {
          nextState.mediaSession = null;
        }
      }

      return nextState;
    });
  },
  clearActiveCall: () => {
    set({ activeCall: null, mediaSession: null });
  },
  clearPendingIncomingCall: () => {
    set({ pendingIncomingCall: null });
  },
  setMediaSession: (mediaSession) => {
    set({ mediaSession });
  },
  clearMediaSession: () => {
    set({ mediaSession: null });
  },
  setIncomingCall: (call) => {
    set({ activeCall: call, pendingIncomingCall: call });
  },
  applyPresence: (eventType, payload) => {
    set((state) => ({
      onlineUsers: {
        ...state.onlineUsers,
        [payload.user_id]: eventType === "presence.user_online",
      },
    }));
  },
  resetRealtimeState: () => {
    set({
      activeCall: null,
      pendingIncomingCall: null,
      mediaSession: null,
      socketStatus: "disconnected",
      onlineUsers: {},
    });
  },
}));
