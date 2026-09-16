import type { RemoteMessage } from "@react-native-firebase/messaging";

export async function handleFirebaseBackgroundMessage(
  remoteMessage: RemoteMessage,
) {
  console.log("Background FCM message received", {
    data: remoteMessage.data,
    from: remoteMessage.from,
    messageId: remoteMessage.messageId,
  });
}
