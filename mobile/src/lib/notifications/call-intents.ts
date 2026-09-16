type NotificationData = Record<string, unknown>;

export type NotificationCallIntent = {
  callId: string;
  eventType: string;
};

export function parseNotificationCallIntent(
  data: NotificationData | null | undefined,
): NotificationCallIntent | null {
  if (!data) {
    return null;
  }

  const callId = typeof data.call_id === "string" ? data.call_id : null;
  const eventType =
    typeof data.event_type === "string" ? data.event_type : "call.incoming";

  if (!callId) {
    return null;
  }

  return {
    callId,
    eventType,
  };
}
