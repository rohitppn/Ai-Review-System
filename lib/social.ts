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
