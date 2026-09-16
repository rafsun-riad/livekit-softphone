import { useQueryClient } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { PropsWithChildren, useEffect, useEffectEvent } from "react";

import {
  syncCurrentDeviceRegistration,
  type PushSyncResult,
} from "@/src/lib/notifications/push-registration";
import type { AuthState } from "@/src/stores/auth-store";
import { useAuthStore } from "@/src/stores/auth-store";
import type { PushState } from "@/src/stores/push-store";
import { usePushStore } from "@/src/stores/push-store";

function applyPushSyncResult(
  result: PushSyncResult,
  setDenied: PushState["setDenied"],
  setRegistered: PushState["setRegistered"],
) {
  if (result.permissionStatus !== "granted" || !result.registeredDevice) {
    setDenied();
    return;
  }

  setRegistered({
    token: result.nativePushToken ?? "",
    registeredDeviceId: result.registeredDevice.id,
    syncedAt: new Date().toISOString(),
  });
}

export function applyManualPushSyncResult(result: PushSyncResult) {
  const pushStore = usePushStore.getState();
  applyPushSyncResult(result, pushStore.setDenied, pushStore.setRegistered);
}

export function PushNotificationsProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const session = useAuthStore((state: AuthState) => state.session);
  const resetPushState = usePushStore((state: PushState) => state.reset);
  const setChecking = usePushStore((state: PushState) => state.setChecking);
  const setDenied = usePushStore((state: PushState) => state.setDenied);
  const setError = usePushStore((state: PushState) => state.setError);
  const setRegistered = usePushStore((state: PushState) => state.setRegistered);
  const setSyncing = usePushStore((state: PushState) => state.setSyncing);

  const syncRegistration = useEffectEvent(async (existingToken?: string) => {
    setChecking();

    try {
      if (existingToken) {
        setSyncing(existingToken);
      }

      const result = await syncCurrentDeviceRegistration(existingToken);
      applyPushSyncResult(result, setDenied, setRegistered);

      if (result.registeredDevice) {
        await queryClient.invalidateQueries({ queryKey: ["devices"] });
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Push registration failed.",
      );
    }
  });

  useEffect(() => {
    if (!session) {
      resetPushState();
      return;
    }

    void syncRegistration();

    const subscription = Notifications.addPushTokenListener((token) => {
      const nextToken =
        typeof token.data === "string" ? token.data : String(token.data);
      void syncRegistration(nextToken);
    });

    return () => {
      subscription.remove();
    };
  }, [resetPushState, session, syncRegistration]);

  return children;
}
