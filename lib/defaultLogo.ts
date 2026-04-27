export function defaultLogoDataUrl(name: string): string {
  const letter = (name?.trim()[0] ?? "?").toUpperCase();
  const safe = letter.replace(/[<>&"']/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="50%" stop-color="#ef4444"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
  </defs>
  <rect width="80" height="80" rx="20" fill="url(#g)"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".35em" fill="white" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="40" font-weight="700">${safe}</text>
</svg>`;
  const b64 = typeof Buffer !== "undefined"
    ? Buffer.from(svg).toString("base64")
    : btoa(svg);
  return `data:image/svg+xml;base64,${b64}`;
}
