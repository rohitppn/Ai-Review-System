import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center animate-slide-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white shadow-xl mb-6 text-4xl">
          ⭐
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          <span className="gradient-text">AI Review</span>
        </h1>
        <p className="text-lg text-gray-700 mb-8 leading-relaxed">
          Help your business get more 5-star reviews with AI-assisted feedback.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white font-semibold shadow-lg shadow-rose-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Sign in →
        </Link>
      </div>
    </main>
  );
}
