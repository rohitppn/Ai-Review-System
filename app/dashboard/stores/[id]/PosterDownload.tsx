"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import Spinner from "@/components/Spinner";
import { getPosterTemplate } from "@/lib/qrTemplates";

/**
 * Renders a branded QR poster on a <canvas>:
 *   1. Loads the template image as the background
 *   2. Generates a QR for `reviewUrl` (high error correction so logo overlay
 *      doesn't break scanning)
 *   3. Draws the QR into the template's QR-area coordinates (from
 *      lib/qrTemplates.ts), with a small white-circle "punch" for the
 *      store logo if present
 *
 * The user sees a live preview and can download as PNG.
 */
export default function PosterDownload({
  designId,
  reviewUrl,
  logoUrl,
  storeName,
  storeSlug,
}: {
  designId: string;
  reviewUrl: string;
  logoUrl: string | null;
  storeName: string;
  storeSlug: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const template = getPosterTemplate(designId);

  useEffect(() => {
    if (!template) {
      setStatus("error");
      setErrorMsg("Unknown poster design.");
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Step 1: load template background.
        const bg = await loadImage(template.img);
        if (cancelled) return;

        // Use the template's natural size — we want a high-res download.
        canvas.width = bg.naturalWidth;
        canvas.height = bg.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not get canvas context");
        ctx.drawImage(bg, 0, 0);

        // Step 2: generate QR. Use a generous pixel size so it stays crisp
        // when scaled to the template area.
        const qrPx = Math.round(canvas.width * template.qr.size);
        const qrDataUrl = await QRCode.toDataURL(reviewUrl, {
          width: Math.max(qrPx, 600),
          margin: 0,
          errorCorrectionLevel: "H", // tolerates ~30% obstruction → logo overlay OK
          color: { dark: "#000000", light: "#ffffff" },
        });
        const qrImg = await loadImage(qrDataUrl);
        if (cancelled) return;

        // Step 3: paint a white rounded-rect underneath the QR so transparent
        // template areas still scan reliably.
        const qx = canvas.width * template.qr.x;
        const qy = canvas.height * template.qr.y;
        const qs = canvas.width * template.qr.size;
        const padding = qs * 0.04;
        roundedRect(
          ctx,
          qx - padding,
          qy - padding,
          qs + padding * 2,
          qs + padding * 2,
          qs * 0.06
        );
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        ctx.drawImage(qrImg, qx, qy, qs, qs);

        // Step 4: optional store logo over QR center (white circle bg).
        if (logoUrl) {
          try {
            const logo = await loadImage(logoUrl, /*allowCors*/ true);
            if (cancelled) return;
            const logoSize = qs * 0.22;
            const cx = qx + qs / 2;
            const cy = qy + qs / 2;
            // White circle behind logo
            ctx.beginPath();
            ctx.arc(cx, cy, logoSize * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.fill();
            // Logo, square-cropped into the circle
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, logoSize * 0.55, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(logo, cx - logoSize / 2, cy - logoSize / 2, logoSize, logoSize);
            ctx.restore();
          } catch {
            // Logo load failed (CORS, 404, etc.) — silently skip; QR alone
            // still works.
          }
        }

        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Could not render poster.";
        setStatus("error");
        setErrorMsg(msg);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designId, reviewUrl, logoUrl]);

  const onDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || status !== "ready") return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${storeSlug}-${designId}-poster.png`;
      a.click();
      // Defer revoke so Safari has time to start the download.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  };

  if (!template) return null;

  return (
    <div>
      <div className="rounded-2xl overflow-hidden bg-gray-50 border border-gray-200 mb-4 relative">
        <canvas
          ref={canvasRef}
          aria-label={`${storeName} review poster preview`}
          className="block w-full h-auto"
        />
        {status === "loading" && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center text-rose-600 text-sm font-medium gap-2">
            <Spinner className="h-5 w-5" />
            Rendering…
          </div>
        )}
      </div>

      {status === "error" && (
        <p className="mb-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-2 py-1.5">
          {errorMsg ?? "Could not render this poster — check the template image is in /public/qr-templates/."}
        </p>
      )}

      <button
        type="button"
        onClick={onDownload}
        disabled={status !== "ready"}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white text-sm font-semibold shadow-md hover:shadow-lg active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "ready" ? "⬇ Download branded poster (PNG)" : "Preparing…"}
      </button>
    </div>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────

function loadImage(src: string, allowCors = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (allowCors) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
