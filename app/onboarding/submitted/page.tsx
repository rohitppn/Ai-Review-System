import Link from "next/link";

export const dynamic = "force-dynamic";

export default function SubmittedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md text-center animate-slide-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 via-rose-400 to-pink-400 shadow-2xl shadow-rose-500/30 mb-6 animate-pop">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
          You're all set!
        </h1>
        <p className="text-gray-700 leading-relaxed mb-2">
          Your store is in the queue. We're verifying your payment screenshot
          and will activate your QR within a few hours.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          You'll get a confirmation on the WhatsApp number you shared.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center px-7 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white font-semibold shadow-lg shadow-rose-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
        >
          Go to my dashboard →
        </Link>
      </div>
    </main>
  );
}
