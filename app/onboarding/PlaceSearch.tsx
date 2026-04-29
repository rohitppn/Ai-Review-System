"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: new (
            input: HTMLInputElement,
            opts: { fields: string[]; types?: string[] }
          ) => GoogleAutocomplete;
        };
      };
    };
    __starlyMapsCallbacks?: Array<() => void>;
  }
}

type GoogleAutocomplete = {
  addListener: (event: string, fn: () => void) => void;
  getPlace: () => {
    place_id?: string;
    name?: string;
    formatted_address?: string;
  };
};

type Picked = {
  placeId: string;
  name: string;
  address: string;
  url: string;
};

const SCRIPT_ID = "starly-google-maps-script";

function loadGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.places) return resolve();

    if (document.getElementById(SCRIPT_ID)) {
      window.__starlyMapsCallbacks = window.__starlyMapsCallbacks ?? [];
      window.__starlyMapsCallbacks.push(() => resolve());
      return;
    }

    window.__starlyMapsCallbacks = [() => resolve()];
    (window as unknown as { __starlyMapsReady: () => void }).__starlyMapsReady = () => {
      window.__starlyMapsCallbacks?.forEach((cb) => cb());
      window.__starlyMapsCallbacks = [];
    };

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&libraries=places&callback=__starlyMapsReady&loading=async&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
}

export default function PlaceSearch({
  apiKey,
  onPick,
  initialUrl,
}: {
  apiKey: string;
  onPick: (url: string) => void;
  initialUrl?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [picked, setPicked] = useState<Picked | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualUrl, setManualUrl] = useState(initialUrl ?? "");

  useEffect(() => {
    if (!apiKey) {
      setStatus("error");
      setManualMode(true);
      return;
    }
    loadGoogleMaps(apiKey)
      .then(() => {
        if (!inputRef.current || !window.google?.maps?.places) return;
        const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
          fields: ["place_id", "name", "formatted_address"],
          types: ["establishment"],
        });
        ac.addListener("place_changed", () => {
          const p = ac.getPlace();
          if (!p.place_id) return;
          const url = `https://search.google.com/local/writereview?placeid=${p.place_id}`;
          const next: Picked = {
            placeId: p.place_id,
            name: p.name ?? "",
            address: p.formatted_address ?? "",
            url,
          };
          setPicked(next);
          onPick(url);
        });
        setStatus("ready");
      })
      .catch(() => {
        setStatus("error");
        setManualMode(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  const reset = () => {
    setPicked(null);
    if (inputRef.current) inputRef.current.value = "";
    onPick("");
  };

  if (manualMode || status === "error") {
    return (
      <div>
        <input
          name="google_review_url"
          type="url"
          required
          value={manualUrl}
          onChange={(e) => {
            setManualUrl(e.target.value);
            onPick(e.target.value);
          }}
          className="input"
          placeholder="https://search.google.com/local/writereview?placeid=..."
        />
        {status === "error" && apiKey && (
          <p className="text-xs text-amber-600 mt-1">
            Couldn't load Google search — paste URL manually.
          </p>
        )}
        {!apiKey && (
          <p className="text-xs text-gray-500 mt-1">
            Paste your Google review URL — see the help link below.
          </p>
        )}
      </div>
    );
  }

  if (picked) {
    return (
      <div>
        <input type="hidden" name="google_review_url" value={picked.url} />
        <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 truncate">{picked.name}</p>
              <p className="text-xs text-gray-600 truncate">{picked.address}</p>
              <p className="text-[11px] text-gray-500 mt-1 break-all">
                Review URL ready — Place ID: <code>{picked.placeId.slice(0, 16)}…</code>
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="text-xs text-rose-600 hover:underline font-medium flex-shrink-0"
            >
              Change
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        autoComplete="off"
        className="input"
        placeholder={status === "loading" ? "Loading search…" : "Type your store name on Google"}
        disabled={status !== "ready"}
      />
      <p className="text-xs text-gray-500 mt-1">
        Start typing your business — Google will suggest matches.{" "}
        <button
          type="button"
          onClick={() => setManualMode(true)}
          className="text-rose-600 hover:underline"
        >
          Paste URL instead
        </button>
      </p>
    </div>
  );
}
