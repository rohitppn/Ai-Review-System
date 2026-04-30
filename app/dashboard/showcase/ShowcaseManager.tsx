"use client";

import { useRef, useState } from "react";
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
const MAX_RAW_BYTES = 15 * 1024 * 1024; // 15 MB upper bound — modern phone photos fit

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

// ─── PhotoPicker ───────────────────────────────────────────────────────
// Encapsulates: file input + preview + auto-compression + size readout +
// inline validation error. Returns the latest file via the input element
// (we DataTransfer-swap it after compression so form submit picks it up).
type PhotoStatus = "idle" | "compressing" | "ready" | "error";

function usePhotoPicker(initialPreviewUrl?: string | null) {
  const [status, setStatus] = useState<PhotoStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(initialPreviewUrl ?? null);
  const [originalBytes, setOriginalBytes] = useState(0);
  const [finalBytes, setFinalBytes] = useState(0);
  const [didCompress, setDidCompress] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStatus("idle");
    setErrorMsg(null);
    setPreview(initialPreviewUrl ?? null);
    setOriginalBytes(0);
    setFinalBytes(0);
    setDidCompress(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) {
      reset();
      return;
    }

    // Type check
    if (!ALLOWED_MIME.includes(f.type)) {
      setStatus("error");
      setErrorMsg("Photo must be PNG, JPG, or WEBP.");
      setPreview(null);
      return;
    }

    // Hard upper bound — refuse impossibly large files outright
    if (f.size > MAX_RAW_BYTES) {
      setStatus("error");
      setErrorMsg(
        `Photo is ${formatBytes(f.size)} — please pick something under 15 MB.`
      );
      setPreview(null);
      return;
    }

    // Show preview immediately while we compress in the background.
    const previewUrl = URL.createObjectURL(f);
    setPreview(previewUrl);
    setOriginalBytes(f.size);
    setStatus("compressing");
    setErrorMsg(null);

    try {
      const result = await compressImage(f, {
        bytesThreshold: 600 * 1024,
        maxDim: 1600,
        quality: 0.85,
      });

      // Inject the (possibly compressed) file back into the input so a normal
      // form submission picks up the smaller file, not the original.
      if (inputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(result.file);
        inputRef.current.files = dt.files;
      }

      setFinalBytes(result.file.size);
      setDidCompress(result.compressed);
      setStatus("ready");
    } catch {
      setStatus("error");
      setErrorMsg("Could not read this image. Try a different file.");
      setPreview(null);
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
          name="photo"
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
            <>
              <span className="text-emerald-600 font-medium">
                Optimized {formatBytes(originalBytes)} → {formatBytes(finalBytes)}
              </span>
            </>
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

// ─── CREATE FORM ───────────────────────────────────────────────────────
function CreateForm({ nextSortOrder }: { nextSortOrder: number }) {
  const picker = usePhotoPicker(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  const cantSubmit =
    picker.status === "compressing" ||
    picker.status === "error" ||
    picker.status === "idle";

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (cantSubmit) {
      e.preventDefault();
      setClientError(
        picker.status === "compressing"
          ? "Wait for the photo to finish optimizing."
          : picker.status === "error"
            ? picker.errorMsg ?? "Photo error"
            : "Pick a photo first."
      );
      return;
    }
    setClientError(null);
    // Form proceeds with FormData — the compressed file is already in the
    // file input via DataTransfer, so it goes up the wire.
  };

  return (
    <form
      ref={formRef}
      action={createShowcaseAction}
      onSubmit={onSubmit}
      className="bg-white rounded-3xl shadow-xl shadow-rose-200/30 p-6"
    >
      <h2 className="text-lg font-bold mb-1">Add a store</h2>
      <p className="text-xs text-gray-500 mb-5">
        PNG / JPG / WEBP. Big phone photos are auto-resized to ~1600px before
        upload — typical result is under 500 KB.
      </p>

      {clientError && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {clientError}
        </p>
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
        <SubmitButton
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white font-semibold shadow-lg shadow-rose-500/30 hover:shadow-xl active:scale-[0.99] transition-all disabled:opacity-50"
          pendingLabel="Uploading…"
        >
          Add to showcase →
        </SubmitButton>
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 0.625rem;
          border: 1px solid #e5e7eb;
          padding: 0.6rem 0.85rem;
          font-size: 0.9rem;
          transition: all 0.15s;
        }
        :global(.input:focus) {
          outline: none;
          border-color: transparent;
          box-shadow: 0 0 0 2px #fb7185;
        }
      `}</style>
    </form>
  );
}

// ─── EXISTING ROW (edit / delete) ─────────────────────────────────────
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
  const [clientError, setClientError] = useState<string | null>(null);

  const cantSubmit = picker.status === "compressing" || picker.status === "error";

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (cantSubmit) {
      e.preventDefault();
      setClientError(
        picker.status === "compressing"
          ? "Wait for the photo to finish optimizing."
          : picker.errorMsg ?? "Photo error"
      );
      return;
    }
    setClientError(null);
  };

  return (
    <li className="bg-white rounded-2xl shadow-lg shadow-rose-200/30 p-5 ring-2 ring-rose-200">
      <form action={updateShowcaseAction} onSubmit={onSubmit}>
        <input type="hidden" name="id" value={store.id} />

        {clientError && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {clientError}
          </p>
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
            className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
          <SubmitButton
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white text-sm font-semibold shadow-md hover:shadow-lg active:scale-[0.99] transition-all disabled:opacity-50"
            pendingLabel="Saving…"
          >
            Save changes
          </SubmitButton>
        </div>
      </form>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 0.625rem;
          border: 1px solid #e5e7eb;
          padding: 0.6rem 0.85rem;
          font-size: 0.9rem;
          transition: all 0.15s;
        }
        :global(.input:focus) {
          outline: none;
          border-color: transparent;
          box-shadow: 0 0 0 2px #fb7185;
        }
      `}</style>
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
