export type MessagingParticipantUser = {
  id: string;
  phone_number_normalized: string;
  display_name: string;
  first_name: string;
  last_name: string;
};

export type ConversationParticipant = {
  id: string;
  user: MessagingParticipantUser;
  last_read_at: string | null;
  archived_at: string | null;
  is_hidden: boolean;
};

export type MessageSummary = {
  id: string;
  sender: MessagingParticipantUser | null;
  message_type: "text" | "image" | "video" | "voice" | "system";
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
};

export type ConversationRecord = {
  id: string;
  kind: "direct";
  subject: string;
  latest_message_at: string | null;
  created_at: string;
  updated_at: string;
  participants: ConversationParticipant[];
  latest_message: MessageSummary | null;
};

export type MessageRecord = {
  id: string;
  sender: MessagingParticipantUser | null;
  message_type: "text" | "image" | "video" | "voice" | "system";
  client_message_id: string;
  ciphertext: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
  deleted_at: string | null;
};
