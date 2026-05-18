"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { whatsappToUrl } from "@/lib/social";
import { isGoogleReviewUrl } from "@/lib/googleUrl";

// Valid QR design ids = 3 simple colors + 4 poster templates.
// See lib/qrTemplates.ts for the canonical list (QR_DESIGN_IDS).
const QR_DESIGNS = [
  "classic", "sunset", "midnight",
  "pop", "neon", "cosmic", "cloud",
] as const;
type QrDesign = (typeof QR_DESIGNS)[number];

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function cleanString(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

function parseKeywords(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? "")
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length > 0 && k.length <= 80)
    .slice(0, 12);
}

function parseQrDesign(raw: FormDataEntryValue | null): QrDesign {
  const s = String(raw ?? "");
  return (QR_DESIGNS as readonly string[]).includes(s) ? (s as QrDesign) : "classic";
}

const SOCIAL_FIELDS = [
  "instagram_url",
  "facebook_url",
  "twitter_url",
  "youtube_url",
  "whatsapp_url",
] as const;

function parseSocials(formData: FormData): Record<(typeof SOCIAL_FIELDS)[number], string | null> {
  const out = {} as Record<(typeof SOCIAL_FIELDS)[number], string | null>;
  for (const f of SOCIAL_FIELDS) {
    const raw = cleanString(formData.get(f));
    out[f] = f === "whatsapp_url" ? whatsappToUrl(raw) : raw;
  }
  return out;
}

async function uploadLogoIfPresent(
  formData: FormData,
  userId: string,
  slug: string
): Promise<string | null> {
  const file = formData.get("logo_file");
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > 3 * 1024 * 1024) {
    throw new Error("Logo file too large (max 3 MB)");
  }
  const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
  if (!allowed.includes(file.type)) {
    throw new Error("Logo must be PNG, JPG, WEBP, or SVG");
  }

  const ext =
    file.type === "image/svg+xml" ? "svg"
    : file.type === "image/jpeg" ? "jpg"
    : file.type === "image/webp" ? "webp"
    : "png";
  const path = `${userId}/${slug}-${Date.now()}.${ext}`;

  const admin = supabaseAdmin();
  const buf = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage
    .from("logos")
    .upload(path, buf, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);

  const { data: pub } = admin.storage.from("logos").getPublicUrl(path);
  return pub.publicUrl;
}

// ──────────────────────────────────────────────────────────────────────
// Create store — super admin only.
// Also creates the owner's auth user with the admin-supplied credentials.
// ──────────────────────────────────────────────────────────────────────
export async function createStoreAction(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) return redirect("/auth/login");
  if (!me.isAdmin) {
    return redirect("/dashboard?error=Only%20super%20admin%20can%20create%20stores");
  }

  const ownerEmail = cleanString(formData.get("owner_email"))?.toLowerCase() ?? "";
  const ownerPassword = String(formData.get("owner_password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "store");
  const googleReviewUrl = cleanString(formData.get("google_review_url"));
  const logoUrlInput = cleanString(formData.get("logo_url"));
  const keywords = parseKeywords(formData.get("keywords"));
  const qrDesign = parseQrDesign(formData.get("qr_design"));
  const socials = parseSocials(formData);

  const fail = (msg: string) =>
    redirect(`/dashboard/stores/new?error=${encodeURIComponent(msg)}`);

  if (!ownerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
    return fail("Valid owner email required");
  }
  if (ownerPassword.length < 8) {
    return fail("Owner password must be 8+ characters");
  }
  if (!name) return fail("Store name required");
  if (!googleReviewUrl) return fail("Google review URL required");
  if (!isGoogleReviewUrl(googleReviewUrl)) {
    return fail(
      "Google review URL must point to google.com/maps, maps.app.goo.gl, or g.page"
    );
  }

  const admin = supabaseAdmin();

  // 1) Create the owner auth user (auto-confirmed, no email needed).
  const { data: created, error: userErr } = await admin.auth.admin.createUser({
    email: ownerEmail,
    password: ownerPassword,
    email_confirm: true,
  });
  if (userErr || !created.user) {
    return fail(userErr?.message ?? "Could not create owner account");
  }
  const ownerId = created.user.id;

  const baseSlug = slugify(name) || "store";
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;

  let logoUrl = logoUrlInput;
  try {
    const uploaded = await uploadLogoIfPresent(formData, ownerId, slug);
    if (uploaded) logoUrl = uploaded;
  } catch (e) {
    await admin.auth.admin.deleteUser(ownerId);
    return fail(e instanceof Error ? e.message : "Logo upload failed");
  }

  // 2) Insert the store, owned by the new user.
  const { data, error } = await admin
    .from("stores")
    .insert({
      owner_id: ownerId,
      slug,
      name,
      category,
      logo_url: logoUrl,
      google_review_url: googleReviewUrl,
      keywords,
      qr_design: qrDesign,
      ...socials,
    })
    .select("id")
    .single();

  if (error) {
    // Roll back the owner account we just created.
    await admin.auth.admin.deleteUser(ownerId);
    return fail(error.message);
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard/stores/${data.id}`);
}

// ──────────────────────────────────────────────────────────────────────
// Update store — owner of store OR super admin.
// RLS enforces this; we still rely on the user's session-bound client.
// ──────────────────────────────────────────────────────────────────────
export async function updateStoreAction(formData: FormData) {
  const id = String(formData.get("store_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "store");
  const googleReviewUrl = cleanString(formData.get("google_review_url"));
  const logoUrlInput = cleanString(formData.get("logo_url"));
  const keywords = parseKeywords(formData.get("keywords"));
  const qrDesign = parseQrDesign(formData.get("qr_design"));
  const socials = parseSocials(formData);

  if (!id) return redirect("/dashboard");
  if (!name) {
    return redirect(`/dashboard/stores/${id}/edit?error=Store%20name%20required`);
  }
  if (!googleReviewUrl) {
    return redirect(
      `/dashboard/stores/${id}/edit?error=Google%20review%20URL%20required`
    );
  }
  if (!isGoogleReviewUrl(googleReviewUrl)) {
    return redirect(
      `/dashboard/stores/${id}/edit?error=${encodeURIComponent(
        "Google review URL must point to google.com/maps, maps.app.goo.gl, or g.page"
      )}`
    );
  }

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect("/auth/login");

  const { data: existing } = await supabase
    .from("stores")
    .select("slug, logo_url")
    .eq("id", id)
    .single<{ slug: string; logo_url: string | null }>();
  const slug = existing?.slug ?? `store-${id.slice(0, 6)}`;

  let logoUrl = logoUrlInput ?? existing?.logo_url ?? null;
  try {
    const uploaded = await uploadLogoIfPresent(formData, user.id, slug);
    if (uploaded) logoUrl = uploaded;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Logo upload failed";
    return redirect(`/dashboard/stores/${id}/edit?error=${encodeURIComponent(msg)}`);
  }

  const { error } = await supabase
    .from("stores")
    .update({
      name,
      category,
      logo_url: logoUrl,
      google_review_url: googleReviewUrl,
      keywords,
      qr_design: qrDesign,
      ...socials,
    })
    .eq("id", id);

  if (error) {
    return redirect(
      `/dashboard/stores/${id}/edit?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/dashboard/stores/${id}`);
  revalidatePath("/dashboard");
  redirect(`/dashboard/stores/${id}`);
}

// ──────────────────────────────────────────────────────────────────────
// Delete store — super admin only. Also deletes the owner's auth user
// (unless that owner is also an admin, e.g. legacy stores).
// ──────────────────────────────────────────────────────────────────────
export async function deleteStoreAction(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) return redirect("/auth/login");
  if (!me.isAdmin) return redirect("/dashboard");

  const storeId = String(formData.get("store_id") ?? "");
  if (!storeId) return redirect("/dashboard");

  const admin = supabaseAdmin();
  const { data: store } = await admin
    .from("stores")
    .select("owner_id")
    .eq("id", storeId)
    .single<{ owner_id: string }>();

  await admin.from("stores").delete().eq("id", storeId);

  if (store?.owner_id) {
    const { data: ownerProfile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", store.owner_id)
      .maybeSingle<{ is_admin: boolean }>();
    if (!ownerProfile?.is_admin) {
      await admin.auth.admin.deleteUser(store.owner_id);
    }
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
