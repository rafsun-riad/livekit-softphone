import { apiRequest, authenticatedRequest } from "@/src/lib/api/client";

import type {
  AuthSession,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from "./types";

export function register(payload: RegisterPayload) {
  return apiRequest<AuthUser>("/api/auth/register/", {
    method: "POST",
    body: {
      phone_number: payload.phoneNumber,
      email: payload.email,
      password: payload.password,
      display_name: payload.displayName,
    },
  });
}

export function login(payload: LoginPayload) {
  return apiRequest<AuthSession>("/api/auth/login/", {
    method: "POST",
    body: {
      phone_number: payload.phoneNumber,
      password: payload.password,
      device_label: payload.deviceLabel ?? "Expo Android Dev Build",
    },
  });
}

export function refreshDeviceSession(deviceSessionToken: string) {
  return apiRequest<AuthSession>("/api/auth/refresh/", {
    method: "POST",
    body: {
      device_session_token: deviceSessionToken,
    },
  });
}

export function logout({
  accessToken,
  deviceSessionToken,
}: {
  accessToken: string;
  deviceSessionToken: string;
}) {
  return apiRequest<{ success: boolean }>("/api/auth/logout/", {
    method: "POST",
    accessToken,
    body: {
      device_session_token: deviceSessionToken,
    },
  });
}

export function getCurrentUser() {
  return authenticatedRequest<AuthUser>("/api/users/me/", {
    method: "GET",
  });
}
