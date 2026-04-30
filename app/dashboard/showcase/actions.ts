"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB — slightly larger than logos
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

function clean(v: FormDataEntryValue | null, max = 80): string | null {
  const s = String(v ?? "").trim().slice(0, max);
  return s.length ? s : null;
}

function fail(msg: string): never {
  redirect(`/dashboard/showcase?error=${encodeURIComponent(msg)}`);
}

async function requireAdmin() {
  const me = await getCurrentUser();
  if (!me?.isAdmin) redirect("/dashboard");
  return me;
}

function extFor(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  return "png";
}

/** Strips bucket prefix off a public URL to get back to the storage path. */
function pathFromPublicUrl(url: string): string | null {
  // Public URLs look like:
  //   https://<project>.supabase.co/storage/v1/object/public/showcase/<path>
  const m = url.match(/\/storage\/v1\/object\/public\/showcase\/(.+)$/);
  return m ? m[1] : null;
}

// ─── CREATE ────────────────────────────────────────────────────────────
export async function createShowcaseAction(formData: FormData) {
  await requireAdmin();

  const name = clean(formData.get("name"), 80);
  const category = clean(formData.get("category"), 60);
  const city = clean(formData.get("city"), 60);
  const sortRaw = String(formData.get("sort_order") ?? "0");
  const sort_order = Number.isFinite(parseInt(sortRaw, 10))
    ? parseInt(sortRaw, 10)
    : 0;
  const is_active = formData.get("is_active") === "on";

  if (!name) fail("Store name is required");

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    fail("Photo is required");
  }
  if (file.size > MAX_PHOTO_BYTES) {
    fail("Photo must be under 5 MB");
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    fail("Photo must be PNG, JPG, or WEBP");
  }

  const admin = supabaseAdmin();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extFor(file.type)}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await admin.storage
    .from("showcase")
    .upload(path, buf, { contentType: file.type, upsert: false });
  if (upErr) fail(upErr.message);

  const photo_url = admin.storage.from("showcase").getPublicUrl(path).data.publicUrl;

  const { error: insErr } = await admin.from("showcase_stores").insert({
    name,
    category,
    city,
    sort_order,
    is_active,
    photo_url,
  });

  if (insErr) {
    // Roll back the orphaned upload so we don't leak storage objects.
    await admin.storage.from("showcase").remove([path]);
    fail(insErr.message);
  }

  revalidatePath("/dashboard/showcase");
  revalidatePath("/api/showcase");
  redirect("/dashboard/showcase");
}

// ─── UPDATE ────────────────────────────────────────────────────────────
export async function updateShowcaseAction(formData: FormData) {
  await requireAdmin();

  const id = clean(formData.get("id"), 64);
  if (!id) fail("Missing id");

  const name = clean(formData.get("name"), 80);
  const category = clean(formData.get("category"), 60);
  const city = clean(formData.get("city"), 60);
  const sortRaw = String(formData.get("sort_order") ?? "0");
  const sort_order = Number.isFinite(parseInt(sortRaw, 10))
    ? parseInt(sortRaw, 10)
    : 0;
  const is_active = formData.get("is_active") === "on";

  if (!name) fail("Store name is required");

  const admin = supabaseAdmin();

  // Optional: replace the photo. If a new file is provided, upload it,
  // swap photo_url, then delete the old object.
  const file = formData.get("photo");
  let newPhotoUrl: string | null = null;
  let oldPath: string | null = null;

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_PHOTO_BYTES) fail("Photo must be under 5 MB");
    if (!ALLOWED_TYPES.includes(file.type)) {
      fail("Photo must be PNG, JPG, or WEBP");
    }

    // Look up the existing row so we know which object to clean up.
    const { data: existing } = await admin
      .from("showcase_stores")
      .select("photo_url")
      .eq("id", id)
      .maybeSingle();
    if (existing?.photo_url) {
      oldPath = pathFromPublicUrl(existing.photo_url);
    }

    const path = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${extFor(file.type)}`;
    const buf = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await admin.storage
      .from("showcase")
      .upload(path, buf, { contentType: file.type, upsert: false });
    if (upErr) fail(upErr.message);
    newPhotoUrl = admin.storage.from("showcase").getPublicUrl(path).data.publicUrl;
  }

  const patch: Record<string, unknown> = {
    name,
    category,
    city,
    sort_order,
    is_active,
  };
  if (newPhotoUrl) patch.photo_url = newPhotoUrl;

  const { error } = await admin
    .from("showcase_stores")
    .update(patch)
    .eq("id", id);

  if (error) fail(error.message);

  if (oldPath) {
    // Best-effort cleanup of the previous photo. Failure here is non-fatal.
    await admin.storage.from("showcase").remove([oldPath]);
  }

  revalidatePath("/dashboard/showcase");
  revalidatePath("/api/showcase");
  redirect("/dashboard/showcase");
}

// ─── DELETE ────────────────────────────────────────────────────────────
export async function deleteShowcaseAction(formData: FormData) {
  await requireAdmin();

  const id = clean(formData.get("id"), 64);
  if (!id) fail("Missing id");

  const admin = supabaseAdmin();

  const { data: existing } = await admin
    .from("showcase_stores")
    .select("photo_url")
    .eq("id", id)
    .maybeSingle();

  const { error } = await admin.from("showcase_stores").delete().eq("id", id);
  if (error) fail(error.message);

  if (existing?.photo_url) {
    const path = pathFromPublicUrl(existing.photo_url);
    if (path) await admin.storage.from("showcase").remove([path]);
  }

  revalidatePath("/dashboard/showcase");
  revalidatePath("/api/showcase");
  redirect("/dashboard/showcase");
}
