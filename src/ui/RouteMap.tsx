import { useEffect, useRef, useState } from "react";
import { he } from "../i18n/he";
import { hasGoogleKey, loadGoogleMaps } from "../maps/loader";
import type { RouteStep } from "../sun/exposure";
import type { LatLng } from "../sun/geo";
import { CLASS_COLOR } from "./colors";

interface Props {
  steps: RouteStep[];
  /** index of the step the user is looking at */
  cursor: number;
}

/** Merge neighbouring steps of the same class so the map has fewer lines. */
function groupSteps(steps: RouteStep[]) {
  const groups: { color: string; path: LatLng[] }[] = [];
  for (const s of steps) {
    const color = CLASS_COLOR[s.sunClass];
    const last = groups[groups.length - 1];
    if (last && last.color === color) last.path.push(s.to);
    else groups.push({ color, path: [s.from, s.to] });
  }
  return groups;
}

export function RouteMap({ steps, cursor }: Props) {
  return hasGoogleKey ? (
    <GoogleRouteMap steps={steps} cursor={cursor} />
  ) : (
    <SvgRouteMap steps={steps} cursor={cursor} />
  );
}

function GoogleRouteMap({ steps, cursor }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const linesRef = useRef<google.maps.Polyline[]>([]);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);

  // create the map once
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        await loadGoogleMaps();
        const { Map } = (await google.maps.importLibrary("maps")) as google.maps.MapsLibrary;
        const { AdvancedMarkerElement } = (await google.maps.importLibrary(
          "marker",
        )) as google.maps.MarkerLibrary;
        if (dead || !ref.current) return;
        const map = new Map(ref.current, {
          mapId: "DEMO_MAP_ID",
          center: { lat: 31.8, lng: 35.0 },
          zoom: 8,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
        });
        mapRef.current = map;
        const dot = document.createElement("div");
        dot.className = "map-dot";
        markerRef.current = new AdvancedMarkerElement({ map, content: dot });
        setReady(true);
      } catch {
        if (!dead) setError(true);
      }
    })();
    return () => {
      dead = true;
    };
  }, []);

  // draw the coloured route
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || steps.length === 0) return;
    linesRef.current.forEach((l) => l.setMap(null));
    linesRef.current = groupSteps(steps).map(
      (g) =>
        new google.maps.Polyline({
          map,
          path: g.path,
          strokeColor: g.color,
          strokeOpacity: 0.95,
          strokeWeight: 6,
        }),
    );
    const bounds = new google.maps.LatLngBounds();
    steps.forEach((s) => {
      bounds.extend(s.from);
      bounds.extend(s.to);
    });
    map.fitBounds(bounds, 40);
  }, [ready, steps]);

  // move the cursor marker
  useEffect(() => {
    const m = markerRef.current;
    const s = steps[Math.min(cursor, steps.length - 1)];
    if (!ready || !m || !s) return;
    m.position = s.from;
  }, [ready, cursor, steps]);

  if (error) return <div className="map error-box">{he.errorMapsLoad}</div>;
  return <div className="map" ref={ref} role="img" aria-label="מפה" />;
}

/** Simple drawn route, used in demo mode (no Google key). */
function SvgRouteMap({ steps, cursor }: Props) {
  if (steps.length === 0) return <div className="map" />;
  const pts = steps.flatMap((s) => [s.from, s.to]);
  const minLat = Math.min(...pts.map((p) => p.lat));
  const maxLat = Math.max(...pts.map((p) => p.lat));
  const minLng = Math.min(...pts.map((p) => p.lng));
  const maxLng = Math.max(...pts.map((p) => p.lng));
  const W = 300;
  const H = 300;
  const pad = 24;
  // keep the shape correct: 1 degree of longitude is shorter than latitude
  const kx = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const spanX = Math.max((maxLng - minLng) * kx, 1e-6);
  const spanY = Math.max(maxLat - minLat, 1e-6);
  const scale = Math.min((W - 2 * pad) / spanX, (H - 2 * pad) / spanY);
  const offX = (W - spanX * scale) / 2;
  const offY = (H - spanY * scale) / 2;
  const x = (p: LatLng) => offX + (p.lng - minLng) * kx * scale;
  const y = (p: LatLng) => H - offY - (p.lat - minLat) * scale;
  const groups = groupSteps(steps);
  const cur = steps[Math.min(cursor, steps.length - 1)];

  return (
    <div className="map svg-map">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="מסלול">
        {groups.map((g, i) => (
          <polyline
            key={i}
            fill="none"
            stroke={g.color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={g.path.map((p) => `${x(p)},${y(p)}`).join(" ")}
          />
        ))}
        <circle cx={x(cur.from)} cy={y(cur.from)} r="8" fill="#fff" stroke="#0f172a" strokeWidth="3" />
      </svg>
      <span className="map-note">תצוגה מקוצרת (ללא מפה)</span>
    </div>
  );
}
