import type { RemoteMessage } from "@react-native-firebase/messaging";

import { showIncomingCallUi } from "@/src/lib/calls/native-call-ui";
import { logLifecycleEvent } from "@/src/lib/debug/lifecycle-log";
import { parseNotificationCallIntent } from "@/src/lib/notifications/call-intents";

export async function handleFirebaseBackgroundMessage(
  remoteMessage: RemoteMessage,
) {
  const intent = parseNotificationCallIntent(remoteMessage.data);

  logLifecycleEvent("fcm", "background_message", {
    eventType: intent?.eventType ?? null,
    hasCallId: Boolean(intent?.callId),
    messageId: remoteMessage.messageId ?? null,
  });

  if (intent?.eventType === "call.incoming") {
    logLifecycleEvent("fcm", "render_incoming_call_ui", {
      callId: intent.callId,
    });
    await showIncomingCallUi(intent);
  }
}
