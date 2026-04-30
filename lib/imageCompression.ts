/**
 * Browser-only image compression. Resizes to fit inside `maxDim` × `maxDim`
 * and re-encodes as JPEG at the given quality. Modern phone photos
 * (3-8 MB JPEGs) typically come out at 200-500 KB after this — small
 * enough that the upload never hits a serverless function timeout.
 *
 * Pass-through behaviour:
 *   - SVGs are returned as-is (canvas would rasterise them)
 *   - Images already smaller than `bytesThreshold` are returned as-is
 *
 * Always re-encodes as JPEG (with .jpg extension and image/jpeg MIME)
 * for predictable downstream handling.
 */
export type CompressionResult = {
  file: File;
  /** True if we actually re-encoded; false if we returned the original. */
  compressed: boolean;
  /** Width in pixels of the result. */
  width: number;
  /** Height in pixels of the result. */
  height: number;
  /** Original byte size for the caller's UI. */
  originalBytes: number;
};

export type CompressOptions = {
  /** Skip compression for files already under this size. Default 600 KB. */
  bytesThreshold?: number;
  /** Max width or height. Default 1600 px (looks crisp on retina, small file). */
  maxDim?: number;
  /** JPEG quality 0..1. Default 0.85. */
  quality?: number;
};

const DEFAULT_THRESHOLD = 600 * 1024;
const DEFAULT_MAX_DIM = 1600;
const DEFAULT_QUALITY = 0.85;

export async function compressImage(
  file: File,
  opts: CompressOptions = {}
): Promise<CompressionResult> {
  const bytesThreshold = opts.bytesThreshold ?? DEFAULT_THRESHOLD;
  const maxDim = opts.maxDim ?? DEFAULT_MAX_DIM;
  const quality = opts.quality ?? DEFAULT_QUALITY;
  const originalBytes = file.size;

  // SVG: don't touch
  if (file.type === "image/svg+xml") {
    return {
      file,
      compressed: false,
      width: 0,
      height: 0,
      originalBytes,
    };
  }

  // Already small enough — skip work
  if (file.size <= bytesThreshold) {
    const dim = await measure(file);
    return {
      file,
      compressed: false,
      width: dim.width,
      height: dim.height,
      originalBytes,
    };
  }

  const bitmap = await loadBitmap(file);
  const { width, height } = fitInside(bitmap.width, bitmap.height, maxDim);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(bitmap, 0, 0, width, height);
  // Free the decoded image as soon as we've painted it.
  if ("close" in bitmap) (bitmap as ImageBitmap).close?.();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );
  if (!blob) throw new Error("Failed to encode JPEG");

  // Replace extension with .jpg
  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
  const out = new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });

  return {
    file: out,
    compressed: true,
    width,
    height,
    originalBytes,
  };
}

function fitInside(w: number, h: number, max: number): { width: number; height: number } {
  if (w <= max && h <= max) return { width: w, height: h };
  const ratio = w / h;
  if (w >= h) {
    return { width: max, height: Math.round(max / ratio) };
  }
  return { width: Math.round(max * ratio), height: max };
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // fall through to <img>
    }
  }
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not decode image"));
    };
    img.src = url;
  });
}

async function measure(file: File): Promise<{ width: number; height: number }> {
  try {
    const bm = await loadBitmap(file);
    const w = (bm as ImageBitmap).width;
    const h = (bm as ImageBitmap).height;
    if ("close" in bm) (bm as ImageBitmap).close?.();
    return { width: w, height: h };
  } catch {
    return { width: 0, height: 0 };
  }
}

/** Human-readable byte formatter — "742 KB", "2.4 MB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
