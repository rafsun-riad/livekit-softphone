const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL
    ? trimTrailingSlash(process.env.EXPO_PUBLIC_API_URL)
    : "",
  appEnv: process.env.EXPO_PUBLIC_APP_ENV ?? "development",
  livekitUrl: process.env.EXPO_PUBLIC_LIVEKIT_URL ?? "",
  wsUrl: process.env.EXPO_PUBLIC_WS_URL ?? "",
} as const;

export function requireApiUrl(): string {
  if (!env.apiUrl) {
    throw new Error("EXPO_PUBLIC_API_URL is not configured.");
  }

  return env.apiUrl;
}
