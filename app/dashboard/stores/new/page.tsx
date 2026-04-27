import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createStoreAction } from "../../actions";
import StoreFormFields from "../StoreFormFields";

export const dynamic = "force-dynamic";

export default async function NewStorePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const me = await getCurrentUser();
  if (!me) redirect("/auth/login");
  if (!me.isAdmin) redirect("/dashboard");

  const { error } = await searchParams;
  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-10">
      <form
        action={createStoreAction}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-rose-200/30 p-7 sm:p-8 animate-slide-up"
      >
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-bold mt-3 mb-1">Add a store</h1>
        <p className="text-sm text-gray-500 mb-6">
          Set up branding and create login credentials for the store owner.
        </p>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-amber-50 to-rose-50 p-4 mb-5">
          <p className="text-sm font-semibold text-gray-800 mb-3">Store owner login</p>

          <label className="block text-xs font-medium text-gray-700 mb-1">Owner email</label>
          <input
            name="owner_email"
            type="email"
            required
            autoComplete="off"
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 mb-3 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent"
            placeholder="owner@store.com"
          />

          <label className="block text-xs font-medium text-gray-700 mb-1">Owner password</label>
          <input
            name="owner_password"
            type="text"
            required
            minLength={8}
            autoComplete="off"
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent font-mono text-sm"
            placeholder="At least 8 characters"
          />
          <p className="text-[11px] text-gray-500 mt-1">
            Share these credentials with the owner. They sign in to manage their store's reviews & settings.
          </p>
        </div>

        <StoreFormFields />

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white font-semibold shadow-lg shadow-rose-500/30 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
        >
          Create store + owner account
        </button>
      </form>
    </main>
  );
}
