export type SocialId =
  | "instagram"
  | "facebook"
  | "twitter"
  | "youtube"
  | "whatsapp";

export type SocialMeta = {
  id: SocialId;
  label: string;
  field: string;
  placeholder: string;
  background: string;
};

export const SOCIALS: SocialMeta[] = [
  {
    id: "instagram",
    label: "Instagram",
    field: "instagram_url",
    placeholder: "https://instagram.com/yourstore",
    background:
      "linear-gradient(135deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)",
  },
  {
    id: "facebook",
    label: "Facebook",
    field: "facebook_url",
    placeholder: "https://facebook.com/yourstore",
    background: "linear-gradient(135deg,#1877f2 0%,#0d5dbc 100%)",
  },
  {
    id: "twitter",
    label: "X / Twitter",
    field: "twitter_url",
    placeholder: "https://x.com/yourstore",
    background: "linear-gradient(135deg,#0f0f0f 0%,#2a2a2a 100%)",
  },
  {
    id: "youtube",
    label: "YouTube",
    field: "youtube_url",
    placeholder: "https://youtube.com/@yourstore",
    background: "linear-gradient(135deg,#ff0000 0%,#cc0000 100%)",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    field: "whatsapp_url",
    placeholder: "https://wa.me/91XXXXXXXXXX",
    background: "linear-gradient(135deg,#25d366 0%,#128c7e 100%)",
  },
];

export type StoreSocials = {
  instagram_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  whatsapp_url: string | null;
};

// WhatsApp is special — owners enter a phone number, we store as a wa.me URL.
// Accepts: bare digits, +91 prefixed, spaces/dashes, or a full wa.me URL (legacy).
// Returns null if input is empty or unparseable.
export function whatsappToUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = String(input).trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed; // already a URL, keep as-is
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 8) return null;
  // 10 digits = assume India, prepend 91. Anything 11+ = treat as already including country code.
  const withCountry = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCountry}`;
}

// Inverse — pull the phone number out of a wa.me URL for displaying back in a
// form input. Returns the raw input if it's already a phone number.
export function whatsappPhoneFromUrl(value: string | null | undefined): string {
  if (!value) return "";
  const s = String(value).trim();
  if (!s) return "";
  const match = s.match(/wa\.me\/(\+?\d+)/i);
  return match ? match[1] : s;
}
