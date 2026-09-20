import { registerGlobals } from "@livekit/react-native";
import notifee from "@notifee/react-native";
import {
  getMessaging,
  setBackgroundMessageHandler,
} from "@react-native-firebase/messaging";

import { handleIncomingCallNotificationEvent } from "@/src/lib/calls/native-call-ui";
import { handleFirebaseBackgroundMessage } from "@/src/lib/notifications/firebase-messaging";

registerGlobals();

setBackgroundMessageHandler(getMessaging(), handleFirebaseBackgroundMessage);
notifee.onBackgroundEvent(handleIncomingCallNotificationEvent);

import "expo-router/entry";
