import { PermissionsAndroid, Platform } from "react-native";

export type CallMediaPermissionStatus = {
  granted: boolean;
  missingPermissions: string[];
};

function getRequiredPermissions(callType: "audio" | "video") {
  const permissions = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];

  if (callType === "video") {
    permissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);
  }

  return permissions;
}

function humanizePermission(permission: string) {
  if (permission === PermissionsAndroid.PERMISSIONS.CAMERA) {
    return "camera";
  }

  if (permission === PermissionsAndroid.PERMISSIONS.RECORD_AUDIO) {
    return "microphone";
  }

  return permission;
}

export async function requestCallMediaPermissions(
  callType: "audio" | "video",
): Promise<CallMediaPermissionStatus> {
  if (Platform.OS !== "android") {
    return { granted: true, missingPermissions: [] };
  }

  const requiredPermissions = getRequiredPermissions(callType);
  const currentStatuses =
    await PermissionsAndroid.requestMultiple(requiredPermissions);

  const missingPermissions = requiredPermissions
    .filter(
      (permission) =>
        currentStatuses[permission] !== PermissionsAndroid.RESULTS.GRANTED,
    )
    .map(humanizePermission);

  return {
    granted: missingPermissions.length === 0,
    missingPermissions,
  };
}
