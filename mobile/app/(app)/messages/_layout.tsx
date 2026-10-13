import { Stack } from "expo-router";

export default function MessageThreadsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: "#020617",
        },
      }}
    >
      <Stack.Screen name="[contactUserId]" />
    </Stack>
  );
}
