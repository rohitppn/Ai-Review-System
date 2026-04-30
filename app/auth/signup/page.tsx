import Link from "next/link";
import { signupAction } from "../actions";
import SubmitButton from "@/components/SubmitButton";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-10">
      <form
        action={signupAction}
        className="w-full max-w-sm bg-white rounded-3xl shadow-xl shadow-rose-200/30 p-8 animate-slide-up"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 text-white text-2xl font-bold shadow-lg mb-3">
            ★
          </div>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">
            Then set up your store in under 5 minutes
          </p>
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <input type="hidden" name="next" value={next ?? "/onboarding"} />

        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent"
          placeholder="you@store.com"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 mb-2 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent"
          placeholder="At least 8 characters"
        />
        <p className="text-xs text-gray-500 mb-5">8 characters minimum</p>

        <SubmitButton
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white font-semibold shadow-lg shadow-rose-500/30 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
          pendingLabel="Creating account…"
        >
          Create account →
        </SubmitButton>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have one?{" "}
          <Link href="/auth/login" className="text-rose-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
