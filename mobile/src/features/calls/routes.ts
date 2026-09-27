import type { Href } from "expo-router";

import type { CallRecord } from "./types";

type PendingOutgoingCallRouteParams = {
  recipientUserId: string;
  callType: "audio" | "video";
  recipientName?: string;
  recipientPhone?: string;
};

export function buildCallRoute(
  screen: "incoming" | "outgoing" | "audio" | "video",
  callId: string,
): Href {
  return `/(app)/calls/${screen}?callId=${callId}` as Href;
}

export function buildActiveCallRoute(call: CallRecord) {
  return buildCallRoute(
    call.call_type === "video" ? "video" : "audio",
    call.id,
  );
}

export function buildPendingOutgoingCallRoute({
  recipientUserId,
  callType,
  recipientName,
  recipientPhone,
}: PendingOutgoingCallRouteParams): Href {
  const params = new URLSearchParams({
    recipientUserId,
    callType,
    recipientName: recipientName ?? "",
    recipientPhone: recipientPhone ?? "",
  });

  return `/(app)/calls/outgoing?${params.toString()}` as Href;
}

export function normalizeCallIdParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}
