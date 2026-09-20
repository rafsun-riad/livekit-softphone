import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidVisibility,
  EventType,
  type Event,
} from "@notifee/react-native";
import { router } from "expo-router";
import { Platform } from "react-native";
import RNCallKeep, { CONSTANTS } from "react-native-callkeep";

import { buildCallRoute } from "@/src/features/calls/routes";
import type { CallRecord } from "@/src/features/calls/types";
import {
  getCallInBackground,
  performBackgroundCallAction,
} from "@/src/lib/calls/background-call-actions";
import {
  parseNotificationCallIntent,
  type NotificationCallIntent,
} from "@/src/lib/notifications/call-intents";

const INCOMING_CALL_CHANNEL_ID = "incoming-calls";
const ACTIVE_CALL_SERVICE_CHANNEL_ID = "active-calls-service";

let didSetupCallKeep = false;

function getCallKeepEndReason(callState: CallRecord["state"]) {
  switch (callState) {
    case "rejected":
    case "cancelled":
      return CONSTANTS.END_CALL_REASONS.DECLINED_ELSEWHERE;
    case "timed_out":
      return CONSTANTS.END_CALL_REASONS.UNANSWERED;
    case "busy":
    case "failed":
      return CONSTANTS.END_CALL_REASONS.FAILED;
    default:
      return CONSTANTS.END_CALL_REASONS.REMOTE_ENDED;
  }
}

function normalizeCallKeepEndReason(reason: number) {
  return reason;
}

export async function ensureIncomingCallChannelsAsync() {
  await notifee.createChannel({
    id: INCOMING_CALL_CHANNEL_ID,
    name: "Incoming calls",
    importance: AndroidImportance.HIGH,
    vibration: true,
    visibility: AndroidVisibility.PUBLIC,
  });

  await notifee.createChannel({
    id: ACTIVE_CALL_SERVICE_CHANNEL_ID,
    name: "Active calls",
    importance: AndroidImportance.DEFAULT,
    visibility: AndroidVisibility.PUBLIC,
  });
}

export async function ensureNativeCallingReadyAsync() {
  if (Platform.OS !== "android") {
    return;
  }

  await ensureIncomingCallChannelsAsync();

  if (didSetupCallKeep) {
    RNCallKeep.setAvailable(true);
    return;
  }

  await RNCallKeep.setup({
    ios: {
      appName: "LiveKit Softphone",
      includesCallsInRecents: false,
      maximumCallGroups: "1",
      maximumCallsPerCallGroup: "1",
      supportsVideo: true,
    },
    android: {
      additionalPermissions: [],
      alertDescription:
        "LiveKit Softphone needs call access to display incoming calls.",
      alertTitle: "Enable phone account",
      cancelButton: "Cancel",
      foregroundService: {
        channelId: ACTIVE_CALL_SERVICE_CHANNEL_ID,
        channelName: "Active calls",
        notificationTitle: "LiveKit Softphone call in progress",
      },
      okButton: "Continue",
    },
  });

  RNCallKeep.setAvailable(true);
  didSetupCallKeep = true;
}

export async function cancelIncomingCallNotification(callId: string) {
  await notifee.cancelNotification(callId);
}

export async function dismissNativeIncomingCallUi(
  callId: string,
  reason = normalizeCallKeepEndReason(CONSTANTS.END_CALL_REASONS.REMOTE_ENDED),
) {
  await cancelIncomingCallNotification(callId);

  try {
    RNCallKeep.reportEndCallWithUUID(
      callId,
      normalizeCallKeepEndReason(reason),
    );
  } catch {
    RNCallKeep.endCall(callId);
  }
}

export async function markNativeCallActive(callId: string) {
  await cancelIncomingCallNotification(callId);
  RNCallKeep.setCurrentCallActive(callId);
}

export async function showIncomingCallUi(intent: NotificationCallIntent) {
  if (Platform.OS !== "android") {
    return;
  }

  await ensureNativeCallingReadyAsync();
  await notifee.displayNotification({
    id: intent.callId,
    title: intent.initiatorName,
    body: `Incoming ${intent.callType} call`,
    data: {
      call_id: intent.callId,
      call_type: intent.callType,
      event_type: intent.eventType,
      initiator_id: intent.initiatorId ?? "",
      initiator_name: intent.initiatorName,
    },
    android: {
      actions: [
        {
          pressAction: { id: "accept-call" },
          title: "Accept",
        },
        {
          pressAction: { id: "reject-call" },
          title: "Reject",
        },
      ],
      category: AndroidCategory.CALL,
      channelId: INCOMING_CALL_CHANNEL_ID,
      fullScreenAction: { id: "incoming-call-fullscreen" },
      importance: AndroidImportance.HIGH,
      ongoing: true,
      pressAction: { id: "default" },
      showChronometer: true,
      smallIcon: "ic_launcher_monochrome",
      timestamp: Date.now(),
      visibility: AndroidVisibility.PUBLIC,
    },
  });
  RNCallKeep.displayIncomingCall(
    intent.callId,
    intent.initiatorName,
    intent.initiatorName,
    "generic",
    intent.callType === "video",
  );
}

export async function syncNativeCallUi(call: CallRecord) {
  if (["accepted", "connecting", "connected"].includes(call.state)) {
    await markNativeCallActive(call.id);
    return;
  }

  if (
    ["ended", "rejected", "cancelled", "busy", "failed", "timed_out"].includes(
      call.state,
    )
  ) {
    await dismissNativeIncomingCallUi(
      call.id,
      getCallKeepEndReason(call.state),
    );
  }
}

async function handleCallActionPress(
  intent: NotificationCallIntent,
  actionId: string,
) {
  if (actionId === "reject-call") {
    await performBackgroundCallAction(intent.callId, "reject").catch(
      () => null,
    );
    await dismissNativeIncomingCallUi(
      intent.callId,
      normalizeCallKeepEndReason(CONSTANTS.END_CALL_REASONS.DECLINED_ELSEWHERE),
    );
    return;
  }

  if (actionId === "accept-call") {
    await performBackgroundCallAction(intent.callId, "accept").catch(
      () => null,
    );
    RNCallKeep.answerIncomingCall(intent.callId);
    await markNativeCallActive(intent.callId);
    RNCallKeep.backToForeground();
    router.push(buildCallRoute("incoming", intent.callId));
  }
}

export async function handleIncomingCallNotificationEvent(event: Event) {
  const detail = event.detail;
  const intent = parseNotificationCallIntent(detail.notification?.data);

  if (!intent) {
    return;
  }

  if (event.type === EventType.ACTION_PRESS && detail.pressAction?.id) {
    await handleCallActionPress(intent, detail.pressAction.id);
    return;
  }

  if (event.type === EventType.PRESS) {
    RNCallKeep.backToForeground();
    router.push(buildCallRoute("incoming", intent.callId));
  }
}

export async function routeInitialNativeCallIntent() {
  const initialNotification = await notifee.getInitialNotification();
  const notificationIntent = parseNotificationCallIntent(
    initialNotification?.notification?.data,
  );

  if (notificationIntent?.callId) {
    router.push(buildCallRoute("incoming", notificationIntent.callId));
    return notificationIntent.callId;
  }

  const initialEvents = await RNCallKeep.getInitialEvents();
  const initialEvent = initialEvents.find(
    (event) =>
      event.name === "RNCallKeepPerformAnswerCallAction" ||
      event.name === "RNCallKeepPerformEndCallAction",
  );

  if (initialEvent?.data?.callUUID) {
    router.push(buildCallRoute("incoming", initialEvent.data.callUUID));
    RNCallKeep.clearInitialEvents();
    return initialEvent.data.callUUID;
  }

  return null;
}

export async function handleNativeAnswerCall(callId: string) {
  const call = await performBackgroundCallAction(callId, "accept").catch(
    () => null,
  );
  if (!call) {
    return null;
  }

  await markNativeCallActive(callId);
  RNCallKeep.backToForeground();
  router.replace(buildCallRoute("incoming", callId));
  return call;
}

export async function handleNativeEndCall(callId: string) {
  const call = await getCallInBackground(callId).catch(() => null);

  if (call && ["accepted", "connecting", "connected"].includes(call.state)) {
    await performBackgroundCallAction(callId, "end").catch(() => null);
  } else {
    await performBackgroundCallAction(callId, "reject").catch(() => null);
  }

  await dismissNativeIncomingCallUi(
    callId,
    normalizeCallKeepEndReason(CONSTANTS.END_CALL_REASONS.DECLINED_ELSEWHERE),
  );
}
