import {
  authenticatedRequest,
  type AuthenticatedRequestOptions,
} from "@/src/lib/api/client";

import type { Contact, ContactRelationship, DirectoryUser } from "./types";

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

function targetUserPayload(targetUserId: string) {
  return {
    target_user_id: targetUserId,
  };
}

export function saveContact(targetUserId: string) {
  return authenticatedRequest<Contact>("/api/contacts/save/", {
    method: "POST",
    body: targetUserPayload(targetUserId),
  });
}

export function blockContact(targetUserId: string) {
  return authenticatedRequest<Contact>("/api/contacts/block/", {
    method: "POST",
    body: targetUserPayload(targetUserId),
  });
}

export function unblockContact(targetUserId: string) {
  return authenticatedRequest<{ status: "rejected"; contact_id: string }>(
    "/api/contacts/unblock/",
    {
      method: "POST",
      body: targetUserPayload(targetUserId),
    },
  );
}

export function getContactRelationship(
  targetUserId: string,
  requestOptions: RequestOptions = {},
) {
  return authenticatedRequest<ContactRelationship>(
    `/api/contacts/relationship/${targetUserId}/`,
    {
      ...requestOptions,
      method: "GET",
    },
  );
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
