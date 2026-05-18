/**
 * QR poster templates — branded backgrounds with a QR placeholder area
 * that gets filled with the store's actual QR + logo at download time.
 *
 * Coordinates are NORMALIZED (0-1) against the template image's natural
 * dimensions so they stay correct regardless of the template's exact pixel
 * size. {qr.x, qr.y} is the top-left corner of the QR square; {qr.size}
 * is the side length. Tweak per template if the QR sits slightly off when
 * downloading — these are eyeball estimates from the source designs.
 *
 * Template image files live in /public/qr-templates/<id>.png.
 */
export type QrTemplate = {
  id: string;
  label: string;
  subtitle: string;
  /** Path relative to /public — served as a static asset. */
  img: string;
  /** Normalized 0-1 coordinates for the QR placement square. */
  qr: { x: number; y: number; size: number };
  /** Hint about the dominant color so thumbnail previews look right. */
  tone: "light" | "dark";
};

export const QR_POSTER_TEMPLATES: QrTemplate[] = [
  {
    id: "pop",
    label: "Pop",
    subtitle: "Bright, playful, Google brand colors",
    img: "/qr-templates/pop.png",
    qr: { x: 0.249, y: 0.378, size: 0.503 },
    tone: "light",
  },
  {
    id: "neon",
    label: "Neon",
    subtitle: "Dark with glowing neon corners",
    img: "/qr-templates/neon.png",
    qr: { x: 0.298, y: 0.404, size: 0.459 },
    tone: "dark",
  },
  {
    id: "cosmic",
    label: "Cosmic",
    subtitle: "Purple gradient, growth-focused",
    img: "/qr-templates/cosmic.png",
    qr: { x: 0.283, y: 0.348, size: 0.459 },
    tone: "dark",
  },
  {
    id: "cloud",
    label: "Cloud",
    subtitle: "Soft pastel, modern, friendly",
    img: "/qr-templates/cloud.png",
    qr: { x: 0.288, y: 0.384, size: 0.430 },
    tone: "light",
  },
];

/** All valid QR design ids — colors (existing) + poster templates (new). */
export const QR_DESIGN_IDS = [
  "classic",
  "sunset",
  "midnight",
  ...QR_POSTER_TEMPLATES.map((t) => t.id),
] as const;
export type QrDesignId = (typeof QR_DESIGN_IDS)[number];

export function isPosterDesign(id: string): boolean {
  return QR_POSTER_TEMPLATES.some((t) => t.id === id);
}

export function getPosterTemplate(id: string): QrTemplate | null {
  return QR_POSTER_TEMPLATES.find((t) => t.id === id) ?? null;
}
