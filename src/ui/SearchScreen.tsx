import { useState } from "react";
import { he } from "../i18n/he";
import { hasGoogleKey } from "../maps/loader";
import type { PlaceRef } from "../routing/types";
import { loadRecentTrips, type TripRef } from "../storage/storage";
import { fromInputs, toDateInput, toTimeInput } from "./format";
import { PlaceInput } from "./PlaceInput";

interface Props {
  busy: boolean;
  error: string;
  onSubmit: (from: PlaceRef, to: PlaceRef, departure: Date) => void;
  onSubmitBus: (from: PlaceRef, to: PlaceRef, departure: Date, line: string) => void;
  onDemo: () => void;
  onDemoBus: () => void;
}

type Mode = "car" | "bus";

export function SearchScreen({ busy, error, onSubmit, onSubmitBus, onDemo, onDemoBus }: Props) {
  const now = new Date();
  const [mode, setMode] = useState<Mode>("car");
  const [from, setFrom] = useState<PlaceRef | null>(null);
  const [to, setTo] = useState<PlaceRef | null>(null);
  const [date, setDate] = useState(toDateInput(now));
  const [time, setTime] = useState(toTimeInput(now));
  const [line, setLine] = useState("");
  const [localError, setLocalError] = useState("");
  const trips = loadRecentTrips();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to) return setLocalError(he.errorNeedBoth);
    if (from.placeId && from.placeId === to.placeId) return setLocalError(he.errorSamePlace);
    setLocalError("");
    const when = fromInputs(date, time);
    if (mode === "bus") onSubmitBus(from, to, when, line.trim());
    else onSubmit(from, to, when);
  };

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const useTrip = (t: TripRef) => {
    setFrom(t.from);
    setTo(t.to);
  };

  return (
    <main className="screen">
      <header className="hero">
        <img src="./icons/icon.svg" alt="" width="44" height="44" />
        <div>
          <h1>{he.appName}</h1>
          <p>{he.tagline}</p>
        </div>
      </header>

      {!hasGoogleKey && (
        <section className="notice">
          <strong>{he.missingKeyTitle}</strong>
          <p>{he.missingKeyBody}</p>
          <button type="button" className="secondary-btn" onClick={onDemo}>
            {he.demo}
          </button>
          <button type="button" className="secondary-btn" onClick={onDemoBus}>
            {he.demoBus}
          </button>
        </section>
      )}

      <div className="mode-switch" role="group" aria-label="סוג נסיעה">
        <button
          type="button"
          aria-pressed={mode === "car"}
          onClick={() => setMode("car")}
        >
          🚗 {he.modeCar}
        </button>
        <button
          type="button"
          aria-pressed={mode === "bus"}
          onClick={() => setMode("bus")}
        >
          🚌 {he.modeBus}
        </button>
      </div>

      <form onSubmit={submit} className="card">
        <PlaceInput
          label={he.from}
          placeholder={he.fromPlaceholder}
          value={from}
          onChange={setFrom}
          allowMyLocation
        />
        <div className="swap-row">
          <button type="button" className="icon-btn" onClick={swap} aria-label={he.swap} title={he.swap}>
            ⇅
          </button>
        </div>
        <PlaceInput label={he.to} placeholder={he.toPlaceholder} value={to} onChange={setTo} />

        <div className="row">
          <label className="field">
            <span className="label">{he.date}</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label className="field">
            <span className="label">{he.time}</span>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
          </label>
        </div>

        {mode === "bus" && (
          <>
            <label className="field">
              <span className="label">{he.lineNumber}</span>
              <input
                type="text"
                inputMode="numeric"
                value={line}
                placeholder={he.linePlaceholder}
                onChange={(e) => setLine(e.target.value)}
              />
            </label>
            <p className="hint">{he.busHint}</p>
          </>
        )}

        {(localError || error) && <div className="error" role="alert">{localError || error}</div>}

        <button type="submit" className="primary-btn" disabled={busy || !hasGoogleKey}>
          {busy ? he.calculating : mode === "bus" ? he.searchBus : he.calculate}
        </button>
      </form>

      {trips.length > 0 && (
        <section className="card">
          <h2>{he.recentTrips}</h2>
          <ul className="trip-list">
            {trips.map((t, i) => (
              <li key={i}>
                <button type="button" onClick={() => useTrip(t)}>
                  {t.from.text} ← {t.to.text}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="install-hint">{he.install}</p>
    </main>
  );
}
