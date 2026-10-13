import {
  authenticatedRequest,
  type AuthenticatedRequestOptions,
} from "@/src/lib/api/client";

import type { ConversationRecord, MessageRecord } from "./types";

type RequestOptions = Omit<AuthenticatedRequestOptions, "method" | "body">;

export function listConversations(requestOptions: RequestOptions = {}) {
  return authenticatedRequest<ConversationRecord[]>(
    "/api/messaging/conversations/",
    {
      ...requestOptions,
      method: "GET",
    },
  );
}

export function ensureDirectConversation(targetUserId: string) {
  return authenticatedRequest<ConversationRecord>(
    "/api/messaging/conversations/direct/",
    {
      method: "POST",
      body: {
        target_user_id: targetUserId,
      },
    },
  );
}

export function getConversationMessages(
  conversationId: string,
  requestOptions: RequestOptions = {},
) {
  return authenticatedRequest<MessageRecord[]>(
    `/api/messaging/conversations/${conversationId}/messages/`,
    {
      ...requestOptions,
      method: "GET",
    },
  );
}
