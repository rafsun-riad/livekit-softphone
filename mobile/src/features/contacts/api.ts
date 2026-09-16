import {
  authenticatedRequest,
  type AuthenticatedRequestOptions,
} from "@/src/lib/api/client";

import type { Contact, DirectoryUser } from "./types";

type RequestOptions = Omit<AuthenticatedRequestOptions, "method" | "body">;

export function getContacts(requestOptions: RequestOptions = {}) {
  return authenticatedRequest<Contact[]>("/api/contacts/", {
    ...requestOptions,
    method: "GET",
  });
}

export function createContact(targetUserId: string) {
  return authenticatedRequest<Contact>("/api/contacts/", {
    method: "POST",
    body: {
      target_user_id: targetUserId,
    },
  });
}

export function deleteContact(contactId: string) {
  return authenticatedRequest<void>(`/api/contacts/${contactId}/`, {
    method: "DELETE",
  });
}

export function searchUsers(
  query: string,
  requestOptions: RequestOptions = {},
) {
  const params = new URLSearchParams({ q: query });
  return authenticatedRequest<DirectoryUser[]>(
    `/api/users/search/?${params.toString()}`,
    {
      ...requestOptions,
      method: "GET",
    },
  );
}
