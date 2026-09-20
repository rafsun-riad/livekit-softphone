import { refreshDeviceSession } from "@/src/features/auth/api";
import type { AuthSession } from "@/src/features/auth/types";
import type { CallRecord } from "@/src/features/calls/types";
import { APIError, apiRequest } from "@/src/lib/api/client";
import {
  readStoredAuthSession,
  useAuthStore,
  writeStoredAuthSession,
} from "@/src/stores/auth-store";

type CallAction = "accept" | "reject" | "end";

async function syncSession(session: AuthSession | null) {
  if (!session) {
    await useAuthStore.getState().clearSession();
    return null;
  }

  await writeStoredAuthSession(session);
  await useAuthStore.getState().setSession(session);
  return session;
}

async function runWithStoredSession<T>(
  request: (accessToken: string) => Promise<T>,
): Promise<T> {
  const session = await readStoredAuthSession();
  if (!session) {
    throw new APIError({
      status: 401,
      code: "not_authenticated",
      message: "You must sign in first.",
      details: null,
    });
  }

  try {
    return await request(session.access_token);
  } catch (error) {
    if (!(error instanceof APIError) || error.status !== 401) {
      throw error;
    }

    const refreshedSession = await refreshDeviceSession(
      session.device_session_token,
    ).catch(async () => {
      await syncSession(null);
      return null;
    });

    if (!refreshedSession) {
      throw error;
    }

    await syncSession(refreshedSession);
    return request(refreshedSession.access_token);
  }
}

export function getCallInBackground(callId: string) {
  return runWithStoredSession((accessToken) =>
    apiRequest<CallRecord>(`/api/calls/${callId}/`, {
      accessToken,
      method: "GET",
    }),
  );
}

export function performBackgroundCallAction(
  callId: string,
  action: CallAction,
) {
  return runWithStoredSession((accessToken) =>
    apiRequest<CallRecord>(`/api/calls/${callId}/${action}/`, {
      accessToken,
      method: "POST",
    }),
  );
}
