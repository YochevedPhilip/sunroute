import { useEffect, useRef, useState } from "react";
import { he } from "../i18n/he";
import { hasGoogleKey, loadGoogleMaps } from "../maps/loader";
import type { PlaceRef } from "../routing/types";
import { isSaved, loadRecentPlaces, loadSavedPlaces, toggleSaved } from "../storage/storage";

interface Props {
  label: string;
  placeholder: string;
  value: PlaceRef | null;
  onChange: (p: PlaceRef | null) => void;
  allowMyLocation?: boolean;
}

interface Suggestion {
  placeId: string;
  main: string;
  secondary: string;
  text: string;
}

export function PlaceInput({ label, placeholder, value, onChange, allowMyLocation }: Props) {
  const [text, setText] = useState(value?.text ?? "");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [savedTick, setSavedTick] = useState(0);
  const token = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Keep the text in sync when the parent changes the value (swap, saved trip).
  useEffect(() => {
    setText(value?.text ?? "");
  }, [value]);

  // Close the list when clicking outside.
  useEffect(() => {
    const onDoc = (e: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, []);

  // Debounced autocomplete.
  useEffect(() => {
    const q = text.trim();
    if (!hasGoogleKey || q.length < 2 || value?.text === text) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        await loadGoogleMaps();
        const { AutocompleteSuggestion, AutocompleteSessionToken } =
          (await google.maps.importLibrary("places")) as google.maps.PlacesLibrary;
        if (!token.current) token.current = new AutocompleteSessionToken();
        const { suggestions: raw } =
          await AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: q,
            sessionToken: token.current,
            includedRegionCodes: ["il"],
            language: "he",
            region: "il",
          });
        if (cancelled) return;
        setMessage("");
        setSuggestions(
          raw
            .filter((s) => s.placePrediction)
            .map((s) => ({
              placeId: s.placePrediction!.placeId,
              main: s.placePrediction!.mainText?.text ?? s.placePrediction!.text.text,
              secondary: s.placePrediction!.secondaryText?.text ?? "",
              text: s.placePrediction!.text.text,
            })),
        );
      } catch {
        if (!cancelled) setMessage(he.errorNetwork);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text, value]);

  const choose = (p: PlaceRef) => {
    token.current = null; // a new search session starts after a choice
    setText(p.text);
    setOpen(false);
    setSuggestions([]);
    onChange(p);
  };

  const useMyLocation = () => {
    setBusy(true);
    setMessage(he.locating);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        setMessage("");
        choose({
          text: he.myLocation,
          isMyLocation: true,
          location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        });
      },
      () => {
        setBusy(false);
        setMessage(he.locationFailed);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  };

  const showLists = open && text.trim().length < 2;
  const recents = showLists ? loadRecentPlaces() : [];
  const saved = showLists ? loadSavedPlaces() : [];
  const canSave = value && !value.isMyLocation && value.text === text;
  void savedTick;

  return (
    <div className="field place" ref={wrapRef}>
      <label>
        <span className="label">{label}</span>
        <div className="place-row">
          <input
            type="text"
            value={text}
            placeholder={placeholder}
            autoComplete="off"
            enterKeyHint="search"
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setText(e.target.value);
              setOpen(true);
              if (value) onChange(null); // the text changed, so the old choice is invalid
            }}
          />
          {canSave && (
            <button
              type="button"
              className="icon-btn"
              aria-label={isSaved(value) ? he.unsave : he.save}
              title={isSaved(value) ? he.unsave : he.save}
              onClick={() => {
                toggleSaved(value);
                setSavedTick((n) => n + 1);
              }}
            >
              {isSaved(value) ? "★" : "☆"}
            </button>
          )}
        </div>
      </label>
      {message && <div className="hint">{message}</div>}

      {open && (suggestions.length > 0 || showLists) && (
        <ul className="dropdown" role="listbox">
          {showLists && allowMyLocation && (
            <li>
              <button type="button" disabled={busy} onClick={useMyLocation}>
                <span className="main">📍 {he.myLocation}</span>
              </button>
            </li>
          )}
          {saved.map((p) => (
            <li key={`s-${p.placeId ?? p.text}`}>
              <button type="button" onClick={() => choose(p)}>
                <span className="main">★ {p.text}</span>
              </button>
            </li>
          ))}
          {recents.map((p) => (
            <li key={`r-${p.placeId ?? p.text}`}>
              <button type="button" onClick={() => choose(p)}>
                <span className="main">🕘 {p.text}</span>
              </button>
            </li>
          ))}
          {suggestions.map((s) => (
            <li key={s.placeId}>
              <button
                type="button"
                onClick={() => choose({ text: s.text, placeId: s.placeId })}
              >
                <span className="main">{s.main}</span>
                {s.secondary && <span className="secondary">{s.secondary}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
