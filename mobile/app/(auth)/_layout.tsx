import { Redirect, Stack } from "expo-router";

import type { AuthState } from "@/src/stores/auth-store";
import { useAuthStore } from "@/src/stores/auth-store";

export default function AuthLayout() {
  const isHydrated = useAuthStore((state: AuthState) => state.isHydrated);
  const session = useAuthStore((state: AuthState) => state.session);

  if (!isHydrated) {
    return null;
  }

  if (session) {
    return <Redirect href="/(app)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
