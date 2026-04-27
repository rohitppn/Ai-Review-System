import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Body = {
  storeId: string;
  rating: number;
  tags: string[];
  pickedReview: string | null;
};

export async function POST(req: NextRequest) {
  const { storeId, rating, tags, pickedReview } = (await req.json()) as Body;

  if (!storeId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase.from("reviews").insert({
    store_id: storeId,
    rating,
    tags: Array.isArray(tags) ? tags.slice(0, 10) : [],
    picked_review: pickedReview ? String(pickedReview).slice(0, 1000) : null,
  });

  if (error) {
    console.error("submit review error", error);
    return NextResponse.json({ error: "Could not save review" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
