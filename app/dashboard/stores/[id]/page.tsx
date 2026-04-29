import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { getCategory } from "@/lib/categories";
import { defaultLogoDataUrl } from "@/lib/defaultLogo";
import { deleteStoreAction } from "../../actions";

export const dynamic = "force-dynamic";

type Store = {
  id: string;
  slug: string;
  name: string;
  category: string;
  owner_id: string;
  logo_url: string | null;
  google_review_url: string | null;
  keywords: string[];
  qr_design: string;
  created_at: string;
  delivery_name: string | null;
  delivery_phone: string | null;
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_state: string | null;
  delivery_pincode: string | null;
};

type Review = {
  id: string;
  rating: number;
  tags: string[];
  picked_review: string | null;
  created_at: string;
};

const QR_COLORS: Record<string, { dark: string; light: string }> = {
  classic: { dark: "#0f0f14", light: "#ffffff" },
  sunset:  { dark: "#e11d48", light: "#fff7ed" },
  midnight:{ dark: "#fbbf24", light: "#0f0f14" },
};

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const me = await getCurrentUser();

  const { data: store } = await supabase
    .from("stores")
    .select("id, slug, name, category, owner_id, logo_url, google_review_url, keywords, qr_design, created_at, delivery_name, delivery_phone, delivery_address, delivery_city, delivery_state, delivery_pincode")
    .eq("id", id)
    .single<Store>();

  if (!store) notFound();

  const cat = getCategory(store.category);

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, tags, picked_review, created_at")
    .eq("store_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  const list = (reviews ?? []) as Review[];

  const total = list.length;
  const avg = total ? list.reduce((s, r) => s + r.rating, 0) / total : 0;
  const fourPlus = total ? list.filter((r) => r.rating >= 4).length / total : 0;

  const reviewUrl = `${siteUrl()}/review/${store.slug}`;
  const colors = QR_COLORS[store.qr_design] ?? QR_COLORS.classic;
  const qrDataUrl = await QRCode.toDataURL(reviewUrl, {
    width: 600,
    margin: 2,
    color: colors,
  });

  // For admin viewing someone else's store: pull owner email
  let ownerEmail: string | null = null;
  if (me?.isAdmin && me.id !== store.owner_id) {
    const admin = supabaseAdmin();
    const { data } = await admin.auth.admin.getUserById(store.owner_id);
    ownerEmail = data?.user?.email ?? null;
  }

  const headerLogo = store.logo_url ?? defaultLogoDataUrl(store.name);

  return (
    <main className="min-h-screen px-5 py-8 sm:py-10">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          ← All stores
        </Link>

        <header className="mt-3 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={headerLogo}
              alt=""
              className="w-12 h-12 rounded-xl bg-white shadow-sm object-cover flex-shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
                {store.name}
              </h1>
              <p className="text-sm text-gray-500 truncate">
                {cat.emoji} {cat.label}
                {ownerEmail && (
                  <span className="text-gray-400"> · owned by {ownerEmail}</span>
                )}
              </p>
            </div>
          </div>
          <Link
            href={`/dashboard/stores/${store.id}/edit`}
            className="text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl transition-colors flex-shrink-0"
          >
            Edit
          </Link>
        </header>

        <section className="grid sm:grid-cols-2 gap-5 mb-6">
          <div className="bg-white rounded-2xl shadow-md p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total reviews</p>
            <p className="text-3xl font-bold mt-1">{total}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Avg rating</p>
            <p className="text-3xl font-bold mt-1 text-amber-500">
              {total ? avg.toFixed(1) : "—"}{" "}
              <span className="text-sm text-gray-400 font-normal">
                {total ? `(${Math.round(fourPlus * 100)}% 4★+)` : ""}
              </span>
            </p>
          </div>
        </section>

        {me?.isAdmin && store.delivery_address && (
          <section className="bg-white rounded-2xl shadow-md p-5 mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              📦 Ship printed QR card to
            </p>
            <p className="font-semibold text-gray-900">
              {store.delivery_name || ownerEmail || "—"}
              {store.delivery_phone && (
                <span className="font-normal text-gray-600"> · 📞 {store.delivery_phone}</span>
              )}
            </p>
            <p className="text-sm text-gray-700 mt-1 leading-relaxed">
              {store.delivery_address}
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {[store.delivery_city, store.delivery_state, store.delivery_pincode]
                .filter(Boolean)
                .join(", ")}
            </p>
          </section>
        )}

        {store.keywords.length > 0 && (
          <section className="bg-white rounded-2xl shadow-md p-5 mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">SEO keywords</p>
            <div className="flex flex-wrap gap-1.5">
              {store.keywords.map((k) => (
                <span
                  key={k}
                  className="text-xs bg-gradient-to-r from-amber-50 to-rose-50 border border-rose-100 text-rose-800 rounded-full px-3 py-1"
                >
                  {k}
                </span>
              ))}
            </div>
          </section>
        )}

        <section className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="flex items-start justify-between gap-6 flex-col sm:flex-row">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold mb-2">Customer QR code</h2>
              <p className="text-sm text-gray-600 mb-3">
                Print this and place it on tables / counters. Customers scan it
                to land on your review page.
              </p>
              <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-700 break-all mb-3">
                {reviewUrl}
              </div>
              <a
                href={qrDataUrl}
                download={`${store.slug}-qr.png`}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white text-sm font-semibold shadow-md hover:shadow-lg active:scale-[0.99] transition-all"
              >
                ⬇ Download QR (PNG)
              </a>
              <a
                href={reviewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium ml-2 hover:bg-gray-200 transition-colors"
              >
                Preview page →
              </a>
              <p className="text-xs text-gray-400 mt-3">
                Design: <span className="font-medium capitalize">{store.qr_design}</span>{" "}
                — change in <Link href={`/dashboard/stores/${store.id}/edit`} className="underline">edit</Link>.
              </p>
            </div>
            <img
              src={qrDataUrl}
              alt="QR code"
              className="w-40 h-40 sm:w-48 sm:h-48 rounded-xl bg-white p-2 shadow-sm"
            />
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Recent reviews</h2>
          {list.length === 0 ? (
            <p className="text-sm text-gray-500">
              No reviews yet. Share your QR code to get the first one.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {list.map((r) => (
                <li key={r.id} className="py-3">
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span
                          key={n}
                          className={`text-sm ${
                            r.rating >= n ? "text-amber-400" : "text-gray-200"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                  </div>
                  {r.picked_review && (
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {r.picked_review}
                    </p>
                  )}
                  {r.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {r.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[11px] bg-gray-100 text-gray-600 rounded-full px-2 py-0.5"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {me?.isAdmin && (
          <form action={deleteStoreAction}>
            <input type="hidden" name="store_id" value={store.id} />
            <button
              type="submit"
              className="text-sm text-red-500 hover:text-red-700 transition-colors"
            >
              Delete store + owner account
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
