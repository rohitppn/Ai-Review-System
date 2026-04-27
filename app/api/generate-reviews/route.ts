import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Body = {
  storeId: string;
  rating: number;
  tags: string[];
};

export async function POST(req: NextRequest) {
  const { storeId, rating, tags } = (await req.json()) as Body;

  if (!storeId) {
    return NextResponse.json({ error: "storeId required" }, { status: 400 });
  }
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: store } = await supabase
    .from("stores")
    .select("name, category, keywords")
    .eq("id", storeId)
    .maybeSingle<{ name: string; category: string; keywords: string[] | null }>();

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const keywords = (store.keywords ?? []).filter(Boolean);
  if (!apiKey) {
    return NextResponse.json({
      reviews: fallbackReviews(rating, tags ?? [], store.name),
    });
  }

  const client = new Anthropic({ apiKey });
  const tone =
    rating >= 4 ? "warm and enthusiastic"
    : rating === 3 ? "balanced and fair"
    : "honest and constructive";
  const tagsLine = tags?.length ? `They highlighted: ${tags.join(", ")}.` : "";
  const keywordsLine = keywords.length
    ? `\n\nSEO keywords to weave in NATURALLY across the 5 reviews (don't stuff every review with all of them — distribute, only when they fit, and never sound forced):\n${keywords.map((k) => `- ${k}`).join("\n")}`
    : "";

  const prompt = `Generate 5 short, authentic-sounding customer reviews for a ${store.category} called "${store.name}".

The customer gave ${rating} out of 5 stars. ${tagsLine}
Tone: ${tone}.${keywordsLine}

Rules:
- Each review must sound like a real human, not marketing copy.
- Vary length: 1 short (under 15 words), 2 medium (15-30 words), 2 longer (30-50 words).
- Vary phrasing, vocabulary, and sentence structure across the 5.
- No emojis. No hashtags. No quotation marks around the review.
- Don't all start the same way. Avoid "I" at the start of every one.
- Match the rating honestly. Don't oversell a low rating.
- If keywords are provided: use 1-2 keywords per review where they fit naturally. NEVER cram all keywords into one review. NEVER force a keyword that doesn't belong with the rating/tone.

Return ONLY a JSON array of 5 strings. No prose, no markdown, no code fences. Just: ["review 1", "review 2", "review 3", "review 4", "review 5"]`;

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const reviews = parseReviews(text);
    if (reviews.length !== 5) {
      return NextResponse.json({
        reviews: fallbackReviews(rating, tags ?? [], store.name),
      });
    }
    return NextResponse.json({ reviews });
  } catch (err) {
    console.error("claude error", err);
    return NextResponse.json({
      reviews: fallbackReviews(rating, tags ?? [], store.name),
    });
  }
}

function parseReviews(text: string): string[] {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try {
    const arr = JSON.parse(cleaned);
    if (Array.isArray(arr)) return arr.map((s) => String(s).trim()).filter(Boolean);
  } catch {}
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (match) {
    try {
      const arr = JSON.parse(match[0]);
      if (Array.isArray(arr)) return arr.map((s) => String(s).trim()).filter(Boolean);
    } catch {}
  }
  return [];
}

function fallbackReviews(rating: number, tags: string[], storeName: string): string[] {
  const tagLine = tags.length ? ` Especially loved the ${tags.join(" and ")}.` : "";
  if (rating >= 4) {
    return [
      `Great experience at ${storeName}.${tagLine} Will be back.`,
      `Really enjoyed my visit.${tagLine} Friendly staff and a nice vibe overall.`,
      `One of the better spots I've been to lately. ${storeName} clearly cares about quality.${tagLine}`,
      `Solid all around. Quick, welcoming, and the quality was better than I expected.${tagLine}`,
      `Recommending ${storeName} to friends. Felt comfortable from the moment I walked in,${tagLine ? tagLine.toLowerCase() : ""} happy to come again.`,
    ];
  }
  if (rating === 3) {
    return [
      `Decent visit at ${storeName}. A few things to improve but nothing terrible.`,
      `It was okay.${tagLine} Service was fine, though I think there's room to grow.`,
      `Mixed feelings. Some parts were good, others felt a bit average for what I paid.`,
      `Not bad, not amazing. Would try again to see if it was just an off day.${tagLine}`,
      `Middle of the road experience. Friendly enough staff, but the overall feel didn't fully wow me.`,
    ];
  }
  return [
    `Visit at ${storeName} didn't quite land for me. Hope it improves.`,
    `Was looking forward to it but came away disappointed.${tagLine}`,
    `Service felt rushed and a few small things were off. Probably won't be back soon.`,
    `Not the experience I was hoping for. Would recommend reviewing the basics around quality and consistency.`,
    `Some clear room for improvement. Sharing this honestly so it can help.${tagLine}`,
  ];
}
