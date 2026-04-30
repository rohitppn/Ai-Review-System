import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * A row in the homepage showcase grid (Real stores section on the marketing
 * site). Managed from /dashboard/showcase, served publicly via /api/showcase.
 */
export type ShowcaseStore = {
  id: string;
  sort_order: number;
  name: string;
  category: string | null;
  city: string | null;
  photo_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const SELECT =
  "id, sort_order, name, category, city, photo_url, is_active, created_at, updated_at";

/** Public read — only `is_active = true`. Used by the public API route. */
export async function getActiveShowcase(): Promise<ShowcaseStore[]> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("showcase_stores")
    .select(SELECT)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as ShowcaseStore[];
}

/** Admin read — everything, including drafts. */
export async function getAllShowcase(): Promise<ShowcaseStore[]> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("showcase_stores")
    .select(SELECT)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as ShowcaseStore[];
}
