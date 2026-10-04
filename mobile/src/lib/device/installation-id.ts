import * as SecureStore from "expo-secure-store";

const INSTALLATION_ID_KEY = "livekit-softphone-installation-id";

function createFallbackInstallationId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function createInstallationId() {
  return globalThis.crypto?.randomUUID?.() ?? createFallbackInstallationId();
}

export async function getInstallationId() {
  const existingInstallationId =
    await SecureStore.getItemAsync(INSTALLATION_ID_KEY);
  if (existingInstallationId) {
    return existingInstallationId;
  }

  const nextInstallationId = createInstallationId();
  await SecureStore.setItemAsync(INSTALLATION_ID_KEY, nextInstallationId);
  return nextInstallationId;
}
