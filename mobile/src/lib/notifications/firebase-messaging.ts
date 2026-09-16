import type { FirebaseMessagingTypes } from "@react-native-firebase/messaging";

export async function handleFirebaseBackgroundMessage(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
) {
  console.log("Background FCM message received", {
    data: remoteMessage.data,
    from: remoteMessage.from,
    messageId: remoteMessage.messageId,
  });
}
