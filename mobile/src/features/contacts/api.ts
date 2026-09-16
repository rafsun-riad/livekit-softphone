import { authenticatedRequest } from "@/src/lib/api/client";

import type { Contact, DirectoryUser } from "./types";

export function getContacts() {
  return authenticatedRequest<Contact[]>("/api/contacts/", {
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

export function searchUsers(query: string) {
  const params = new URLSearchParams({ q: query });
  return authenticatedRequest<DirectoryUser[]>(
    `/api/users/search/?${params.toString()}`,
    {
      method: "GET",
    },
  );
}
