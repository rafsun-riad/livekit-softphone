import type { Href } from "expo-router";

type ContactDetailRouteParams = {
  contactId: string;
  contactUserId: string;
  contactName?: string;
  contactPhone?: string;
};

export function buildContactDetailRoute({
  contactId,
  contactUserId,
  contactName,
  contactPhone,
}: ContactDetailRouteParams): Href {
  const params = new URLSearchParams({
    contactUserId,
    contactName: contactName ?? "",
    contactPhone: contactPhone ?? "",
  });

  return `/(app)/contact/${contactId}?${params.toString()}` as Href;
}
