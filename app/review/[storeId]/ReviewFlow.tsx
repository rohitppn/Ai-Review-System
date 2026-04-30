"use client";

import { useState } from "react";
import type { Store } from "@/lib/stores";
import { getCategory } from "@/lib/categories";
import { defaultLogoDataUrl } from "@/lib/defaultLogo";
import { SOCIALS } from "@/lib/social";
import { getIconById } from "@/components/SocialIcons";
import Spinner from "@/components/Spinner";

type Step = "rating" | "tags" | "loading" | "picking" | "done";

export default function ReviewFlow({ store }: { store: Store }) {
  const [step, setStep] = useState<Step>("rating");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [reviews, setReviews] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const category = getCategory(store.category);
  const tagOptions = category.tags;
  const logoSrc = store.logo_url ?? defaultLogoDataUrl(store.name);

  const handleStarClick = (n: number) => {
    setRating(n);
    setTimeout(() => setStep("tags"), 280);
  };

  const toggleTag = (t: string) => {
    setTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const generateReviews = async () => {
    setStep("loading");
    setError(null);
    try {
      const res = await fetch("/api/generate-reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ storeId: store.id, rating, tags }),
      });
      const data = await res.json();
      if (!data.reviews || !Array.isArray(data.reviews)) {
        throw new Error("Bad response");
      }
      setReviews(data.reviews);
      setStep("picking");
    } catch {
      setError("Couldn't generate reviews. Please try again.");
      setStep("tags");
    }
  };

  const submit = async () => {
    if (!selected || posting) return;
    setPosting(true);
    try {
      await fetch("/api/submit-review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          storeId: store.id,
          rating,
          tags,
          pickedReview: selected,
        }),
      });
    } catch {}
    if (store.google_review_url) {
      try {
        await navigator.clipboard.writeText(selected);
      } catch {}
    }
    setPosting(false);
    setStep("done");
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-5 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <Header store={store} step={step} logoSrc={logoSrc} />

        {step === "rating" && (
          <RatingStep
            rating={rating}
            hoverRating={hoverRating}
            setHoverRating={setHoverRating}
            onPick={handleStarClick}
          />
        )}

        {step === "tags" && (
          <TagsStep
            rating={rating}
            tags={tags}
            tagOptions={tagOptions}
            toggleTag={toggleTag}
            onContinue={generateReviews}
            onBack={() => setStep("rating")}
            error={error}
          />
        )}

        {step === "loading" && <LoadingStep />}

        {step === "picking" && (
          <PickStep
            reviews={reviews}
            selected={selected}
            setSelected={setSelected}
            onSubmit={submit}
            onRegenerate={generateReviews}
            posting={posting}
          />
        )}

        {step === "done" && (
          <DoneStep
            googleUrl={store.google_review_url ?? undefined}
            selectedReview={selected}
            store={store}
          />
        )}
      </div>
    </main>
  );
}

function Header({
  store,
  step,
  logoSrc,
}: {
  store: Store;
  step: Step;
  logoSrc: string;
}) {
  if (step === "done") return null;
  return (
    <div className="flex flex-col items-center text-center mb-10 animate-fade-in">
      <div className="w-20 h-20 rounded-3xl bg-white shadow-xl shadow-rose-200/40 mb-5 overflow-hidden flex items-center justify-center">
        <img
          src={logoSrc}
          alt={store.name}
          className="w-full h-full object-cover"
        />
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{store.name}</h1>
      <p className="text-sm text-gray-600 mt-2 max-w-xs">
        Tell us about your visit — takes 30 seconds
      </p>
    </div>
  );
}

function RatingStep({
  rating,
  hoverRating,
  setHoverRating,
  onPick,
}: {
  rating: number;
  hoverRating: number;
  setHoverRating: (n: number) => void;
  onPick: (n: number) => void;
}) {
  const display = hoverRating || rating;
  const labels = ["", "Bad", "Not great", "Okay", "Good", "Amazing"];

  return (
    <div className="bg-white rounded-[28px] shadow-2xl shadow-rose-200/40 p-8 sm:p-10 animate-slide-up relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br from-amber-200/40 to-rose-200/40 blur-2xl" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-gradient-to-br from-pink-200/40 to-rose-200/40 blur-2xl" />

      <div className="relative">
        <p className="text-center text-gray-800 font-semibold text-lg mb-7">
          How was your experience?
        </p>
        <div className="flex justify-center gap-1.5 sm:gap-2 mb-5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => onPick(n)}
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-5xl sm:text-6xl transition-all active:scale-90 hover:scale-110 select-none p-1"
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
            >
              <span
                className={
                  display >= n
                    ? "text-amber-400 drop-shadow-[0_4px_12px_rgba(251,191,36,0.6)]"
                    : "text-gray-200"
                }
              >
                ★
              </span>
            </button>
          ))}
        </div>
        <p
          className={`text-center text-base font-bold tracking-tight h-6 transition-all ${
            display
              ? "gradient-text scale-100 opacity-100"
              : "text-gray-400 scale-95 opacity-80"
          }`}
        >
          {display ? labels[display] : "Tap a star to rate"}
        </p>
      </div>
    </div>
  );
}

function TagsStep({
  rating,
  tags,
  tagOptions,
  toggleTag,
  onContinue,
  onBack,
  error,
}: {
  rating: number;
  tags: string[];
  tagOptions: string[];
  toggleTag: (t: string) => void;
  onContinue: () => void;
  onBack: () => void;
  error: string | null;
}) {
  return (
    <div className="bg-white rounded-[28px] shadow-2xl shadow-rose-200/40 p-7 sm:p-8 animate-slide-up">
      <div className="flex items-center justify-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={`text-2xl ${rating >= n ? "text-amber-400" : "text-gray-200"}`}
          >
            ★
          </span>
        ))}
      </div>
      <p className="text-center text-gray-800 font-semibold text-lg mb-1">
        What stood out?
      </p>
      <p className="text-center text-xs text-gray-400 mb-6">Optional — pick any that apply</p>
      <div className="flex flex-wrap gap-2 justify-center mb-7">
        {tagOptions.map((t) => {
          const active = tags.includes(t);
          return (
            <button
              key={t}
              onClick={() => toggleTag(t)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 ${
                active
                  ? "bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm text-red-500 text-center mb-3">{error}</p>}
      <button
        onClick={onContinue}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white font-semibold shadow-lg shadow-rose-500/30 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
      >
        Generate review options ✨
      </button>
      <button
        onClick={onBack}
        className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        ← Change rating
      </button>
    </div>
  );
}

function LoadingStep() {
  return (
    <div className="bg-white rounded-[28px] shadow-2xl shadow-rose-200/40 p-10 animate-fade-in">
      <div className="flex flex-col items-center gap-5">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-amber-200" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-rose-500 animate-spin" />
        </div>
        <p className="text-gray-700 font-medium">Crafting your reviews...</p>
        <div className="w-full space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-3 rounded-full bg-gray-100 overflow-hidden relative"
            >
              <div
                className="absolute inset-0 shimmer-bg animate-shimmer"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PickStep({
  reviews,
  selected,
  setSelected,
  onSubmit,
  onRegenerate,
  posting,
}: {
  reviews: string[];
  selected: string | null;
  setSelected: (s: string) => void;
  onSubmit: () => void;
  onRegenerate: () => void;
  posting: boolean;
}) {
  return (
    <div className="animate-slide-up">
      <p className="text-center text-gray-800 font-semibold text-lg mb-4">
        Pick the review that fits best
      </p>
      <div className="space-y-3 mb-5">
        {reviews.map((r, i) => {
          const active = selected === r;
          return (
            <button
              key={i}
              onClick={() => setSelected(r)}
              className={`w-full text-left p-5 rounded-2xl transition-all active:scale-[0.99] ${
                active
                  ? "bg-white ring-2 ring-rose-500 shadow-xl shadow-rose-200/50"
                  : "bg-white/80 hover:bg-white shadow-md hover:shadow-lg"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
                    active
                      ? "bg-gradient-to-br from-amber-500 to-rose-500"
                      : "border-2 border-gray-300"
                  }`}
                >
                  {active && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <p className="text-gray-800 leading-relaxed text-[15px]">{r}</p>
              </div>
            </button>
          );
        })}
      </div>
      <button
        onClick={onSubmit}
        disabled={!selected || posting}
        aria-busy={posting}
        className={`w-full py-4 rounded-2xl font-semibold transition-all ${
          selected
            ? "bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/30 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        } disabled:cursor-not-allowed`}
      >
        <span className="inline-flex items-center justify-center gap-2">
          {posting && <Spinner className="h-4 w-4" />}
          {posting ? "Posting…" : "Done"}
        </span>
      </button>
      <button
        onClick={onRegenerate}
        disabled={posting}
        className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ↻ Generate new options
      </button>
    </div>
  );
}

function DoneStep({
  googleUrl,
  selectedReview,
  store,
}: {
  googleUrl?: string;
  selectedReview: string | null;
  store: Store;
}) {
  const activeSocials = SOCIALS
    .map((s) => ({
      ...s,
      url: (store as unknown as Record<string, string | null>)[s.field],
    }))
    .filter((s): s is typeof s & { url: string } => Boolean(s.url));

  return (
    <div className="text-center animate-slide-up pt-8">
      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 via-rose-400 to-pink-400 shadow-2xl shadow-rose-500/30 mb-6 animate-pop">
        <svg
          className="w-12 h-12 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="3"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-3xl sm:text-4xl font-bold gradient-text mb-3">
        Thanks for your review!
      </h2>
      <p className="text-gray-700 leading-relaxed mb-8 px-2">
        We really appreciate you taking a moment to share your experience.
      </p>

      {googleUrl && (
        <div className="bg-white rounded-2xl p-6 shadow-lg shadow-rose-200/30 mb-6">
          <p className="text-sm text-gray-700 mb-2 font-medium">
            One last step — post it on Google ✨
          </p>
          {selectedReview && (
            <p className="text-xs text-gray-500 mb-4">
              We've copied your review to your clipboard. Tap the button below,
              then paste it on the next screen.
            </p>
          )}
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-white border-2 border-gray-200 text-gray-800 font-semibold hover:border-gray-300 hover:shadow-md transition-all active:scale-[0.99]"
          >
            <GoogleIcon />
            Post on Google
          </a>
        </div>
      )}

      {activeSocials.length > 0 && (
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-4">
            Follow {store.name}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {activeSocials.map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="group relative w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md hover:shadow-xl transition-all hover:scale-110 hover:-translate-y-0.5 active:scale-95"
                style={{ background: s.background }}
              >
                {getIconById(s.id, "w-5 h-5 transition-transform group-hover:scale-110")}
                <span className="absolute inset-0 rounded-2xl ring-2 ring-white/0 group-hover:ring-white/40 transition-all" />
              </a>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400">You can close this page now.</p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0012 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.99 10.99 0 001 12c0 1.78.43 3.46 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
