export type AuthUser = {
  id: string;
  phone_number: string;
  phone_number_normalized: string;
  email: string;
  display_name: string;
  first_name: string;
  last_name: string;
  phone_verified_at: string | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AuthSession = {
  access_token: string;
  device_session_token: string;
  user: AuthUser;
};

export type RegisterPayload = {
  phoneNumber: string;
  email: string;
  password: string;
  displayName: string;
};

export type LoginPayload = {
  phoneNumber: string;
  password: string;
  deviceLabel?: string;
};

export type UpdateCurrentUserPayload = {
  displayName: string;
  email: string;
  firstName: string;
  lastName: string;
};
