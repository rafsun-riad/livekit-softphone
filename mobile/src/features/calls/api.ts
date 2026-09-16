import {
  authenticatedRequest,
  type AuthenticatedRequestOptions,
} from "@/src/lib/api/client";

import type { CallRecord, CreateCallPayload, JoinMediaResponse } from "./types";

type RequestOptions = Omit<AuthenticatedRequestOptions, "method" | "body">;

export function createCall(payload: CreateCallPayload) {
  return authenticatedRequest<CallRecord>("/api/calls/", {
    method: "POST",
    body: {
      recipient_user_id: payload.recipientUserId,
      call_type: payload.callType,
    },
  });
}

export function getCall(callId: string, requestOptions: RequestOptions = {}) {
  return authenticatedRequest<CallRecord>(`/api/calls/${callId}/`, {
    ...requestOptions,
    method: "GET",
  });
}

export function acceptCall(callId: string) {
  return authenticatedRequest<CallRecord>(`/api/calls/${callId}/accept/`, {
    method: "POST",
  });
}

export function rejectCall(callId: string) {
  return authenticatedRequest<CallRecord>(`/api/calls/${callId}/reject/`, {
    method: "POST",
  });
}

export function cancelCall(callId: string) {
  return authenticatedRequest<CallRecord>(`/api/calls/${callId}/cancel/`, {
    method: "POST",
  });
}

export function endCall(callId: string) {
  return authenticatedRequest<CallRecord>(`/api/calls/${callId}/end/`, {
    method: "POST",
  });
}

export function joinMedia(callId: string) {
  return authenticatedRequest<JoinMediaResponse>(
    `/api/calls/${callId}/join-media/`,
    {
      method: "POST",
    },
  );
}
