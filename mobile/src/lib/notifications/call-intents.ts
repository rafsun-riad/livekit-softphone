type NotificationData = Record<string, unknown>;

export type NotificationCallIntent = {
  callId: string;
  callType: "audio" | "video";
  eventType: string;
  initiatorId: string | null;
  initiatorName: string;
};

export function parseNotificationCallIntent(
  data: NotificationData | null | undefined,
): NotificationCallIntent | null {
  if (!data) {
    return null;
  }

  const callId = typeof data.call_id === "string" ? data.call_id : null;
  const callType = data.call_type === "video" ? "video" : "audio";
  const eventType =
    typeof data.event_type === "string" ? data.event_type : "call.incoming";
  const initiatorId =
    typeof data.initiator_id === "string" ? data.initiator_id : null;
  const initiatorName =
    typeof data.initiator_name === "string"
      ? data.initiator_name
      : "Incoming caller";

  if (!callId) {
    return null;
  }

  return {
    callId,
    callType,
    eventType,
    initiatorId,
    initiatorName,
  };
}
