import {
  authenticatedRequest,
  type AuthenticatedRequestOptions,
  type JSONValue,
} from "@/src/lib/api/client";

import type { ConversationRecord, MessageRecord } from "./types";

type RequestOptions = Omit<AuthenticatedRequestOptions, "method" | "body">;

type CreateMessagePayload = {
  conversationId: string;
  messageType: MessageRecord["message_type"];
  ciphertext: Record<string, JSONValue>;
  clientMessageId?: string;
};

type MarkConversationReadPayload = {
  conversationId: string;
  messageId?: string;
};

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

export function createMessage(payload: CreateMessagePayload) {
  return authenticatedRequest<MessageRecord>(
    `/api/messaging/conversations/${payload.conversationId}/messages/`,
    {
      method: "POST",
      body: {
        message_type: payload.messageType,
        ciphertext: payload.ciphertext,
        client_message_id: payload.clientMessageId ?? "",
      },
    },
  );
}

export function markConversationRead(payload: MarkConversationReadPayload) {
  return authenticatedRequest<{ updated_count: number }>(
    `/api/messaging/conversations/${payload.conversationId}/receipts/read/`,
    {
      method: "POST",
      body: {
        ...(payload.messageId ? { message_id: payload.messageId } : {}),
      },
    },
  );
}
