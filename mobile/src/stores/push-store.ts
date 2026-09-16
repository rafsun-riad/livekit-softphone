import { create } from "zustand";

export type PushPermissionStatus = "unknown" | "granted" | "denied";
export type PushRegistrationStatus =
  | "idle"
  | "checking"
  | "syncing"
  | "registered"
  | "denied"
  | "error";

export type PushState = {
  permissionStatus: PushPermissionStatus;
  registrationStatus: PushRegistrationStatus;
  nativePushToken: string | null;
  registeredDeviceId: string | null;
  lastError: string | null;
  lastSyncedAt: string | null;
  reset: () => void;
  setChecking: () => void;
  setSyncing: (token: string | null) => void;
  setDenied: () => void;
  setRegistered: (payload: {
    token: string;
    registeredDeviceId: string;
    syncedAt: string;
  }) => void;
  setError: (message: string) => void;
};

const initialState = {
  permissionStatus: "unknown" as PushPermissionStatus,
  registrationStatus: "idle" as PushRegistrationStatus,
  nativePushToken: null,
  registeredDeviceId: null,
  lastError: null,
  lastSyncedAt: null,
};

export const usePushStore = create<PushState>((set) => ({
  ...initialState,
  reset: () => {
    set(initialState);
  },
  setChecking: () => {
    set({
      permissionStatus: "unknown",
      registrationStatus: "checking",
      lastError: null,
    });
  },
  setSyncing: (token) => {
    set({
      permissionStatus: "granted",
      registrationStatus: "syncing",
      nativePushToken: token,
      lastError: null,
    });
  },
  setDenied: () => {
    set({
      permissionStatus: "denied",
      registrationStatus: "denied",
      lastError: null,
      nativePushToken: null,
      registeredDeviceId: null,
    });
  },
  setRegistered: ({ token, registeredDeviceId, syncedAt }) => {
    set({
      permissionStatus: "granted",
      registrationStatus: "registered",
      nativePushToken: token,
      registeredDeviceId,
      lastError: null,
      lastSyncedAt: syncedAt,
    });
  },
  setError: (message) => {
    set({
      permissionStatus: "unknown",
      registrationStatus: "error",
      lastError: message,
    });
  },
}));
