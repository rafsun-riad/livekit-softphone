export type CallParticipant = {
  id: string;
  phone_number_normalized: string;
  display_name: string;
  first_name: string;
  last_name: string;
};

export type CallStateValue =
  | "initiated"
  | "ringing"
  | "accepted"
  | "connecting"
  | "connected"
  | "ending"
  | "ended"
  | "rejected"
  | "cancelled"
  | "busy"
  | "failed"
  | "timed_out";

export type CallRecord = {
  id: string;
  initiator: CallParticipant;
  recipient: CallParticipant;
  provider: string;
  call_type: "audio" | "video";
  state: CallStateValue;
  room_name: string;
  initiated_at: string | null;
  ringing_at: string | null;
  accepted_at: string | null;
  connected_at: string | null;
  ended_at: string | null;
  end_reason: string;
  created_at: string;
  updated_at: string;
  can_accept: boolean;
  can_reject: boolean;
  can_cancel: boolean;
  can_end: boolean;
};

export type JoinMediaResponse = {
  provider: string;
  server_url: string;
  participant_token: string;
  expires_at: string;
  call: CallRecord;
};

export type CreateCallPayload = {
  recipientUserId: string;
  callType: "audio" | "video";
};

export type SocketEventType =
  | "call.incoming"
  | "call.updated"
  | "call.ended"
  | "call.timeout"
  | "presence.user_online"
  | "presence.user_offline"
  | "connection.ready"
  | "client.pong"
  | "server.ack";

export type PresencePayload = {
  user_id: string;
  display_name: string;
  phone_number_normalized: string;
};

export type MediaSessionState = {
  callId: string;
  provider: string;
  serverUrl: string;
  participantToken: string;
  expiresAt: string;
};
