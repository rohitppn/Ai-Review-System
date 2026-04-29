import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "../auth/actions";
import { approveStoreAction, rejectStoreAction } from "../onboarding/actions";
import { getCategory } from "@/lib/categories";

export const dynamic = "force-dynamic";

type StoreRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  custom_category_label: string | null;
  owner_id: string;
  status: "pending" | "active" | "rejected";
  submitted_at: string | null;
  delivery_name: string | null;
  delivery_phone: string | null;
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_state: string | null;
  delivery_pincode: string | null;
  payment_amount_inr: number | null;
  created_at: string;
  owner_email?: string | null;
};

export default async function DashboardPage() {
  const me = await getCurrentUser();

  const supabase = await supabaseServer();
  const { data: stores } = await supabase
    .from("stores")
    .select(
      "id, name, slug, category, custom_category_label, owner_id, status, submitted_at, delivery_name, delivery_phone, delivery_address, delivery_city, delivery_state, delivery_pincode, payment_amount_inr, created_at"
    )
    .order("created_at", { ascending: false });

  let list = (stores ?? []) as StoreRow[];

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

  const pending = list.filter((s) => s.status === "pending");
  const active = list.filter((s) => s.status === "active");
  const rejected = list.filter((s) => s.status === "rejected");

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

        {/* Owner self-service: pending banner OR add-another CTA */}
        {!me?.isAdmin && pending.length > 0 && (
          <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-rose-50 border border-amber-200 p-6 mb-6 animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="text-3xl flex-shrink-0">⏳</div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">Approval pending</p>
                <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                  We're verifying your payment screenshot. Your QR code will go
                  live within <b>2-3 hours</b> — you'll get a confirmation on
                  WhatsApp.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Didn't send the screenshot yet?{" "}
                  <a
                    href={`https://wa.me/917717766954?text=${encodeURIComponent(
                      `Hi, I just signed up on Starly with email "${me?.email}" and paid ₹999. Here's my payment screenshot.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rose-600 underline font-medium"
                  >
                    Send it now →
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}
        {!me?.isAdmin && pending.length === 0 && (
          <Link
            href="/onboarding"
            className="block rounded-2xl border-2 border-dashed border-gray-300 hover:border-rose-400 hover:bg-white/60 transition-all p-6 text-center mb-6"
          >
            <span className="text-3xl">＋</span>
            <p className="font-medium mt-1">Set up another store</p>
            <p className="text-sm text-gray-500">7-step wizard, ~5 minutes</p>
          </Link>
        )}

        {/* Admin: pending approvals */}
        {me?.isAdmin && pending.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-rose-600 mb-3">
              Pending approval ({pending.length})
            </h2>
            <ul className="space-y-3">
              {pending.map((s) => (
                <PendingCard key={s.id} store={s} />
              ))}
            </ul>
          </section>
        )}

        {/* Admin: legacy "create store directly" */}
        {me?.isAdmin && (
          <Link
            href="/dashboard/stores/new"
            className="block rounded-2xl border-2 border-dashed border-gray-300 hover:border-rose-400 hover:bg-white/60 transition-all p-5 text-center mb-6"
          >
            <span className="text-2xl">＋</span>
            <p className="font-medium mt-1 text-sm">Add a store manually (admin)</p>
            <p className="text-xs text-gray-500">Skip the wizard — set owner credentials directly</p>
          </Link>
        )}

        {/* Active list */}
        {active.length === 0 && pending.length === 0 ? (
          <p className="text-center text-gray-500 text-sm">
            {me?.isAdmin
              ? "No stores in the system yet."
              : "No stores yet — the onboarding wizard takes 5 minutes."}
          </p>
        ) : (
          <>
            {active.length > 0 && (
              <section className="mb-6">
                {me?.isAdmin && (
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-600 mb-3">
                    Active ({active.length})
                  </h2>
                )}
                <ul className="space-y-3">
                  {active.map((s) => (
                    <StoreCard key={s.id} store={s} isAdmin={!!me?.isAdmin} />
                  ))}
                </ul>
              </section>
            )}
            {me?.isAdmin && rejected.length > 0 && (
              <section className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Rejected ({rejected.length})
                </h2>
                <ul className="space-y-3 opacity-60">
                  {rejected.map((s) => (
                    <StoreCard key={s.id} store={s} isAdmin={!!me?.isAdmin} />
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function StoreCard({ store, isAdmin }: { store: StoreRow; isAdmin: boolean }) {
  const cat = getCategory(store.category);
  const label =
    store.category === "other" && store.custom_category_label
      ? store.custom_category_label
      : cat.label;
  return (
    <li>
      <Link
        href={`/dashboard/stores/${store.id}`}
        className="flex items-center justify-between bg-white rounded-2xl shadow-md hover:shadow-lg transition-all p-5 active:scale-[0.99]"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0">{cat.emoji}</span>
          <div className="min-w-0">
            <p className="font-semibold truncate">{store.name}</p>
            <p className="text-xs text-gray-500 truncate">
              {label}
              {isAdmin && store.owner_email && (
                <>
                  {" · "}
                  <span className="text-gray-400">{store.owner_email}</span>
                </>
              )}
            </p>
          </div>
        </div>
        <span className="text-gray-400 flex-shrink-0">→</span>
      </Link>
    </li>
  );
}

function PendingCard({ store }: { store: StoreRow }) {
  const cat = getCategory(store.category);
  const label =
    store.category === "other" && store.custom_category_label
      ? store.custom_category_label
      : cat.label;
  return (
    <li className="bg-white rounded-2xl shadow-lg shadow-rose-200/30 p-5 ring-2 ring-amber-200">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0">{cat.emoji}</span>
          <div className="min-w-0">
            <p className="font-semibold truncate">{store.name}</p>
            <p className="text-xs text-gray-500 truncate">
              {label} · {store.owner_email ?? "—"}
            </p>
          </div>
        </div>
        <Link
          href={`/dashboard/stores/${store.id}`}
          className="text-xs text-rose-600 font-medium hover:underline flex-shrink-0"
        >
          View →
        </Link>
      </div>
      <div className="text-xs text-gray-600 grid grid-cols-2 gap-1 mb-3">
        <p>💸 ₹{store.payment_amount_inr ?? 999}</p>
        <p>
          ⏱ {store.submitted_at
            ? new Date(store.submitted_at).toLocaleString()
            : "—"}
        </p>
      </div>
      {store.delivery_address && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 text-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-1">
            📦 Ship printed QR card to
          </p>
          <p className="font-semibold text-gray-900">
            {store.delivery_name || store.owner_email}
            {store.delivery_phone && (
              <span className="font-normal text-gray-600">
                {" "}· 📞 {store.delivery_phone}
              </span>
            )}
          </p>
          <p className="text-gray-700 mt-0.5 leading-snug">
            {store.delivery_address}
          </p>
          <p className="text-gray-700 leading-snug">
            {[store.delivery_city, store.delivery_state, store.delivery_pincode]
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>
      )}
      <div className="flex gap-2">
        <form action={approveStoreAction} className="flex-1">
          <input type="hidden" name="store_id" value={store.id} />
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-semibold hover:opacity-90 transition active:scale-[0.99]"
          >
            ✓ Approve
          </button>
        </form>
        <form action={rejectStoreAction} className="flex-1">
          <input type="hidden" name="store_id" value={store.id} />
          <input type="hidden" name="reason" value="Payment not verified" />
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition active:scale-[0.99]"
          >
            ✕ Reject
          </button>
        </form>
      </div>
    </li>
  );
}
