export interface Wedding {
  id: string;
  organizer_id: string;
  bride_name: string;
  groom_name: string;
  title: string;
  description: string;
  story: string;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue_name: string;
  venue_address: string;
  maps_url: string;
  contact_phones: string[];
  dress_code: string;
  schedule: ScheduleItem[];
  template_id: string;
  theme_colors: Record<string, string>;
  cover_photo_url: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleItem {
  time: string;
  label: string;
}

export interface WeddingPhoto {
  id: string;
  wedding_id: string;
  organizer_id: string;
  storage_path: string;
  url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export type GuestCategory = "family" | "friends" | "partners" | "colleagues" | "vip" | "others";

export type AttendanceStatus = "pending" | "confirmed" | "declined" | "maybe" | "checked_in";

export interface PlusOneDetail {
  name: string;
  dietary?: string;
}

export interface Guest {
  id: string;
  wedding_id: string;
  full_name: string;
  email: string;
  phone: string;
  category: GuestCategory;
  accompanying_persons: number;
  plus_ones?: PlusOneDetail[];
  notes: string;
  ticket_id: string;
  attendance_status: AttendanceStatus;
  rsvp_attendees: number | null;
  rsvp_responded_at: string | null;
  rsvp_message: string | null;
  dietary_preferences: string | null;
  checked_in_at: string | null;
  created_at: string;
}

export interface CheckIn {
  id: string;
  guest_id: string;
  wedding_id: string;
  checked_in_at: string;
  verified_by: string | null;
}

export interface AppNotification {
  id: string;
  recipient_id: string;
  wedding_id: string | null;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export const CATEGORY_LABELS: Record<GuestCategory, string> = {
  family: "Family",
  friends: "Friends",
  partners: "Partners",
  colleagues: "Colleagues",
  vip: "VIP",
  others: "Others",
};

export const CATEGORY_COLORS: Record<GuestCategory, string> = {
  family: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  friends: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  partners: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  colleagues: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  vip: "bg-gold-100 text-gold-700 dark:bg-gold-900/40 dark:text-gold-300",
  others: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
};

export const STATUS_LABELS: Record<AttendanceStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  declined: "Declined",
  maybe: "Maybe",
  checked_in: "Checked In",
};

export const STATUS_COLORS: Record<AttendanceStatus, string> = {
  pending: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300",
  confirmed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  declined: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  maybe: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  checked_in: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
};

export interface InvitationTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
}

export const TEMPLATES: InvitationTemplate[] = [
  { id: "classic",    name: "Classic Elegance",      description: "Timeless serif typography on cream",         preview: "from-gold-50 to-gold-100" },
  { id: "modern",     name: "Modern Minimal",         description: "Clean lines, bold sans-serif",               preview: "from-stone-50 to-stone-100" },
  { id: "romantic",   name: "Romantic Floral",        description: "Soft blush tones with decorative flourishes", preview: "from-blush-50 to-blush-100" },
  { id: "botanical",  name: "Garden Botanical",       description: "Sage green with natural accents",            preview: "from-sage-50 to-sage-100" },
  { id: "royal",      name: "Royal Affair",           description: "Deep gold and navy luxury",                  preview: "from-gold-100 to-gold-200" },
  { id: "rustic",     name: "Rustic Charm",           description: "Warm earthy tones, handcrafted feel",        preview: "from-amber-50 to-amber-100" },
  { id: "ethiopian",  name: "Ethiopian Traditional",  description: "Vibrant colors inspired by Habesha culture", preview: "from-green-100 to-yellow-100" },
  { id: "elegant",    name: "Elegant Black & White",  description: "High-contrast monochrome sophistication",    preview: "from-gray-100 to-gray-200" },
  { id: "dark",       name: "Dark Romance",           description: "Midnight dark with rose gold accents",       preview: "from-stone-800 to-stone-900" },
];
