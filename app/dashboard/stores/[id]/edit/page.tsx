import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { updateStoreAction } from "../../../actions";
import StoreFormFields from "../../StoreFormFields";

export const dynamic = "force-dynamic";

type Store = {
  id: string;
  name: string;
  category: string;
  logo_url: string | null;
  google_review_url: string | null;
  keywords: string[];
  qr_design: string;
  instagram_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  whatsapp_url: string | null;
};

export default async function EditStorePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await supabaseServer();

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, category, logo_url, google_review_url, keywords, qr_design, instagram_url, facebook_url, twitter_url, youtube_url, whatsapp_url")
    .eq("id", id)
    .single<Store>();

  if (!store) notFound();

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-10">
      <form
        action={updateStoreAction}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-rose-200/30 p-7 sm:p-8 animate-slide-up"
      >
        <Link
          href={`/dashboard/stores/${store.id}`}
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-bold mt-3 mb-1">Edit store</h1>
        <p className="text-sm text-gray-500 mb-6">Update your store's info, branding and SEO keywords.</p>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <input type="hidden" name="store_id" value={store.id} />

        <StoreFormFields
          googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
          defaults={{
            name: store.name,
            category: store.category,
            logo_url: store.logo_url,
            google_review_url: store.google_review_url,
            keywords: store.keywords,
            qr_design: store.qr_design,
            instagram_url: store.instagram_url,
            facebook_url: store.facebook_url,
            twitter_url: store.twitter_url,
            youtube_url: store.youtube_url,
            whatsapp_url: store.whatsapp_url,
          }}
        />

        {store.logo_url && (
          <div className="mb-5 rounded-xl bg-gray-50 px-3 py-2 flex items-center gap-3">
            <img src={store.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
            <p className="text-xs text-gray-500">
              Current logo. Upload a new one or paste a URL above to replace it.
            </p>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white font-semibold shadow-lg shadow-rose-500/30 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
        >
          Save changes
        </button>
      </form>
    </main>
  );
}
