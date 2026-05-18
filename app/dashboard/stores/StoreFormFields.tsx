"use client";

import { CATEGORIES } from "@/lib/categories";
import { SOCIALS, type StoreSocials, whatsappPhoneFromUrl } from "@/lib/social";
import { getIconById } from "@/components/SocialIcons";
import PlaceSearch from "@/app/onboarding/PlaceSearch";
import { QR_POSTER_TEMPLATES } from "@/lib/qrTemplates";

const QR_DESIGNS: {
  id: "classic" | "sunset" | "midnight";
  label: string;
  preview: { dark: string; light: string };
}[] = [
  { id: "classic", label: "Classic", preview: { dark: "#0f0f14", light: "#ffffff" } },
  { id: "sunset", label: "Sunset", preview: { dark: "#e11d48", light: "#fff7ed" } },
  { id: "midnight", label: "Midnight", preview: { dark: "#fbbf24", light: "#0f0f14" } },
];

export default function StoreFormFields({
  defaults,
  googleMapsApiKey = "",
}: {
  defaults?: {
    name?: string;
    category?: string;
    logo_url?: string | null;
    google_review_url?: string | null;
    keywords?: string[];
    qr_design?: string;
  } & Partial<StoreSocials>;
  googleMapsApiKey?: string;
}) {
  const d = defaults ?? {};
  const qrDesign = d.qr_design ?? "classic";

  return (
    <>
      <label className="block text-sm font-medium text-gray-700 mb-1">Store name</label>
      <input
        name="name"
        type="text"
        required
        maxLength={80}
        defaultValue={d.name ?? ""}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent"
        placeholder="Sunny Cafe"
      />

      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
      <select
        name="category"
        defaultValue={d.category ?? "cafe"}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 mb-4 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent"
      >
        {CATEGORIES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.emoji}  {c.label}
          </option>
        ))}
      </select>

      <label className="block text-sm font-medium text-gray-700 mb-1">Upload logo</label>
      <input
        name="logo_file"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="w-full text-sm text-gray-700 mb-2 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200"
      />
      <p className="text-xs text-gray-500 mb-3">
        PNG / JPG / WEBP / SVG, max 3 MB. Square works best. Leave empty to use a default.
      </p>

      <details className="mb-4">
        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
          ...or paste a logo URL instead
        </summary>
        <input
          name="logo_url"
          type="url"
          defaultValue={d.logo_url ?? ""}
          className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent"
          placeholder="https://yourstore.com/logo.png"
        />
      </details>

      <label className="block text-sm font-medium text-gray-700 mb-1">
        Google review URL <span className="text-red-500">*</span>
      </label>
      <div className="mb-4">
        <PlaceSearch
          apiKey={googleMapsApiKey}
          initialUrl={d.google_review_url ?? ""}
          onPick={() => {
            /* no-op; PlaceSearch already exposes the value via its own
               name="google_review_url" hidden/visible input */
          }}
        />
      </div>

      <label className="block text-sm font-medium text-gray-700 mb-1">
        SEO keywords <span className="text-gray-400 font-normal">(comma separated)</span>
      </label>
      <input
        name="keywords"
        type="text"
        maxLength={500}
        defaultValue={(d.keywords ?? []).join(", ")}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 mb-2 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent"
        placeholder="best biryani delhi, north indian dining, family restaurant"
      />
      <p className="text-xs text-gray-500 mb-5">
        AI weaves these naturally into reviews to help your store rank higher in Google search.
        Use keywords customers actually type — your city, cuisine, niche.
      </p>

      <p className="text-sm font-medium text-gray-700 mb-1">
        Social media <span className="text-gray-400 font-normal">(optional)</span>
      </p>
      <p className="text-xs text-gray-500 mb-3">
        Customers see icons on the Thanks page after they leave a review. Empty links are hidden.
      </p>
      <div className="space-y-2 mb-6">
        {SOCIALS.map((s) => {
          const rawValue =
            (d as Record<string, string | null | undefined>)[s.field] ?? "";
          const isWhatsapp = s.id === "whatsapp";
          const defaultValue = isWhatsapp ? whatsappPhoneFromUrl(rawValue) : (rawValue ?? "");
          return (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-sm"
                style={{ background: s.background }}
                aria-hidden="true"
              >
                {getIconById(s.id, "w-4 h-4")}
              </div>
              <input
                name={s.field}
                type={isWhatsapp ? "tel" : "url"}
                inputMode={isWhatsapp ? "numeric" : undefined}
                defaultValue={defaultValue}
                aria-label={s.label}
                className="flex-1 min-w-0 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                placeholder={isWhatsapp ? "9876543210" : s.placeholder}
              />
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-gray-500 -mt-3 mb-5">
        WhatsApp: enter your number only (10 digits for India, or with country code).
      </p>

      <label className="block text-sm font-medium text-gray-700 mb-2">QR code design</label>
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Simple colors</p>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {QR_DESIGNS.map((opt) => (
          <label
            key={opt.id}
            className="cursor-pointer relative"
          >
            <input
              type="radio"
              name="qr_design"
              value={opt.id}
              defaultChecked={qrDesign === opt.id}
              className="peer sr-only"
            />
            <div className="rounded-xl border-2 border-gray-200 peer-checked:border-rose-500 peer-checked:bg-rose-50 transition-all p-3 text-center">
              <div
                className="w-full aspect-square rounded-md mb-2 flex items-center justify-center"
                style={{ background: opt.preview.light, border: "1px solid #e5e7eb" }}
              >
                <div
                  className="w-6 h-6 rounded-sm"
                  style={{ background: opt.preview.dark }}
                />
              </div>
              <p className="text-xs font-medium text-gray-700">{opt.label}</p>
            </div>
          </label>
        ))}
      </div>

      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Branded posters</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {QR_POSTER_TEMPLATES.map((opt) => (
          <label key={opt.id} className="cursor-pointer relative">
            <input
              type="radio"
              name="qr_design"
              value={opt.id}
              defaultChecked={qrDesign === opt.id}
              className="peer sr-only"
            />
            <div className="rounded-xl border-2 border-gray-200 peer-checked:border-rose-500 peer-checked:bg-rose-50 transition-all p-2 text-center">
              <div
                className={`w-full aspect-[2/3] rounded-md overflow-hidden mb-1.5 ${
                  opt.tone === "dark" ? "bg-gray-900" : "bg-gray-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={opt.img}
                  alt={`${opt.label} poster preview`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <p className="text-xs font-medium text-gray-700">{opt.label}</p>
            </div>
          </label>
        ))}
      </div>
    </>
  );
}
