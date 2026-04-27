import { supabaseAdmin } from "@/lib/supabase/admin";
import type { StoreSocials } from "@/lib/social";

export type Store = StoreSocials & {
  id: string;
  slug: string;
  name: string;
  category: string;
  logo_url: string | null;
  google_review_url: string | null;
  keywords: string[];
  qr_design: string;
};

const SELECT = `
  id, slug, name, category, logo_url, google_review_url, keywords, qr_design,
  instagram_url, facebook_url, twitter_url, youtube_url, whatsapp_url
`;

// Customer-facing lookup (anonymous). Uses service-role client so the public
// review page can resolve a slug regardless of RLS — RLS on `stores` is
// owner-or-admin, which would block anonymous reads otherwise.
export async function getStoreBySlug(slug: string): Promise<Store | null> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("stores")
    .select(SELECT)
    .eq("slug", slug)
    .maybeSingle<Store>();

  if (error || !data) return null;
  return data;
}
