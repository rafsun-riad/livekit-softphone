import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

import type { AuthSession } from "@/src/features/auth/types";

const AUTH_SESSION_KEY = "livekit-softphone-auth-session";

export type AuthState = {
  isHydrated: boolean;
  session: AuthSession | null;
  hydrate: () => Promise<void>;
  setSession: (session: AuthSession) => Promise<void>;
  setUser: (user: AuthSession["user"]) => Promise<void>;
  clearSession: () => Promise<void>;
};

async function writeSession(session: AuthSession | null) {
  if (session === null) {
    await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
    return;
  }

  await SecureStore.setItemAsync(AUTH_SESSION_KEY, JSON.stringify(session));
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isHydrated: false,
  session: null,
  hydrate: async () => {
    try {
      const rawSession = await SecureStore.getItemAsync(AUTH_SESSION_KEY);
      if (!rawSession) {
        set({ isHydrated: true, session: null });
        return;
      }

      set({ isHydrated: true, session: JSON.parse(rawSession) as AuthSession });
    } catch {
      set({ isHydrated: true, session: null });
    }
  },
  setSession: async (session) => {
    await writeSession(session);
    set({ isHydrated: true, session });
  },
  setUser: async (user) => {
    const session = get().session;
    if (!session) {
      return;
    }

    const nextSession = { ...session, user };
    await writeSession(nextSession);
    set({ isHydrated: true, session: nextSession });
  },
  clearSession: async () => {
    await writeSession(null);
    set({ isHydrated: true, session: null });
  },
}));
