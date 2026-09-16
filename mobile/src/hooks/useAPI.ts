import {
  apiRequest,
  authenticatedRequest,
  type APIRequestOptions,
  type AuthenticatedRequestOptions,
  type JSONValue,
} from "@/src/lib/api/client";

type BodyPayload = BodyInit | Record<string, JSONValue> | null;
type AuthVerbOptions = Omit<AuthenticatedRequestOptions, "method" | "body">;
type PublicVerbOptions = Omit<
  APIRequestOptions,
  "method" | "body" | "accessToken"
>;

export function useAPI() {
  const get = <TResponse>(path: string, options: AuthVerbOptions = {}) => {
    return authenticatedRequest<TResponse>(path, {
      ...options,
      method: "GET",
    });
  };

  const post = <TResponse>(
    path: string,
    body?: BodyPayload,
    options: AuthVerbOptions = {},
  ) => {
    return authenticatedRequest<TResponse>(path, {
      ...options,
      method: "POST",
      body,
    });
  };

  const put = <TResponse>(
    path: string,
    body?: BodyPayload,
    options: AuthVerbOptions = {},
  ) => {
    return authenticatedRequest<TResponse>(path, {
      ...options,
      method: "PUT",
      body,
    });
  };

  const patch = <TResponse>(
    path: string,
    body?: BodyPayload,
    options: AuthVerbOptions = {},
  ) => {
    return authenticatedRequest<TResponse>(path, {
      ...options,
      method: "PATCH",
      body,
    });
  };

  const del = <TResponse>(path: string, options: AuthVerbOptions = {}) => {
    return authenticatedRequest<TResponse>(path, {
      ...options,
      method: "DELETE",
    });
  };

  const publicGet = <TResponse>(
    path: string,
    options: PublicVerbOptions = {},
  ) => {
    return apiRequest<TResponse>(path, {
      ...options,
      method: "GET",
    });
  };

  const publicPost = <TResponse>(
    path: string,
    body?: BodyPayload,
    options: PublicVerbOptions = {},
  ) => {
    return apiRequest<TResponse>(path, {
      ...options,
      method: "POST",
      body,
    });
  };

  const publicPut = <TResponse>(
    path: string,
    body?: BodyPayload,
    options: PublicVerbOptions = {},
  ) => {
    return apiRequest<TResponse>(path, {
      ...options,
      method: "PUT",
      body,
    });
  };

  const publicPatch = <TResponse>(
    path: string,
    body?: BodyPayload,
    options: PublicVerbOptions = {},
  ) => {
    return apiRequest<TResponse>(path, {
      ...options,
      method: "PATCH",
      body,
    });
  };

  const publicDelete = <TResponse>(
    path: string,
    options: PublicVerbOptions = {},
  ) => {
    return apiRequest<TResponse>(path, {
      ...options,
      method: "DELETE",
    });
  };

  return {
    delete: del,
    get,
    patch,
    post,
    put,
    public: {
      delete: publicDelete,
      get: publicGet,
      patch: publicPatch,
      post: publicPost,
      put: publicPut,
    },
  };
}
