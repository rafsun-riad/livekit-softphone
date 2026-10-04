import notifee from "@notifee/react-native";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { PropsWithChildren, useEffect, useEffectEvent } from "react";
import { AppState } from "react-native";
import RNCallKeep from "react-native-callkeep";

import { buildCallRoute } from "@/src/features/calls/routes";
import type {
  CallRecord,
  PresencePayload,
  SocketEventType,
} from "@/src/features/calls/types";
import {
  ensureNativeCallingReadyAsync,
  handleIncomingCallNotificationEvent,
  handleNativeAnswerCall,
  handleNativeEndCall,
  routeInitialNativeCallIntent,
  syncNativeCallUi,
} from "@/src/lib/calls/native-call-ui";
import { logLifecycleEvent } from "@/src/lib/debug/lifecycle-log";
import { parseNotificationCallIntent } from "@/src/lib/notifications/call-intents";
import { socketClient } from "@/src/lib/realtime/socket-client";
import type { AuthState } from "@/src/stores/auth-store";
import { useAuthStore } from "@/src/stores/auth-store";
import { useCallStore } from "@/src/stores/call-store";

export function RealtimeProvider({ children }: PropsWithChildren) {
  const session = useAuthStore((state: AuthState) => state.session);
  const applyPresence = useCallStore((state) => state.applyPresence);
  const resetRealtimeState = useCallStore((state) => state.resetRealtimeState);
  const setIncomingCall = useCallStore((state) => state.setIncomingCall);
  const setSocketStatus = useCallStore((state) => state.setSocketStatus);
  const upsertCall = useCallStore((state) => state.upsertCall);

  const handleSocketEvent = useEffectEvent(
    async (event: { type: SocketEventType | string; payload: unknown }) => {
      logLifecycleEvent("realtime", "socket.event", {
        eventType: event.type,
      });

      if (event.type === "call.incoming") {
        const call = event.payload as CallRecord;
        setIncomingCall(call);
        router.push(buildCallRoute("incoming", call.id));
        return;
      }

      if (event.type === "call.updated" || event.type === "call.ended") {
        const call = event.payload as CallRecord;
        upsertCall(call);
        await syncNativeCallUi(call);
        return;
      }

      if (
        event.type === "presence.user_online" ||
        event.type === "presence.user_offline"
      ) {
        applyPresence(event.type, event.payload as PresencePayload);
        return;
      }
    },
  );

  const handleStatusChange = useEffectEvent(
    (status: "disconnected" | "connecting" | "connected" | "error") => {
      logLifecycleEvent("realtime", "socket.status", { status });
      setSocketStatus(status);
    },
  );

  useEffect(() => {
    const unsubscribeEvents = socketClient.subscribe((event) => {
      void handleSocketEvent(event);
    });
    const unsubscribeStatus = socketClient.subscribeStatus((status) => {
      handleStatusChange(status);
    });

    return () => {
      unsubscribeEvents();
      unsubscribeStatus();
    };
  }, [handleSocketEvent, handleStatusChange]);

  useEffect(() => {
    if (!session?.access_token) {
      logLifecycleEvent("realtime", "disconnect_without_session");
      socketClient.disconnect();
      resetRealtimeState();
      RNCallKeep.setAvailable(false);
      return;
    }

    logLifecycleEvent("realtime", "connect_with_session", {
      userId: session.user.id,
    });
    void ensureNativeCallingReadyAsync();
    socketClient.connect(session.access_token);

    const appStateSubscription = AppState.addEventListener(
      "change",
      (state) => {
        logLifecycleEvent("app", "state.change", { state });
        if (
          state === "active" &&
          useAuthStore.getState().session?.access_token
        ) {
          logLifecycleEvent("realtime", "reconnect_on_active");
          socketClient.connect(useAuthStore.getState().session!.access_token);
        }
      },
    );

    return () => {
      appStateSubscription.remove();
    };
  }, [resetRealtimeState, session]);

  useEffect(() => {
    const handleNotificationIntent = async () => {
      const lastResponse =
        await Notifications.getLastNotificationResponseAsync();
      const intent = parseNotificationCallIntent(
        lastResponse?.notification.request.content.data,
      );
      logLifecycleEvent("notifications", "last_response_checked", {
        hasIntent: Boolean(intent?.callId),
      });
      if (intent?.callId) {
        router.push(buildCallRoute("incoming", intent.callId));
      }

      await routeInitialNativeCallIntent();
    };

    void handleNotificationIntent();

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const intent = parseNotificationCallIntent(
          response.notification.request.content.data,
        );
        logLifecycleEvent("notifications", "response_received", {
          hasIntent: Boolean(intent?.callId),
        });
        if (intent?.callId) {
          router.push(buildCallRoute("incoming", intent.callId));
        }
      });

    const notifeeForegroundSubscription = notifee.onForegroundEvent((event) => {
      void handleIncomingCallNotificationEvent(event);
    });

    const answerCallListener = RNCallKeep.addEventListener(
      "answerCall",
      ({ callUUID }) => {
        void handleNativeAnswerCall(callUUID).then((call) => {
          if (call) {
            upsertCall(call);
          }
        });
      },
    );

    const endCallListener = RNCallKeep.addEventListener(
      "endCall",
      ({ callUUID }) => {
        void handleNativeEndCall(callUUID);
      },
    );

    return () => {
      responseSubscription.remove();
      notifeeForegroundSubscription();
      answerCallListener.remove();
      endCallListener.remove();
    };
  }, [upsertCall]);

  return children;
}
