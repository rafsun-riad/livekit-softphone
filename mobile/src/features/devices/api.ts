import { authenticatedRequest } from "@/src/lib/api/client";

import type { RegisterDevicePayload, RegisteredDevice } from "./types";

export function getDevices() {
  return authenticatedRequest<RegisteredDevice[]>("/api/devices/", {
    method: "GET",
  });
}

export function registerDevice(payload: RegisterDevicePayload) {
  return authenticatedRequest<RegisteredDevice>("/api/devices/register/", {
    method: "POST",
    body: {
      platform: payload.platform,
      push_provider: payload.pushProvider ?? "fcm",
      push_token: payload.pushToken,
      app_version: payload.appVersion,
      device_label: payload.deviceLabel ?? "",
    },
  });
}

export function deleteDevice(deviceId: string) {
  return authenticatedRequest<void>(`/api/devices/${deviceId}/`, {
    method: "DELETE",
  });
}
