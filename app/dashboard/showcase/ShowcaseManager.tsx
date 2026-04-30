"use client";

import { useState } from "react";
import type { ShowcaseStore } from "@/lib/showcase";
import SubmitButton from "@/components/SubmitButton";
import {
  createShowcaseAction,
  updateShowcaseAction,
  deleteShowcaseAction,
} from "./actions";

export default function ShowcaseManager({ stores }: { stores: ShowcaseStore[] }) {
  return (
    <div className="space-y-8">
      <CreateForm nextSortOrder={(stores[stores.length - 1]?.sort_order ?? 0) + 10} />

      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-600 mb-3">
          {stores.length === 0 ? "No stores yet" : `${stores.length} store${stores.length === 1 ? "" : "s"}`}
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
  const [preview, setPreview] = useState<string | null>(null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return setPreview(null);
    const r = new FileReader();
    r.onload = () => setPreview(r.result as string);
    r.readAsDataURL(f);
  };

  return (
    <form
      action={createShowcaseAction}
      className="bg-white rounded-3xl shadow-xl shadow-rose-200/30 p-6"
    >
      <h2 className="text-lg font-bold mb-1">Add a store</h2>
      <p className="text-xs text-gray-500 mb-5">
        PNG / JPG / WEBP, up to 5 MB. Square or 4:3 looks best in the grid.
      </p>

      <div className="grid sm:grid-cols-[160px_1fr] gap-5">
        <div>
          <label className="block">
            <span className="sr-only">Photo</span>
            <input
              name="photo"
              type="file"
              required
              accept="image/png,image/jpeg,image/webp"
              onChange={onPick}
              className="block w-full text-xs text-gray-700 file:mr-2 file:rounded-md file:border-0 file:bg-gradient-to-r file:from-amber-500 file:to-rose-500 file:text-white file:px-3 file:py-1.5 file:text-xs file:font-semibold hover:file:opacity-90"
            />
          </label>
          <div className="mt-2 aspect-[4/3] rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center text-3xl text-gray-300">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="w-full h-full object-cover" />
            ) : (
              "📷"
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Field label="Store name" required>
            <input name="name" required maxLength={80} className="input" placeholder="Sunny Cafe" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <input name="category" maxLength={60} className="input" placeholder="☕ Cafe" />
            </Field>
            <Field label="City">
              <input name="city" maxLength={60} className="input" placeholder="Delhi" />
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
              <input type="checkbox" name="is_active" defaultChecked className="h-4 w-4" />
              <span>Show on site</span>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <SubmitButton
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white font-semibold shadow-lg shadow-rose-500/30 hover:shadow-xl active:scale-[0.99] transition-all"
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
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return setPhotoPreview(null);
    const r = new FileReader();
    r.onload = () => setPhotoPreview(r.result as string);
    r.readAsDataURL(f);
  };

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

  return (
    <li className="bg-white rounded-2xl shadow-lg shadow-rose-200/30 p-5 ring-2 ring-rose-200">
      <form action={updateShowcaseAction}>
        <input type="hidden" name="id" value={store.id} />
        <div className="grid sm:grid-cols-[160px_1fr] gap-5">
          <div>
            <div className="aspect-[4/3] rounded-xl bg-gray-100 overflow-hidden mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPreview ?? store.photo_url}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <label className="block">
              <span className="text-[11px] text-gray-500 block mb-1">
                Replace photo (optional)
              </span>
              <input
                name="photo"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={onPick}
                className="block w-full text-xs text-gray-700 file:mr-2 file:rounded-md file:border-0 file:bg-gray-200 file:px-2 file:py-1 file:text-xs file:font-semibold hover:file:bg-gray-300"
              />
            </label>
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
            onClick={() => {
              setEditing(false);
              setPhotoPreview(null);
            }}
            className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
          <SubmitButton
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white text-sm font-semibold shadow-md hover:shadow-lg active:scale-[0.99] transition-all"
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
