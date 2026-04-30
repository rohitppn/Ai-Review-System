"use client";

import { useState, useTransition, useRef } from "react";
import { CATEGORIES } from "@/lib/categories";
import { suggestKeywords } from "@/lib/keywordSuggestions";
import { SOCIALS } from "@/lib/social";
import { getIconById } from "@/components/SocialIcons";
import Spinner from "@/components/Spinner";
import { isGoogleReviewUrl } from "@/lib/googleUrl";
import { submitOnboardingAction } from "./actions";
import PlaceSearch from "./PlaceSearch";

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;
const TOTAL_STEPS = 7;
const STEP_LABELS = ["Store", "Logo", "Google", "Social", "Design", "Address", "Pay"];

const QR_DESIGNS: {
  id: "classic" | "sunset" | "midnight";
  label: string;
  preview: { dark: string; light: string };
}[] = [
  { id: "classic",  label: "Classic",  preview: { dark: "#0f0f14", light: "#ffffff" } },
  { id: "sunset",   label: "Sunset",   preview: { dark: "#e11d48", light: "#fff7ed" } },
  { id: "midnight", label: "Midnight", preview: { dark: "#fbbf24", light: "#0f0f14" } },
];

export default function OnboardingWizard({
  userEmail,
  initialError,
  gpayQrSrc,
  adminWhatsapp,
  adminUpiId,
  googleMapsApiKey,
}: {
  userEmail: string;
  initialError: string | null;
  gpayQrSrc: string;
  adminWhatsapp: string;
  adminUpiId: string;
  googleMapsApiKey: string;
}) {
  const [step, setStep] = useState<Step>(1);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  // Step state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("cafe");
  const [customLabel, setCustomLabel] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [googleUrl, setGoogleUrl] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [socials, setSocials] = useState<Record<string, string>>({});
  const [qrDesign, setQrDesign] = useState<"classic" | "sunset" | "midnight">("classic");
  const [delivery, setDelivery] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const next = () => setStep((s) => Math.min(7, s + 1) as Step);
  const back = () => setStep((s) => Math.max(1, s - 1) as Step);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) {
      setLogoFile(null);
      setLogoPreview(null);
      setLogoError(null);
      return;
    }
    if (f.size > 1 * 1024 * 1024) {
      setLogoError("Logo must be under 1 MB. Try compressing it (tinypng.com).");
      setLogoFile(null);
      setLogoPreview(null);
      e.target.value = "";
      return;
    }
    setLogoError(null);
    setLogoFile(f);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const addKeyword = (k: string) => {
    const cleaned = k.trim().toLowerCase();
    if (!cleaned || keywords.includes(cleaned) || keywords.length >= 12) return;
    setKeywords([...keywords, cleaned]);
  };
  const removeKeyword = (k: string) => setKeywords(keywords.filter((x) => x !== k));

  const validateAndNext = () => {
    if (step === 1) {
      if (!name.trim()) return alert("Please enter a store name");
      if (category === "other" && !customLabel.trim()) {
        return alert("Please name your custom category");
      }
    }
    if (step === 3) {
      if (!googleUrl.trim()) {
        return alert("Google review URL is required");
      }
      if (!isGoogleReviewUrl(googleUrl)) {
        return alert(
          "That doesn't look like a Google Maps URL. Use the search above, or paste a link from google.com/maps, maps.app.goo.gl, or g.page."
        );
      }
    }
    if (step === 6) {
      if (!delivery.address || !delivery.phone || !delivery.pincode) {
        return alert("Address, phone, and pincode are required");
      }
    }
    next();
  };

  const handleFinalSubmit = () => {
    if (!formRef.current) return;
    setSubmitting(true);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("category", category);
    fd.set("custom_category_label", customLabel);
    fd.set("google_review_url", googleUrl);
    fd.set("keywords", keywords.join(","));
    fd.set("qr_design", qrDesign);
    if (logoFile) fd.set("logo_file", logoFile);
    SOCIALS.forEach((s) => fd.set(s.field, socials[s.field] ?? ""));
    fd.set("delivery_name", delivery.name);
    fd.set("delivery_phone", delivery.phone);
    fd.set("delivery_address", delivery.address);
    fd.set("delivery_city", delivery.city);
    fd.set("delivery_state", delivery.state);
    fd.set("delivery_pincode", delivery.pincode);
    startTransition(() => {
      submitOnboardingAction(fd);
    });
  };

  const suggestedKw = suggestKeywords(category);
  const cat = CATEGORIES.find((c) => c.id === category) ?? CATEGORIES[0];
  const displayCategoryLabel = category === "other" && customLabel ? customLabel : cat.label;

  const whatsappMsg = encodeURIComponent(
    `Hi, I just signed up on Starly with email "${userEmail}" and paid ₹999 for store "${name || "my store"}". Here's my payment screenshot.`
  );

  return (
    <main className="min-h-screen px-5 py-8 sm:py-10">
      <div className="max-w-2xl mx-auto">
        {/* Top progress bar */}
        <div className="mb-7">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">
              Step {step} of {TOTAL_STEPS} —{" "}
              <span className="text-gray-900 font-semibold">{STEP_LABELS[step - 1]}</span>
            </p>
            <p className="text-xs text-gray-400">{userEmail}</p>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 transition-all duration-500"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {initialError && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {initialError}
          </p>
        )}

        <form ref={formRef} action={submitOnboardingAction}>
          {/* hidden inputs are not used — we build FormData manually via handleFinalSubmit */}

          {step === 1 && (
            <Card title="Tell us about your store">
              <Field label="Store name">
                <input
                  required
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="Sunny Cafe"
                />
              </Field>
              <Field label="Category">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji}  {c.label}
                    </option>
                  ))}
                </select>
              </Field>
              {category === "other" && (
                <Field label="What kind of store is it?" hint="e.g. Tattoo Studio, Dance Academy, Photo Print Shop">
                  <input
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    className="input"
                    placeholder="My business type"
                    required
                  />
                </Field>
              )}
            </Card>
          )}

          {step === 2 && (
            <Card title="Add your logo" subtitle="Optional. PNG/JPG/WEBP, under 1 MB. Square works best.">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoChange}
                className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-amber-500 file:to-rose-500 file:text-white file:px-4 file:py-2 file:font-semibold hover:file:opacity-90 mb-3"
              />
              {logoError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {logoError}
                </p>
              )}
              {logoPreview && (
                <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4">
                  <img
                    src={logoPreview}
                    alt=""
                    className="w-16 h-16 rounded-xl object-cover bg-white shadow-sm"
                  />
                  <p className="text-sm text-gray-700">Looks good. {(logoFile!.size / 1024).toFixed(0)} KB.</p>
                </div>
              )}
              {!logoFile && !logoError && (
                <p className="text-xs text-gray-500">
                  No logo? No problem — we'll auto-generate a beautiful gradient with your store's
                  initial.
                </p>
              )}
            </Card>
          )}

          {step === 3 && (
            <Card title="Find your store on Google" subtitle="Search and pick — we'll build the review URL for you.">
              <Field label="Search your business" required>
                <PlaceSearch
                  apiKey={googleMapsApiKey}
                  initialUrl={googleUrl}
                  onPick={(url) => setGoogleUrl(url)}
                />
              </Field>

              <Field label="SEO keywords" hint={`Pick keywords customers search for. Add your city/area too. AI weaves them into reviews to rank you higher on Google for "${displayCategoryLabel.toLowerCase()}" searches.`}>
                <div className="flex flex-wrap gap-2 mb-3">
                  {keywords.map((k) => (
                    <span
                      key={k}
                      className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-sm font-medium px-3 py-1.5 rounded-full"
                    >
                      {k}
                      <button
                        type="button"
                        onClick={() => removeKeyword(k)}
                        className="hover:text-rose-200"
                        aria-label={`Remove ${k}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 mb-3">
                  <input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addKeyword(keywordInput);
                        setKeywordInput("");
                      }
                    }}
                    className="input flex-1"
                    placeholder="best biryani delhi"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      addKeyword(keywordInput);
                      setKeywordInput("");
                    }}
                    className="px-4 rounded-xl bg-gray-100 hover:bg-gray-200 font-medium text-sm"
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-2">Or pick from suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedKw.map((k) => {
                    const active = keywords.includes(k);
                    return (
                      <button
                        type="button"
                        key={k}
                        onClick={() => (active ? removeKeyword(k) : addKeyword(k))}
                        className={`text-sm px-3 py-1.5 rounded-full transition-all ${
                          active
                            ? "bg-rose-100 text-rose-700 line-through opacity-50"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        }`}
                      >
                        {active ? "✓ " : "+ "}{k}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </Card>
          )}

          {step === 4 && (
            <Card title="Social media links" subtitle="Optional. Customers see icons on the Thanks page after leaving a review.">
              <div className="space-y-2">
                {SOCIALS.map((s) => {
                  const isWhatsapp = s.id === "whatsapp";
                  return (
                    <div key={s.id} className="flex items-center gap-2">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm flex-shrink-0"
                        style={{ background: s.background }}
                      >
                        {getIconById(s.id, "w-4 h-4")}
                      </div>
                      <input
                        type={isWhatsapp ? "tel" : "url"}
                        inputMode={isWhatsapp ? "numeric" : undefined}
                        value={socials[s.field] ?? ""}
                        onChange={(e) => setSocials({ ...socials, [s.field]: e.target.value })}
                        placeholder={isWhatsapp ? "9876543210" : s.placeholder}
                        className="input flex-1"
                      />
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                WhatsApp: enter your phone number only — we'll auto-build the chat link for you.
              </p>
            </Card>
          )}

          {step === 5 && (
            <Card title="Pick your QR code design" subtitle="You can change this anytime later.">
              <div className="grid grid-cols-3 gap-3">
                {QR_DESIGNS.map((d) => (
                  <button
                    type="button"
                    key={d.id}
                    onClick={() => setQrDesign(d.id)}
                    className={`rounded-2xl border-2 p-4 transition-all active:scale-95 ${
                      qrDesign === d.id
                        ? "border-rose-500 bg-rose-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className="w-full aspect-square rounded-lg mb-3 grid grid-cols-5 grid-rows-5 gap-px p-2"
                      style={{ background: d.preview.light, border: "1px solid #e5e7eb" }}
                    >
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div
                          key={i}
                          style={{
                            background: Math.random() > 0.45 ? d.preview.dark : "transparent",
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{d.label}</p>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {step === 6 && (
            <Card title="Where should we ship your printed QR?" subtitle="We'll print and courier you a hard card with your QR.">
              <Field label="Full name">
                <input
                  value={delivery.name}
                  onChange={(e) => setDelivery({ ...delivery, name: e.target.value })}
                  className="input"
                  placeholder="Rohit Sharma"
                />
              </Field>
              <Field label="Phone (for courier)" required>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={delivery.phone}
                  onChange={(e) => setDelivery({ ...delivery, phone: e.target.value })}
                  className="input"
                  placeholder="9876543210"
                  required
                />
              </Field>
              <Field label="Street address" required>
                <textarea
                  value={delivery.address}
                  onChange={(e) => setDelivery({ ...delivery, address: e.target.value })}
                  className="input min-h-[80px]"
                  placeholder="House no, building, street, area"
                  required
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="City">
                  <input
                    value={delivery.city}
                    onChange={(e) => setDelivery({ ...delivery, city: e.target.value })}
                    className="input"
                    placeholder="Delhi"
                  />
                </Field>
                <Field label="State">
                  <input
                    value={delivery.state}
                    onChange={(e) => setDelivery({ ...delivery, state: e.target.value })}
                    className="input"
                    placeholder="Delhi"
                  />
                </Field>
              </div>
              <Field label="Pincode" required>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={delivery.pincode}
                  onChange={(e) => setDelivery({ ...delivery, pincode: e.target.value })}
                  className="input"
                  placeholder="110001"
                  required
                />
              </Field>
            </Card>
          )}

          {step === 7 && (
            <Card title="One last step — pay ₹999 to activate" subtitle="Pay via UPI, then share the screenshot on WhatsApp. We approve within a few hours.">
              <div className="bg-gradient-to-br from-amber-50 to-rose-50 border border-rose-100 rounded-2xl p-6 mb-5 text-center">
                <p className="text-xs uppercase tracking-wider text-gray-600 font-bold mb-2">
                  Total
                </p>
                <p className="text-5xl font-black gradient-text mb-1">₹999</p>
                <p className="text-xs text-gray-500">includes printed QR card delivered to your address</p>
              </div>

              <p className="text-sm font-semibold text-gray-800 mb-3 text-center">
                Scan with any UPI app to pay
              </p>
              <div className="bg-white rounded-2xl shadow-md p-4 mb-2 max-w-xs mx-auto">
                <img
                  src={gpayQrSrc}
                  alt="UPI QR"
                  className="w-full rounded-xl"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <p className="text-center text-sm text-gray-700 mb-1">
                UPI ID: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">{adminUpiId}</code>
              </p>
              <p className="text-center text-xs text-gray-400 mb-6">
                ⚠️ Tap the UPI ID to copy on mobile
              </p>

              <a
                href={`https://wa.me/${adminWhatsapp}?text=${whatsappMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-white font-semibold shadow-lg transition-all active:scale-[0.99]"
                style={{ background: "linear-gradient(135deg,#25d366 0%,#128c7e 100%)" }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.2s-.8 1-1 1.2c-.2.2-.4.2-.7.1-.3-.2-1.2-.5-2.4-1.5a8.9 8.9 0 0 1-1.6-2c-.2-.3 0-.5.1-.6l.5-.5.3-.5c.1-.2.1-.4 0-.5l-1-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5 0 1.5 1 2.9 1.2 3.1.2.2 2.1 3.2 5.1 4.5 1.3.6 2.6 1 3.5.7.6-.2 1.7-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.6-.4z"/>
                  <path d="M12 2A10 10 0 0 0 3.4 17.06L2 22l5.07-1.33A10 10 0 1 0 12 2zm0 18.18a8.16 8.16 0 0 1-4.16-1.14l-.3-.18-3.01.79.8-2.93-.2-.3a8.18 8.18 0 1 1 6.87 3.76z"/>
                </svg>
                Share payment screenshot on WhatsApp
              </a>
              <p className="text-xs text-gray-500 mt-3 text-center">
                After paying, send us the screenshot. We verify it manually for now (Razorpay coming soon).
              </p>
            </Card>
          )}

          {/* Nav buttons */}
          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={back}
              disabled={step === 1}
              className="text-sm text-gray-500 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Back
            </button>
            {step < 7 ? (
              <button
                type="button"
                onClick={validateAndNext}
                className="px-7 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white font-semibold shadow-lg shadow-rose-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={pending || submitting}
                aria-busy={pending || submitting}
                className="px-7 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white font-semibold shadow-lg shadow-rose-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {(pending || submitting) && <Spinner className="h-4 w-4" />}
                  {pending || submitting ? "Submitting..." : "I've sent the payment screenshot ✓"}
                </span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* .input class lives in app/globals.css so it works in admin forms too. */}
    </main>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-rose-200/30 p-6 sm:p-8 animate-slide-up">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-1 mb-5">{subtitle}</p>}
      {!subtitle && <div className="mt-5" />}
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-500 mt-1.5">{hint}</p>}
    </div>
  );
}
