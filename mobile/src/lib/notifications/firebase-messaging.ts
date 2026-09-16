import type { RemoteMessage } from "@react-native-firebase/messaging";

import { parseNotificationCallIntent } from "@/src/lib/notifications/call-intents";

export async function handleFirebaseBackgroundMessage(
  remoteMessage: RemoteMessage,
) {
  const intent = parseNotificationCallIntent(remoteMessage.data);

  console.log("Background FCM message received", {
    callIntent: intent,
    data: remoteMessage.data,
    from: remoteMessage.from,
    messageId: remoteMessage.messageId,
  });
}
