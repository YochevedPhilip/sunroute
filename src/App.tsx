import { useState } from "react";
import { he } from "./i18n/he";
import { DEMO_FROM, DEMO_ROUTE, DEMO_TO } from "./routing/demo";
import { googleRouteProvider } from "./routing/google";
import { RouteError, type PlaceRef, type RouteResult } from "./routing/types";
import { addRecentPlace, addRecentTrip } from "./storage/storage";
import { ResultsScreen } from "./ui/ResultsScreen";
import { SearchScreen } from "./ui/SearchScreen";

interface Trip {
  from: PlaceRef;
  to: PlaceRef;
  route: RouteResult;
  departure: Date;
}

function errorText(e: unknown): string {
  if (e instanceof RouteError) {
    if (e.kind === "no-route") return he.errorNoRoute;
    if (e.kind === "network") return he.errorNetwork;
    if (e.kind === "bad-input") return he.errorNeedBoth;
  }
  return he.errorApi;
}

export default function App() {
  const [trip, setTrip] = useState<Trip | null>(null);
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

  const demo = () => {
    // demo departs at 15:00 today so the sun is visible in the afternoon
    const d = new Date();
    d.setHours(15, 0, 0, 0);
    setTrip({ from: DEMO_FROM, to: DEMO_TO, route: DEMO_ROUTE, departure: d });
  };

  return trip ? (
    <ResultsScreen
      key={`${trip.departure.getTime()}-${trip.from.text}-${trip.to.text}`}
      {...trip}
      onBack={() => setTrip(null)}
    />
  ) : (
    <SearchScreen busy={busy} error={error} onSubmit={calculate} onDemo={demo} />
  );
}
