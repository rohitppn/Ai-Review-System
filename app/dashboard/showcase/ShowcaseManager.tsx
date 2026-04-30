"use client";

import { useRef, useState, useTransition } from "react";
import type { ShowcaseStore } from "@/lib/showcase";
import SubmitButton from "@/components/SubmitButton";
import Spinner from "@/components/Spinner";
import { compressImage, formatBytes } from "@/lib/imageCompression";
import {
  createShowcaseAction,
  updateShowcaseAction,
  deleteShowcaseAction,
} from "./actions";

const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp"];
const MAX_RAW_BYTES = 15 * 1024 * 1024; // 15 MB raw cap (sanity bound; real photos rarely exceed this)

// ─── PhotoPicker hook ─────────────────────────────────────────────────
// Tracks the picked + (optionally) compressed File in React state. The
// compressed file is the source of truth — we no longer rely on
// `input.files` (read-only on iOS Safari) or the DataTransfer trick.
type PhotoStatus = "idle" | "compressing" | "ready" | "error";

function usePhotoPicker(initialPreviewUrl?: string | null) {
  const [status, setStatus] = useState<PhotoStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(initialPreviewUrl ?? null);
  const [originalBytes, setOriginalBytes] = useState(0);
  const [finalBytes, setFinalBytes] = useState(0);
  const [didCompress, setDidCompress] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStatus("idle");
    setErrorMsg(null);
    setPreview(initialPreviewUrl ?? null);
    setOriginalBytes(0);
    setFinalBytes(0);
    setDidCompress(false);
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) {
      reset();
      return;
    }

    if (!ALLOWED_MIME.includes(f.type)) {
      setStatus("error");
      setErrorMsg("Photo must be PNG, JPG, or WEBP.");
      setPreview(null);
      setFile(null);
      return;
    }

    if (f.size > MAX_RAW_BYTES) {
      setStatus("error");
      setErrorMsg(
        `Photo is ${formatBytes(f.size)} — please pick something under 15 MB.`
      );
      setPreview(null);
      setFile(null);
      return;
    }

    const previewUrl = URL.createObjectURL(f);
    setPreview(previewUrl);
    setOriginalBytes(f.size);
    setStatus("compressing");
    setErrorMsg(null);
    setFile(null);

    try {
      const result = await compressImage(f, {
        bytesThreshold: 600 * 1024,
        maxDim: 1600,
        quality: 0.85,
      });
      setFinalBytes(result.file.size);
      setDidCompress(result.compressed);
      setFile(result.file);
      setStatus("ready");
    } catch {
      // Compression failed — fall back to using the raw file as long as it's
      // not insane. This way the user can still upload, just slower.
      if (f.size <= 5 * 1024 * 1024) {
        setFile(f);
        setFinalBytes(f.size);
        setDidCompress(false);
        setStatus("ready");
      } else {
        setStatus("error");
        setErrorMsg(
          "Couldn't optimize this image automatically — please pick something under 5 MB."
        );
        setFile(null);
      }
    }
  };

  return {
    inputRef,
    status,
    errorMsg,
    preview,
    originalBytes,
    finalBytes,
    didCompress,
    file,
    onPick,
    reset,
  };
}

function PhotoPickerUI({
  picker,
  required,
  fallbackEmoji = "📷",
}: {
  picker: ReturnType<typeof usePhotoPicker>;
  required?: boolean;
  fallbackEmoji?: string;
}) {
  const { inputRef, status, errorMsg, preview, originalBytes, finalBytes, didCompress, onPick } =
    picker;
  return (
    <div>
      <label className="block">
        <span className="sr-only">Photo</span>
        <input
          ref={inputRef}
          type="file"
          required={required}
          accept="image/png,image/jpeg,image/webp"
          onChange={onPick}
          className="block w-full text-xs text-gray-700 file:mr-2 file:rounded-md file:border-0 file:bg-gradient-to-r file:from-amber-500 file:to-rose-500 file:text-white file:px-3 file:py-1.5 file:text-xs file:font-semibold hover:file:opacity-90"
        />
      </label>

      <div className="mt-2 aspect-[4/3] rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center text-3xl text-gray-300 relative">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="w-full h-full object-cover" />
        ) : (
          fallbackEmoji
        )}
        {status === "compressing" && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-rose-600 text-xs font-medium">
            <Spinner className="h-5 w-5" />
            Optimizing…
          </div>
        )}
      </div>

      {status === "ready" && originalBytes > 0 && (
        <p className="mt-1.5 text-[11px] text-gray-500">
          {didCompress ? (
            <span className="text-emerald-600 font-medium">
              Optimized {formatBytes(originalBytes)} → {formatBytes(finalBytes)}
            </span>
          ) : (
            <>Photo size: {formatBytes(finalBytes || originalBytes)}</>
          )}
        </p>
      )}

      {status === "error" && errorMsg && (
        <p className="mt-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-2 py-1.5">
          {errorMsg}
        </p>
      )}
    </div>
  );
}

// ─── ShowcaseManager (top-level) ──────────────────────────────────────
export default function ShowcaseManager({ stores }: { stores: ShowcaseStore[] }) {
  return (
    <div className="space-y-8">
      <CreateForm
        nextSortOrder={(stores[stores.length - 1]?.sort_order ?? 0) + 10}
      />

      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-600 mb-3">
          {stores.length === 0
            ? "No stores yet"
            : `${stores.length} store${stores.length === 1 ? "" : "s"}`}
        </h2>

        {stores.length === 0 ? (
          <p className="text-sm text-gray-500 bg-white rounded-2xl p-6 text-center shadow-sm">
            Add your first showcase store above. It will appear on the marketing
            site within a minute.
          </p>
        ) : (
          <ul className="space-y-3">
            {stores.map((s) => (
              <ShowcaseRow key={s.id} store={s} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// ─── CREATE FORM ───────────────────────────────────────────────────────
function CreateForm({ nextSortOrder }: { nextSortOrder: number }) {
  const picker = usePhotoPicker(null);
  const [pending, startTransition] = useTransition();
  const [clientError, setClientError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setClientError(null);

    if (picker.status === "compressing") {
      setClientError("Wait for the photo to finish optimizing.");
      return;
    }
    if (picker.status === "error" || picker.status === "idle" || !picker.file) {
      setClientError(picker.errorMsg ?? "Pick a photo first.");
      return;
    }

    // Build FormData from the form, then OVERWRITE the photo field with our
    // state-tracked compressed file. This is the part that DataTransfer was
    // failing at on iOS Safari.
    const fd = new FormData(e.currentTarget);
    fd.set("photo", picker.file, picker.file.name);

    startTransition(async () => {
      try {
        await createShowcaseAction(fd);
        // On success the action redirects via revalidate; if not, clear.
        picker.reset();
        (e.currentTarget as HTMLFormElement | null)?.reset?.();
      } catch (err) {
        // Server-action redirect throws NEXT_REDIRECT internally — Next.js
        // catches it. Anything that lands here is a real failure.
        const msg =
          err instanceof Error
            ? err.message
            : "Something went wrong. Try a smaller photo or refresh the page.";
        // Re-throw NEXT_REDIRECT so navigation happens.
        if (msg.includes("NEXT_REDIRECT")) throw err;
        setClientError(msg);
      }
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-3xl shadow-xl shadow-rose-200/30 p-6"
    >
      <h2 className="text-lg font-bold mb-1">Add a store</h2>
      <p className="text-xs text-gray-500 mb-5">
        PNG / JPG / WEBP. Big phone photos are auto-resized to ~1600px before
        upload — typical result is under 500 KB.
      </p>

      {clientError && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 flex items-start gap-2 text-sm">
          <span className="text-red-600 font-bold">!</span>
          <p className="text-red-800">{clientError}</p>
        </div>
      )}

      <div className="grid sm:grid-cols-[160px_1fr] gap-5">
        <PhotoPickerUI picker={picker} required />

        <div className="space-y-3">
          <Field label="Store name" required>
            <input
              name="name"
              required
              maxLength={80}
              className="input"
              placeholder="Sunny Cafe"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <input
                name="category"
                maxLength={60}
                className="input"
                placeholder="☕ Cafe"
              />
            </Field>
            <Field label="City">
              <input
                name="city"
                maxLength={60}
                className="input"
                placeholder="Delhi"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3 items-end">
            <Field label="Sort order" hint="Lower numbers show first">
              <input
                name="sort_order"
                type="number"
                defaultValue={nextSortOrder}
                className="input"
              />
            </Field>
            <label className="flex items-center gap-2 cursor-pointer text-sm pb-3">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked
                className="h-4 w-4"
              />
              <span>Show on site</span>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white font-semibold shadow-lg shadow-rose-500/30 hover:shadow-xl active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="inline-flex items-center justify-center gap-2">
            {pending && <Spinner className="h-4 w-4" />}
            {pending ? "Uploading…" : "Add to showcase →"}
          </span>
        </button>
      </div>

      {/* .input class lives in app/globals.css */}
    </form>
  );
}

// ─── EXISTING ROW ─────────────────────────────────────────────────────
function ShowcaseRow({ store }: { store: ShowcaseStore }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <li
        className={`bg-white rounded-2xl shadow-md p-4 flex items-center gap-4 ${
          !store.is_active ? "opacity-60" : ""
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={store.photo_url}
          alt={store.name}
          className="w-20 h-20 rounded-xl object-cover bg-gray-100 flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold truncate">{store.name}</p>
            {!store.is_active && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                Hidden
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">
            {[store.category, store.city].filter(Boolean).join(" · ") || "—"}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Order {store.sort_order}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-700"
          >
            Edit
          </button>
          <form action={deleteShowcaseAction}>
            <input type="hidden" name="id" value={store.id} />
            <SubmitButton
              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-xs font-medium text-rose-700"
              pendingLabel="Deleting…"
            >
              Delete
            </SubmitButton>
          </form>
        </div>
      </li>
    );
  }

  return <EditForm store={store} onCancel={() => setEditing(false)} />;
}

function EditForm({
  store,
  onCancel,
}: {
  store: ShowcaseStore;
  onCancel: () => void;
}) {
  const picker = usePhotoPicker(store.photo_url);
  const [pending, startTransition] = useTransition();
  const [clientError, setClientError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setClientError(null);

    if (picker.status === "compressing") {
      setClientError("Wait for the photo to finish optimizing.");
      return;
    }
    if (picker.status === "error") {
      setClientError(picker.errorMsg ?? "Photo error");
      return;
    }

    const fd = new FormData(e.currentTarget);
    // Only overwrite photo if a new file was picked. Otherwise the action
    // sees no file and skips the photo update.
    if (picker.file) {
      fd.set("photo", picker.file, picker.file.name);
    } else {
      fd.delete("photo");
    }

    startTransition(async () => {
      try {
        await updateShowcaseAction(fd);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Something went wrong. Try again.";
        if (msg.includes("NEXT_REDIRECT")) throw err;
        setClientError(msg);
      }
    });
  };

  return (
    <li className="bg-white rounded-2xl shadow-lg shadow-rose-200/30 p-5 ring-2 ring-rose-200">
      <form onSubmit={onSubmit}>
        <input type="hidden" name="id" value={store.id} />

        {clientError && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 flex items-start gap-2 text-sm">
            <span className="text-red-600 font-bold">!</span>
            <p className="text-red-800">{clientError}</p>
          </div>
        )}

        <div className="grid sm:grid-cols-[160px_1fr] gap-5">
          <div>
            <p className="text-[11px] text-gray-500 mb-1">
              Replace photo (optional)
            </p>
            <PhotoPickerUI picker={picker} required={false} />
          </div>

          <div className="space-y-3">
            <Field label="Store name" required>
              <input
                name="name"
                required
                maxLength={80}
                defaultValue={store.name}
                className="input"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <input
                  name="category"
                  maxLength={60}
                  defaultValue={store.category ?? ""}
                  className="input"
                />
              </Field>
              <Field label="City">
                <input
                  name="city"
                  maxLength={60}
                  defaultValue={store.city ?? ""}
                  className="input"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <Field label="Sort order">
                <input
                  name="sort_order"
                  type="number"
                  defaultValue={store.sort_order}
                  className="input"
                />
              </Field>
              <label className="flex items-center gap-2 cursor-pointer text-sm pb-3">
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={store.is_active}
                  className="h-4 w-4"
                />
                <span>Show on site</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            aria-busy={pending}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white text-sm font-semibold shadow-md hover:shadow-lg active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="inline-flex items-center justify-center gap-2">
              {pending && <Spinner className="h-4 w-4" />}
              {pending ? "Saving…" : "Save changes"}
            </span>
          </button>
        </div>
      </form>

      {/* .input class lives in app/globals.css */}
    </li>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}
