import { useState } from "react";
import { he } from "./i18n/he";
import { hasGoogleKey } from "./maps/loader";
import { DEMO_FROM, DEMO_ROUTE, DEMO_TO, demoBusOptions } from "./routing/demo";
import { getBusOptions, googleRouteProvider } from "./routing/google";
import {
  RouteError,
  type BusOption,
  type PlaceRef,
  type RouteResult,
} from "./routing/types";
import { addRecentPlace, addRecentTrip } from "./storage/storage";
import { BusResultsScreen } from "./ui/BusResultsScreen";
import { ResultsScreen } from "./ui/ResultsScreen";
import { SearchScreen } from "./ui/SearchScreen";

interface Trip {
  from: PlaceRef;
  to: PlaceRef;
  route: RouteResult;
  departure: Date;
}

interface BusTrip {
  from: PlaceRef;
  to: PlaceRef;
  options: BusOption[];
}

function errorText(e: unknown): string {
  if (e instanceof RouteError) {
    if (e.kind === "no-route") return he.errorNoRoute;
    if (e.kind === "no-line") return he.errorNoLine;
    if (e.kind === "network") return he.errorNetwork;
    if (e.kind === "bad-input") return he.errorNeedBoth;
  }
  return he.errorApi;
}

export default function App() {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [busTrip, setBusTrip] = useState<BusTrip | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const calculate = async (from: PlaceRef, to: PlaceRef, departure: Date) => {
    setBusy(true);
    setError("");
    try {
      const route = await googleRouteProvider.getRoute(from, to, departure);
      if (route.points.length < 2) throw new RouteError("no-route", "short");
      addRecentPlace(from);
      addRecentPlace(to);
      addRecentTrip({ from, to });
      setTrip({ from, to, route, departure });
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const calculateBus = async (
    from: PlaceRef,
    to: PlaceRef,
    departure: Date,
    line: string,
  ) => {
    setBusy(true);
    setError("");
    try {
      const options = await getBusOptions(from, to, departure, line);
      addRecentPlace(from);
      addRecentPlace(to);
      addRecentTrip({ from, to });
      setBusTrip({ from, to, options });
    } catch (e) {
      // "no route" for buses has its own, clearer message
      setError(
        e instanceof RouteError && e.kind === "no-route" ? he.errorNoBus : errorText(e),
      );
    } finally {
      setBusy(false);
    }
  };

  const demo = () => {
    // demo departs at 15:00 today so the sun is visible in the afternoon
    const d = new Date();
    d.setHours(15, 0, 0, 0);
    setTrip({ from: DEMO_FROM, to: DEMO_TO, route: DEMO_ROUTE, departure: d });
  };

  const demoBus = () => {
    const d = new Date();
    d.setHours(15, 0, 0, 0);
    setBusTrip({ from: DEMO_FROM, to: DEMO_TO, options: demoBusOptions(d) });
  };

  const reverse = async (departure: Date) => {
    if (!trip) return;
    if (!hasGoogleKey) {
      // demo mode: just walk the same line backwards
      setTrip({
        from: trip.to,
        to: trip.from,
        route: { ...trip.route, points: [...trip.route.points].reverse() },
        departure,
      });
      return;
    }
    // A new route is needed: the way back can differ from the way there.
    await calculate(trip.to, trip.from, departure);
  };

  if (busTrip) {
    return (
      <BusResultsScreen
        key={`${busTrip.from.text}-${busTrip.to.text}-${busTrip.options[0]?.departure.getTime()}`}
        {...busTrip}
        onBack={() => {
          setError("");
          setBusTrip(null);
        }}
      />
    );
  }

  return trip ? (
    <ResultsScreen
      key={`${trip.departure.getTime()}-${trip.from.text}-${trip.to.text}`}
      {...trip}
      busy={busy}
      error={error}
      onReverse={reverse}
      onBack={() => {
        setError("");
        setTrip(null);
      }}
    />
  ) : (
    <SearchScreen
      busy={busy}
      error={error}
      onSubmit={calculate}
      onSubmitBus={calculateBus}
      onDemo={demo}
      onDemoBus={demoBus}
    />
  );
}
