import * as Application from "expo-application";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { registerDevice } from "@/src/features/devices/api";
import type { RegisteredDevice } from "@/src/features/devices/types";

export const PUSH_NOTIFICATION_CHANNEL_ID = "incoming-calls";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type PushSyncResult = {
  permissionStatus: "granted" | "denied";
  nativePushToken: string | null;
  registeredDevice: RegisteredDevice | null;
};

function isPermissionGranted(
  status: Notifications.NotificationPermissionsStatus,
): boolean {
  return (
    status.granted ||
    status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function ensureNotificationChannelAsync() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(
    PUSH_NOTIFICATION_CHANNEL_ID,
    {
      name: "Incoming calls",
      description: "Incoming-call and softphone activity notifications.",
      importance: Notifications.AndroidImportance.MAX,
      lightColor: "#22d3ee",
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    },
  );
}

export async function requestNotificationPermissionAsync() {
  await ensureNotificationChannelAsync();

  const existingStatus = await Notifications.getPermissionsAsync();
  if (isPermissionGranted(existingStatus)) {
    return "granted" as const;
  }

  const requestedStatus = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return isPermissionGranted(requestedStatus) ? "granted" : "denied";
}

function getDefaultDeviceLabel() {
  const appName = Application.applicationName ?? "LiveKit Softphone";
  return Platform.OS === "android"
    ? `${appName} Android device`
    : `${appName} iOS device`;
}

function getAppVersion() {
  return Application.nativeApplicationVersion ?? "1.0.0";
}

function normalizeNativePushToken(token: Notifications.DevicePushToken) {
  return typeof token.data === "string" ? token.data : String(token.data);
}

export async function syncCurrentDeviceRegistration(
  existingToken?: string,
): Promise<PushSyncResult> {
  const permissionStatus = await requestNotificationPermissionAsync();
  if (permissionStatus !== "granted") {
    return {
      permissionStatus,
      nativePushToken: null,
      registeredDevice: null,
    };
  }

  const nativePushToken =
    existingToken ??
    normalizeNativePushToken(await Notifications.getDevicePushTokenAsync());
  const registeredDevice = await registerDevice({
    platform: Platform.OS === "ios" ? "ios" : "android",
    pushProvider: "fcm",
    pushToken: nativePushToken,
    appVersion: getAppVersion(),
    deviceLabel: getDefaultDeviceLabel(),
  });

  return {
    permissionStatus,
    nativePushToken,
    registeredDevice,
  };
}
