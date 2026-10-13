import { Stack } from "expo-router";

export default function ContactDetailLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: "#020617",
        },
      }}
    >
      <Stack.Screen name="[contactId]" />
    </Stack>
  );
}
