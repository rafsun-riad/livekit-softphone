import { Stack } from "expo-router";

export default function CallsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: "#020617",
        },
      }}
    >
      <Stack.Screen name="outgoing" />
      <Stack.Screen name="incoming" />
      <Stack.Screen name="audio" />
      <Stack.Screen name="video" />
    </Stack>
  );
}
