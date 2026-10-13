import type { Href } from "expo-router";

type MessageThreadRouteParams = {
  contactUserId: string;
  contactName?: string;
  contactPhone?: string;
};

export function buildMessageThreadRoute({
  contactUserId,
  contactName,
  contactPhone,
}: MessageThreadRouteParams): Href {
  const params = new URLSearchParams({
    contactName: contactName ?? "",
    contactPhone: contactPhone ?? "",
  });

  return `/(app)/messages/${contactUserId}?${params.toString()}` as Href;
}
