import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAllShowcase } from "@/lib/showcase";
import ShowcaseManager from "./ShowcaseManager";

export const dynamic = "force-dynamic";

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
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <ShowcaseManager stores={stores} />
      </div>
    </main>
  );
}
