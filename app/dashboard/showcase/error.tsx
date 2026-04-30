"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Error boundary for /dashboard/showcase. Anything that escapes the page or
 * one of the server actions lands here, so the user always sees a real
 * message + a way out — never the browser's generic "This page couldn't
 * load" screen.
 */
export default function ShowcaseError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Send to wherever you collect errors (Sentry, etc.). console for now.
    console.error("[showcase] uncaught", error);
  }, [error]);

  return (
    <main className="min-h-screen px-5 py-12 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-rose-200/30 p-8 animate-slide-up">
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
          <svg
            className="w-7 h-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-sm text-gray-700 leading-relaxed mb-1">
          The showcase page hit an error before it could finish loading.
        </p>
        <p className="text-xs text-gray-500 break-words bg-gray-50 rounded-lg px-3 py-2 my-4 font-mono">
          {error.message || "Unknown error"}
          {error.digest && (
            <span className="block text-gray-400 mt-1">
              digest: {error.digest}
            </span>
          )}
        </p>
        <p className="text-xs text-gray-500 mb-6">
          Common causes: photo too large, slow network during upload, or a
          temporary database hiccup. Try a smaller photo (under 5 MB) or
          reload.
        </p>

        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white font-semibold shadow-md hover:shadow-lg active:scale-[0.99] transition-all"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold text-center hover:bg-gray-200 transition-all"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
