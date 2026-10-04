import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

import type { AuthSession } from "@/src/features/auth/types";
import { logLifecycleEvent } from "@/src/lib/debug/lifecycle-log";

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
    logLifecycleEvent("auth", "persist.clear");
    await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
    return;
  }

  logLifecycleEvent("auth", "persist.write", {
    userId: session.user.id,
  });
  await SecureStore.setItemAsync(AUTH_SESSION_KEY, JSON.stringify(session));
}

export async function readStoredAuthSession(): Promise<AuthSession | null> {
  try {
    const rawSession = await SecureStore.getItemAsync(AUTH_SESSION_KEY);
    logLifecycleEvent("auth", "persist.read", {
      foundSession: Boolean(rawSession),
    });
    return rawSession ? (JSON.parse(rawSession) as AuthSession) : null;
  } catch (error) {
    logLifecycleEvent("auth", "persist.read_failed", {
      message: error instanceof Error ? error.message : "unknown error",
    });
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isHydrated: false,
  session: null,
  hydrate: async () => {
    logLifecycleEvent("auth", "hydrate.start");
    try {
      const session = await readStoredAuthSession();
      if (!session) {
        logLifecycleEvent("auth", "hydrate.empty");
        set({ isHydrated: true, session: null });
        return;
      }

      logLifecycleEvent("auth", "hydrate.restored", {
        userId: session.user.id,
      });
      set({ isHydrated: true, session });
    } catch (error) {
      logLifecycleEvent("auth", "hydrate.failed", {
        message: error instanceof Error ? error.message : "unknown error",
      });
      set({ isHydrated: true, session: null });
    }
  },
  setSession: async (session) => {
    await writeStoredAuthSession(session);
    logLifecycleEvent("auth", "session.set", {
      userId: session.user.id,
    });
    set({ isHydrated: true, session });
  },
  setUser: async (user) => {
    const session = get().session;
    if (!session) {
      logLifecycleEvent("auth", "session.set_user_skipped");
      return;
    }

    const nextSession = { ...session, user };
    await writeStoredAuthSession(nextSession);
    logLifecycleEvent("auth", "session.user_updated", {
      userId: user.id,
    });
    set({ isHydrated: true, session: nextSession });
  },
  clearSession: async () => {
    await writeStoredAuthSession(null);
    logLifecycleEvent("auth", "session.cleared");
    set({ isHydrated: true, session: null });
  },
}));
