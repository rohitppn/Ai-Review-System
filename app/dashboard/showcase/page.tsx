import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAllShowcase } from "@/lib/showcase";
import ShowcaseManager from "./ShowcaseManager";

export const dynamic = "force-dynamic";
// Server actions on this page upload to Supabase storage. Phone photos can be
// 5-10 MB and Vercel's free-tier default of 10s is sometimes not enough, even
// after our client-side compression. 30s gives a comfortable safety net.
export const maxDuration = 30;

export default async function ShowcasePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const me = await getCurrentUser();
  if (!me) redirect("/auth/login?next=/dashboard/showcase");
  if (!me.isAdmin) redirect("/dashboard");

  const { error } = await searchParams;
  const stores = await getAllShowcase();

  return (
    <main className="min-h-screen px-5 py-8 sm:py-10">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="min-w-0">
            <Link
              href="/dashboard"
              className="text-xs text-gray-500 hover:text-gray-800 mb-2 inline-block"
            >
              ← Back to dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Homepage showcase
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              These stores appear in the &quot;Real stores&quot; grid on the marketing
              site. Drag-free for now: use the order number to sort.
            </p>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 border-2 border-red-200 p-4 flex items-start gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5"
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
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-red-900">
                Couldn&apos;t save your store
              </p>
              <p className="text-sm text-red-700 mt-0.5 break-words">{error}</p>
            </div>
          </div>
        )}

        <ShowcaseManager stores={stores} />
      </div>
    </main>
  );
}
