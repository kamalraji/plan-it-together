export interface RegistrationAttendee {
  id: string;
  registration_id: string;
  ticket_tier_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  custom_fields: Record<string, any>;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface AttendeeFormData {
  full_name: string;
  email: string;
  phone?: string;
  custom_fields?: Record<string, any>;
}

export interface GroupRegistrationData {
  ticket_tier_id: string;
  quantity: number;
  attendees: AttendeeFormData[];
  promo_code?: string;
}
