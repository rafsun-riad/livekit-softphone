export type RegisteredDevice = {
  id: string;
  platform: string;
  push_provider: string;
  installation_id: string;
  push_token: string;
  app_version: string;
  device_label: string;
  last_seen_at: string;
  is_active: boolean;
  invalidated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RegisterDevicePayload = {
  platform: "android" | "ios";
  pushProvider?: "fcm";
  deviceSessionToken?: string;
  installationId: string;
  pushToken: string;
  appVersion: string;
  deviceLabel?: string;
};
