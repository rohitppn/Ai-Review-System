import { supabaseServer } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string | null;
  isAdmin: boolean;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle<{ is_admin: boolean }>();

  return {
    id: user.id,
    email: user.email ?? null,
    isAdmin: profile?.is_admin ?? false,
  };
}
