import { GOOGLE_KEY } from "../routing/google";

export const hasGoogleKey = GOOGLE_KEY.length > 0;

let loading: Promise<void> | null = null;

/** Load the Google Maps JavaScript API once. */
export function loadGoogleMaps(): Promise<void> {
  if (!hasGoogleKey) return Promise.reject(new Error("no key"));
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const w = window as unknown as { __sunrouteMapsReady?: () => void };
    w.__sunrouteMapsReady = () => resolve();
    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: GOOGLE_KEY,
      v: "weekly",
      language: "he",
      region: "IL",
      loading: "async",
      callback: "__sunrouteMapsReady",
    });
    script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
    script.async = true;
    script.onerror = () => {
      loading = null;
      reject(new Error("maps script failed"));
    };
    document.head.appendChild(script);
  });
  return loading;
}
