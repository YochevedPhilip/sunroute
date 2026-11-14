# SunRoute

Shows which side of a car gets direct sun on a journey. Hebrew, RTL, installable PWA.
Plans: `PRODUCT_SPEC.md` and `TECHNICAL_DECISIONS.md`.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the app locally (http://localhost:5173) |
| `npm test` | Run all tests |
| `npm run build` | Check types and build into `dist/` |
| `node scripts/make-icons.mjs` | Re-create the PNG icons |

## Google key

1. Copy `.env.example` to `.env.local`.
2. Put the key after `VITE_GOOGLE_MAPS_API_KEY=`.
3. Restart `npm run dev`.

Without a key the app shows a demo trip (Tel Aviv – Haifa) with a simple drawn route.

For GitHub Pages: add the key as the Actions secret `VITE_GOOGLE_MAPS_API_KEY`.
Restrict the key to the site address and to the three APIs, and set quotas and a budget alert.

## Code map

- `src/sun/` – sun position, heading, exposure model (no network). Tune numbers in `config.ts`.
- `src/routing/` – route provider interface, Google Routes API, demo route.
- `src/maps/loader.ts` – loads Google Maps JavaScript API.
- `src/ui/` – screens. `src/i18n/he.ts` – all Hebrew texts.
- `src/storage/` – saved and recent places (Local Storage).
- `public/` – manifest, service worker, icons.
