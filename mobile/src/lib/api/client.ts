import { requireApiUrl } from "@/src/config/env";
import type { AuthSession } from "@/src/features/auth/types";
import { useAuthStore } from "@/src/stores/auth-store";

type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

type APIErrorShape = {
  code?: string;
  message?: string;
  details?: unknown;
};

type APIRequestOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, JSONValue> | null;
  accessToken?: string | null;
};

export class APIError extends Error {
  status: number;
  code: string;
  details: unknown;

  constructor({
    status,
    code,
    message,
    details,
  }: {
    status: number;
    code: string;
    message: string;
    details: unknown;
  }) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : null;
}

function buildBody(
  body: APIRequestOptions["body"],
  headers: Headers,
): BodyInit | undefined {
  if (body == null) {
    return undefined;
  }

  if (
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    typeof body === "string"
  ) {
    return body;
  }

  headers.set("Content-Type", "application/json");
  return JSON.stringify(body);
}

export async function apiRequest<T>(
  path: string,
  { accessToken, headers: rawHeaders, body, ...init }: APIRequestOptions = {},
): Promise<T> {
  const headers = new Headers(rawHeaders);
  headers.set("Accept", "application/json");

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${requireApiUrl()}${path}`, {
    ...init,
    headers,
    body: buildBody(body, headers),
  });

  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    const payload = (responseBody ?? {}) as APIErrorShape;
    throw new APIError({
      status: response.status,
      code: payload.code ?? "request_failed",
      message: payload.message ?? "Request failed.",
      details: payload.details ?? null,
    });
  }

  return responseBody as T;
}

async function refreshAuthSession(): Promise<AuthSession | null> {
  const { clearSession, session, setSession } = useAuthStore.getState();

  if (!session?.device_session_token) {
    return null;
  }

  try {
    const refreshedSession = await apiRequest<AuthSession>(
      "/api/auth/refresh/",
      {
        method: "POST",
        body: {
          device_session_token: session.device_session_token,
        },
      },
    );
    await setSession(refreshedSession);
    return refreshedSession;
  } catch {
    await clearSession();
    return null;
  }
}

export async function authenticatedRequest<T>(
  path: string,
  options: Omit<APIRequestOptions, "accessToken"> = {},
): Promise<T> {
  const session = useAuthStore.getState().session;

  if (!session) {
    throw new APIError({
      status: 401,
      code: "not_authenticated",
      message: "You must sign in first.",
      details: null,
    });
  }

  try {
    return await apiRequest<T>(path, {
      ...options,
      accessToken: session.access_token,
    });
  } catch (error) {
    if (!(error instanceof APIError) || error.status !== 401) {
      throw error;
    }

    const refreshedSession = await refreshAuthSession();
    if (!refreshedSession) {
      throw error;
    }

    return apiRequest<T>(path, {
      ...options,
      accessToken: refreshedSession.access_token,
    });
  }
}

export function getAPIErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    if (error.details && typeof error.details === "object") {
      for (const value of Object.values(
        error.details as Record<string, unknown>,
      )) {
        if (Array.isArray(value) && typeof value[0] === "string") {
          return value[0];
        }
        if (typeof value === "string") {
          return value;
        }
      }
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}
