export type DirectoryUser = {
  id: string;
  phone_number_normalized: string;
  display_name: string;
  first_name: string;
  last_name: string;
};

export type Contact = {
  id: string;
  status: "accepted" | "pending" | "rejected" | "blocked";
  contact_user: DirectoryUser;
  created_at: string;
  updated_at: string;
};

export type ContactRelationship = {
  target_user: DirectoryUser;
  status: "accepted" | "pending" | "rejected" | "blocked" | "none";
  is_saved: boolean;
  is_blocked_by_you: boolean;
  is_blocked_by_target: boolean;
  contact_id: string | null;
};
