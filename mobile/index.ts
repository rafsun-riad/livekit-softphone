import {
  getMessaging,
  setBackgroundMessageHandler,
} from "@react-native-firebase/messaging";

import { handleFirebaseBackgroundMessage } from "@/src/lib/notifications/firebase-messaging";

setBackgroundMessageHandler(getMessaging(), handleFirebaseBackgroundMessage);

import "expo-router/entry";
