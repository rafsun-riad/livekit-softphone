import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren } from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { GluestackUIProvider } from "@/src/components/ui/gluestack-ui-provider";
import { PushNotificationsProvider } from "@/src/providers/push-notifications-provider";

type AppProvidersProps = PropsWithChildren<{
  colorMode?: "light" | "dark" | "system";
}>;

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      retry: false,
    },
    queries: {
      retry: false,
      staleTime: 30_000,
    },
  },
});

export function AppProviders({
  children,
  colorMode = "dark",
}: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <GluestackUIProvider mode={colorMode}>
            <PushNotificationsProvider>{children}</PushNotificationsProvider>
          </GluestackUIProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
