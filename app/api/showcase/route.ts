import { NextResponse } from "next/server";
import { getActiveShowcase } from "@/lib/showcase";

export const runtime = "nodejs";
// Cache at the edge for 60s — admins editing the showcase will see stale
// data on the marketing site for up to a minute, which is fine.
export const revalidate = 60;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

/** Preflight for browsers that send OPTIONS first (rare for simple GETs but cheap). */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * Public read of the active showcase grid. Consumed by the marketing site
 * (rohitppn/Starly index.html) over CORS — that's why we set
 * `Access-Control-Allow-Origin: *`. The data is fully public anyway.
 *
 * Response shape: { stores: ShowcaseStore[] }
 */
export async function GET() {
  const stores = await getActiveShowcase();
  return NextResponse.json(
    { stores },
    {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        // Browser cache for 60s, CDN cache for 60s with 5min stale-while-revalidate.
        "Cache-Control":
          "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
