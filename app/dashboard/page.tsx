import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "../auth/actions";
import { getCategory } from "@/lib/categories";

export const dynamic = "force-dynamic";

type StoreRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  owner_id: string;
  created_at: string;
  owner_email?: string | null;
};

export default async function DashboardPage() {
  const me = await getCurrentUser();

  const supabase = await supabaseServer();
  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, slug, category, owner_id, created_at")
    .order("created_at", { ascending: false });

  let list = (stores ?? []) as StoreRow[];

  // Admin: enrich with owner emails (read auth.users via service role).
  if (me?.isAdmin && list.length > 0) {
    const admin = supabaseAdmin();
    const ownerIds = Array.from(new Set(list.map((s) => s.owner_id)));
    const emailById: Record<string, string | null> = {};
    await Promise.all(
      ownerIds.map(async (id) => {
        const { data } = await admin.auth.admin.getUserById(id);
        emailById[id] = data?.user?.email ?? null;
      })
    );
    list = list.map((s) => ({ ...s, owner_email: emailById[s.owner_id] ?? null }));
  }

  return (
    <main className="min-h-screen px-5 py-8 sm:py-10">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {me?.isAdmin ? "All stores" : "Your stores"}
              </h1>
              {me?.isAdmin && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-rose-500 text-white px-2 py-0.5 rounded-full">
                  Admin
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 truncate">{me?.email}</p>
          </div>
          <form action={logoutAction}>
            <button className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
              Sign out
            </button>
          </form>
        </header>

        {me?.isAdmin && (
          <Link
            href="/dashboard/stores/new"
            className="block rounded-2xl border-2 border-dashed border-gray-300 hover:border-rose-400 hover:bg-white/60 transition-all p-6 text-center mb-6"
          >
            <span className="text-3xl">＋</span>
            <p className="font-medium mt-1">Add a new store</p>
            <p className="text-sm text-gray-500">
              Create login credentials for the owner + a printable QR code
            </p>
          </Link>
        )}

        {list.length === 0 ? (
          <p className="text-center text-gray-500 text-sm">
            {me?.isAdmin
              ? "No stores in the system yet — add the first one above."
              : "Your account isn't linked to any store yet. Contact your admin."}
          </p>
        ) : (
          <ul className="space-y-3">
            {list.map((s) => {
              const cat = getCategory(s.category);
              return (
                <li key={s.id}>
                  <Link
                    href={`/dashboard/stores/${s.id}`}
                    className="flex items-center justify-between bg-white rounded-2xl shadow-md hover:shadow-lg transition-all p-5 active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl flex-shrink-0">{cat.emoji}</span>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{s.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {cat.label}
                          {me?.isAdmin && s.owner_email && (
                            <>
                              {" · "}
                              <span className="text-gray-400">{s.owner_email}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <span className="text-gray-400 flex-shrink-0">→</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
