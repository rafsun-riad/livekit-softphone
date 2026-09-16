export type DirectoryUser = {
  id: string;
  phone_number_normalized: string;
  display_name: string;
  first_name: string;
  last_name: string;
};

export type Contact = {
  id: string;
  status: string;
  contact_user: DirectoryUser;
  created_at: string;
  updated_at: string;
};
