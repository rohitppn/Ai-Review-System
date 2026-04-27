import { createClient } from "@supabase/supabase-js";

// Service-role client. Use ONLY on the server, ONLY when you need to bypass RLS
// (e.g. inserting an anonymous review from the customer scan page).
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
