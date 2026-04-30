"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { whatsappToUrl } from "@/lib/social";
import { isGoogleReviewUrl } from "@/lib/googleUrl";

const QR_DESIGNS = ["classic", "sunset", "midnight"] as const;

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

function clean(v: FormDataEntryValue | null): string | null {
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

export async function submitOnboardingAction(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) return redirect("/auth/login");

  const fail = (msg: string) =>
    redirect(`/onboarding?error=${encodeURIComponent(msg)}`);

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "other");
  const customLabel = clean(formData.get("custom_category_label"));
  const googleReviewUrl = clean(formData.get("google_review_url"));
  const keywords = parseKeywords(formData.get("keywords"));
  const qrDesign = (() => {
    const s = String(formData.get("qr_design") ?? "");
    return (QR_DESIGNS as readonly string[]).includes(s) ? s : "classic";
  })();

  const socials = {
    instagram_url: clean(formData.get("instagram_url")),
    facebook_url: clean(formData.get("facebook_url")),
    twitter_url: clean(formData.get("twitter_url")),
    youtube_url: clean(formData.get("youtube_url")),
    whatsapp_url: whatsappToUrl(clean(formData.get("whatsapp_url"))),
  };

  const delivery = {
    delivery_name: clean(formData.get("delivery_name")),
    delivery_phone: clean(formData.get("delivery_phone")),
    delivery_address: clean(formData.get("delivery_address")),
    delivery_city: clean(formData.get("delivery_city")),
    delivery_state: clean(formData.get("delivery_state")),
    delivery_pincode: clean(formData.get("delivery_pincode")),
  };

  if (!name) return fail("Store name required");
  if (!googleReviewUrl) return fail("Google review URL required");
  if (!isGoogleReviewUrl(googleReviewUrl)) {
    return fail(
      "Google review URL must point to google.com/maps, maps.app.goo.gl, or g.page"
    );
  }
  if (category === "other" && !customLabel) {
    return fail("Please name your custom category");
  }
  if (!delivery.delivery_address || !delivery.delivery_phone || !delivery.delivery_pincode) {
    return fail("Delivery address, phone, and pincode are required");
  }

  // Logo file upload (optional, max 1 MB)
  let logoUrl: string | null = null;
  const file = formData.get("logo_file");
  if (file instanceof File && file.size > 0) {
    if (file.size > 1 * 1024 * 1024) {
      return fail("Logo must be under 1 MB");
    }
    const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      return fail("Logo must be PNG, JPG, WEBP, or SVG");
    }
    const ext =
      file.type === "image/svg+xml" ? "svg"
      : file.type === "image/jpeg" ? "jpg"
      : file.type === "image/webp" ? "webp"
      : "png";
    const baseSlug = slugify(name) || "store";
    const path = `${me.id}/${baseSlug}-${Date.now()}.${ext}`;
    const admin = supabaseAdmin();
    const buf = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await admin.storage
      .from("logos")
      .upload(path, buf, { contentType: file.type, upsert: false });
    if (upErr) return fail(upErr.message);
    logoUrl = admin.storage.from("logos").getPublicUrl(path).data.publicUrl;
  }

  const baseSlug = slugify(name) || "store";
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;

  // Use the user's session-bound client so RLS check (auth.uid() = owner_id) passes.
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("stores")
    .insert({
      owner_id: me.id,
      slug,
      name,
      category,
      custom_category_label: category === "other" ? customLabel : null,
      logo_url: logoUrl,
      google_review_url: googleReviewUrl,
      keywords,
      qr_design: qrDesign,
      status: "pending",
      submitted_at: new Date().toISOString(),
      payment_amount_inr: 999,
      ...socials,
      ...delivery,
    })
    .select("id")
    .single();

  if (error) return fail(error.message);

  revalidatePath("/dashboard");
  redirect(`/onboarding/submitted?id=${data.id}`);
}

export async function approveStoreAction(formData: FormData) {
  const me = await getCurrentUser();
  if (!me?.isAdmin) return redirect("/dashboard");

  const id = String(formData.get("store_id") ?? "");
  if (!id) return redirect("/dashboard");

  const admin = supabaseAdmin();
  await admin
    .from("stores")
    .update({ status: "active", approved_at: new Date().toISOString(), rejection_reason: null })
    .eq("id", id);

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/stores/${id}`);
  redirect(`/dashboard/stores/${id}`);
}

export async function rejectStoreAction(formData: FormData) {
  const me = await getCurrentUser();
  if (!me?.isAdmin) return redirect("/dashboard");

  const id = String(formData.get("store_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || "Rejected by admin";
  if (!id) return redirect("/dashboard");

  const admin = supabaseAdmin();
  await admin
    .from("stores")
    .update({ status: "rejected", rejection_reason: reason })
    .eq("id", id);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
