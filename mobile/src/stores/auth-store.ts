import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

import type { AuthSession } from "@/src/features/auth/types";

export const AUTH_SESSION_KEY = "livekit-softphone-auth-session";

export type AuthState = {
  isHydrated: boolean;
  session: AuthSession | null;
  hydrate: () => Promise<void>;
  setSession: (session: AuthSession) => Promise<void>;
  setUser: (user: AuthSession["user"]) => Promise<void>;
  clearSession: () => Promise<void>;
};

export async function writeStoredAuthSession(session: AuthSession | null) {
  if (session === null) {
    await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
    return;
  }

  await SecureStore.setItemAsync(AUTH_SESSION_KEY, JSON.stringify(session));
}

export async function readStoredAuthSession(): Promise<AuthSession | null> {
  try {
    const rawSession = await SecureStore.getItemAsync(AUTH_SESSION_KEY);
    return rawSession ? (JSON.parse(rawSession) as AuthSession) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isHydrated: false,
  session: null,
  hydrate: async () => {
    try {
      const session = await readStoredAuthSession();
      if (!session) {
        set({ isHydrated: true, session: null });
        return;
      }

      set({ isHydrated: true, session });
    } catch {
      set({ isHydrated: true, session: null });
    }
  },
  setSession: async (session) => {
    await writeStoredAuthSession(session);
    set({ isHydrated: true, session });
  },
  setUser: async (user) => {
    const session = get().session;
    if (!session) {
      return;
    }

    const nextSession = { ...session, user };
    await writeStoredAuthSession(nextSession);
    set({ isHydrated: true, session: nextSession });
  },
  clearSession: async () => {
    await writeStoredAuthSession(null);
    set({ isHydrated: true, session: null });
  },
}));
