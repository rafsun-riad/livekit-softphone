import { Redirect, Stack } from "expo-router";

import type { AuthState } from "@/src/stores/auth-store";
import { useAuthStore } from "@/src/stores/auth-store";

export default function AppLayout() {
  const isHydrated = useAuthStore((state: AuthState) => state.isHydrated);
  const session = useAuthStore((state: AuthState) => state.session);

  if (!isHydrated) {
    return null;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
