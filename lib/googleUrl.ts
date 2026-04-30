/**
 * Recognises any URL that points at a Google Maps place / review surface.
 * Used by the onboarding wizard to keep users from pasting random URLs into
 * the "Google review URL" field.
 *
 * Accepted shapes (real-world examples seen in the wild):
 *   - https://search.google.com/local/writereview?placeid=ChIJ...    ← what PlaceSearch builds
 *   - https://www.google.com/maps/place/...
 *   - https://www.google.com/maps?cid=...
 *   - https://maps.google.com/...
 *   - https://maps.app.goo.gl/...                                    ← share-sheet short link
 *   - https://goo.gl/maps/...                                         ← legacy short link
 *   - https://g.page/r/...                                            ← Google Business profile
 *   - https://g.co/kgs/...                                            ← knowledge-graph short link
 */
const GOOGLE_HOST_RE =
  /^https?:\/\/(?:[a-z0-9-]+\.)*(?:google\.com|google\.co\.[a-z]{2}|goo\.gl|g\.page|g\.co)\//i;

export function isGoogleReviewUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (!GOOGLE_HOST_RE.test(trimmed)) return false;
  // Reject anything obviously not a maps/business URL on a google.com host.
  // (e.g. someone pasting https://www.google.com/search?q=foo)
  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();
    const path = u.pathname.toLowerCase();
    // Short-link hosts are always OK — we trust the redirect target.
    if (
      host === "goo.gl" ||
      host === "maps.app.goo.gl" ||
      host === "g.page" ||
      host === "g.co"
    ) {
      return true;
    }
    // For google.com / google.co.* hosts we want maps-ish paths.
    return (
      host.startsWith("maps.") ||
      host.startsWith("search.") ||
      path.startsWith("/maps") ||
      path.startsWith("/local/")
    );
  } catch {
    return false;
  }
}

export const GOOGLE_URL_HINT =
  "Paste a Google Maps / review URL (search.google.com, maps.app.goo.gl, g.page, etc.)";
