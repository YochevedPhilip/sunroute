# SunRoute – Technical Decisions

Status: approved plan, 2026-11-14. Product details are in `PRODUCT_SPEC.md`.
Prices and limits were checked on 2026-11-14. Check them again before relying on them.

## 1. Summary of decisions

| Topic | Decision |
|---|---|
| Platform | Progressive Web App (PWA) |
| Map | Google Maps JavaScript API |
| Routing | Google Routes API |
| Place search | Google Places Autocomplete |
| Sun calculation | SunCalc library, in the browser |
| Backend | None |
| Storage | Local Storage on the device |
| Hosting | GitHub Pages |
| Code | Vite + TypeScript + React |
| Tests | Vitest |

## 2. Platform: PWA or native

| | PWA | Native (iOS + Android) |
|---|---|---|
| Code bases | One | Two, or a cross-platform framework |
| App stores | Not needed | Needed (Apple costs $99 per year) |
| Updates | Instant, on next open | Store review |
| Map, location, storage | All available | All available |
| Background work, widgets | Limited | Full |

**Decision: PWA.** The app needs a map, network calls and some math. It needs no native feature.

Known limits on iPhone:

- Install is manual: Share → Add to Home Screen. There is no install prompt.
- The installed app and Safari keep separate data.
- Safari may delete the data of sites that are not installed. The installed app is safer.
- Location works, but asks for permission.

## 3. Mapping and routing

### Options compared

| Service | Route shape | Travel time | Traffic | Alternatives | Free allowance | Card needed |
|---|---|---|---|---|---|---|
| Google Routes API | Yes | Yes | Yes (Pro SKU) | Yes | 10,000 per month (Essentials), 5,000 (Pro) | Yes |
| OpenRouteService | Yes | Yes | No | Yes | 2,000 per day | No |
| Mapbox Directions | Yes | Yes | Yes | Yes | About 100,000 per month (not verified on the official page) | Yes |
| TomTom Routing | Yes | Yes | Yes | Yes | 2,500 non-tile requests per day | No |
| Waze | No public routing API | – | – | – | – | – |

### Waze

- There is no public API that returns a route.
- The Waze Transport SDK is only for partner transport companies.
- Waze Deep Links only open the Waze app with a destination. This can be an "Open in Waze" button later.

### Decision: Google, for everything

- One account and one key for map, route and place search.
- Traffic-aware travel time for a future departure time.
- Google's terms do not allow showing its route content on a non-Google map. So the stack must be all Google or no Google.

### Fallback

MapLibre (map) + OpenRouteService (route and search). No credit card and no traffic. The quality of its Hebrew address search was not verified. The code will keep routing behind one small interface, so the provider can be replaced.

### Google APIs to enable

- Maps JavaScript API
- Routes API
- Places API (New)

## 4. Sun calculation

### Library options

| Option | Accuracy | Size | Licence | Note |
|---|---|---|---|---|
| SunCalc | Good enough for this use | Very small | BSD-2 | Most used, simple |
| astronomy-engine | Very high | Larger | MIT | More than we need |
| NREL SPA ports | Scientific grade | Medium | Varies by port | More than we need |
| Online sun APIs | Varies | – | – | Adds network calls for no benefit |

**Decision: SunCalc.** The error that matters here is tens of degrees (which side), not fractions of a degree.

Warning: SunCalc versions describe the azimuth start differently (from north, or from south). All sun calls go through one wrapper function that returns degrees clockwise from north. Tests lock this behaviour.

### Calculation model (version 1)

1. **Sample the route.** Cut the route line into steps of about 200 m.
2. **Time at each step.** Use the step durations from the route response. Inside a step, spread the time by distance.
3. **Heading.** Compass bearing from one point to the next (0° = north, clockwise).
4. **Sun.** Azimuth and elevation at that point and time.
5. **Relative angle.** `rel = azimuth − heading`, normalised to −180°…180°. Positive means the sun is on the right.
6. **Class.**
   - Elevation below −0.83°: below the horizon.
   - |rel| ≤ 30°: front.
   - |rel| ≥ 150°: behind.
   - Otherwise: right (rel > 0) or left (rel < 0).
7. **Exposure weight.** `w = cos(elevation) × |sin(rel)|`, added to the right or left side, multiplied by the time of the step.
   - A low sun from the side gives a weight near 1.
   - A high sun (summer noon in Israel is about 80°) gives a weight near 0, because it mostly hits the roof.
8. **Result.** Total weighted minutes per side, percent of journey time per class, and the recommended side. If the two sides differ by less than about 10%, report "no clear difference".

The angles (30°, 150°) and the 10% limit are constants in one file, so they are easy to tune after real trips.

### What is reliable

| Item | Reliability |
|---|---|
| Sun azimuth and elevation | Reliable |
| Vehicle heading | Reliable on open road, noisy on short curved segments |
| Arrival time at each point | Good; traffic errors of 10 minutes shift the sun only about 2.5° |
| Exposure through windows | Estimate; depends on window size, roof and tint |
| Real shade from buildings, trees, terrain, clouds | Not calculated |

### Departure-time comparison

The route shape almost does not change with the departure time. So the app fetches the route once and repeats only the sun math for other times. This is instant and makes no API calls.

Automatic search for the best time is practical later: test every 15 minutes in a time window, locally.

## 5. Backend and storage

| Option | Value now | Cost | Complexity |
|---|---|---|---|
| No backend + Local Storage | Enough for saved places and trips | Free | Lowest |
| Supabase | Sync between devices, accounts | Free tier | Medium |
| Firebase | Same | Free tier | Medium |

**Decision: no backend.** Add Supabase or Firebase only if sync between devices becomes a real need.

Google terms limit storing Google content. The app stores only what the user typed, place IDs and the user's own labels.

## 6. Architecture

```
Browser (PWA)
├── UI (React, Hebrew, RTL)
├── Map layer        → Google Maps JavaScript API
├── Route service    → Google Routes API
├── Place search     → Google Places Autocomplete
├── Sun engine       → SunCalc + exposure model (pure functions, no network)
└── Storage          → Local Storage
```

Planned folders:

```
src/
  sun/        sun position, heading, exposure model, tests
  routing/    route provider interface + Google implementation
  ui/         screens and components
  storage/    saved places and trips
  i18n/       Hebrew texts
```

The sun engine has no dependency on Google or on React. It can be tested alone.

## 7. External accounts and keys

| Account | Purpose | Cost |
|---|---|---|
| Google Cloud with billing | One API key for Maps, Routes and Places | Free within the allowances; credit card required |
| GitHub | Code and hosting (GitHub Pages) | Free |

## 8. Costs

| Google SKU | Free per month | Price after, per 1,000 |
|---|---|---|
| Dynamic Maps | 10,000 | $7.00 |
| Routes: Compute Routes Essentials | 10,000 | $5.00 |
| Routes: Compute Routes Pro (traffic-aware) | 5,000 | $10.00 |
| Autocomplete Requests | 10,000 | $2.83 |

- Free allowances are per SKU and do not combine.
- Expected personal use: a few hundred calls per month. Expected cost: $0.
- Hosting: $0. Backend: none.
- This is not a guarantee. Google can change prices, and a leaked key can cause charges.

## 9. Security

The API key is visible in the browser. This is normal for Google Maps web apps. Protection:

1. Restrict the key to the app's web address (HTTP referrer).
2. Restrict the key to the three APIs in use.
3. Set a low daily quota on each API.
4. Set a budget alert in Google Cloud billing.
5. Keep the key out of the git history where possible (environment file for local work, build secret for deployment).

There are no user accounts and no personal data on any server.

## 10. Risks and limits

| Risk | Effect | Answer |
|---|---|---|
| Model does not match real feeling in the car | Wrong advice | Tune constants after real trips; always show the estimate note |
| Key abuse | Unexpected bill | Restrictions, quotas, budget alert |
| Google price or terms change | Cost or rework | Routing behind an interface; fallback stack named above |
| iPhone PWA limits | Install is less obvious | Short install guide in the app |
| Noisy heading in cities | Flickering colours on the map | Smooth the heading over neighbouring steps |
| Clouds, buildings, tunnels | Less sun than estimated | Stated clearly as out of scope |

## 11. Roadmap

| Phase | Content | Needs |
|---|---|---|
| 1 | Project setup; sun engine with tests | Nothing external |
| 2 | Search screen, place search, route on map | Google API key |
| 3 | Route colouring, sun indicator, summary, recommendation | – |
| 4 | Departure-time comparison | – |
| 5 | PWA install, saved places, deployment to GitHub Pages | GitHub repository |
| 6 | Real-trip checks and tuning | Real trips |
| Later | Automatic best time, Open in Waze, buses | – |

## 12. Testing strategy

- **Unit tests (Vitest)** for the sun engine:
  - Sun position against the NOAA Solar Calculator for Israeli locations, in summer and winter, morning, noon and evening.
  - Heading on known pairs of points (north, east, south, west).
  - Relative angle and class at the borders (30°, 150°, ±180° wrap).
  - Simple routes with a known answer, for example driving north in the afternoon gives sun on the left.
  - Night trips and trips across sunset.
- **Manual tests:** iPhone Safari, Android Chrome, desktop Chrome; install on the home screen; Hebrew and RTL layout.
- **Real-world checks:** at least three real trips, comparing the app with what is seen in the car.

## 13. Bus journeys (future research notes)

- The Ministry of Transport publishes a free static GTFS file for all of Israel: `https://gtfs.mot.gov.il/gtfsfiles/israel-public-transportation.zip`. The feed is listed with route shapes.
- The file is too large to read in the browser. Options: a small script that prepares the data for chosen lines, or the Open Bus Stride API (Hasadna project).
- Real-time data (SIRI / GTFS Realtime) needs registration with the Ministry. It is not needed for a sun estimate, because the timetable is enough.
- The sun engine needs only a route shape and times, so it will work for buses without changes.

## 14. Sources

- Google Maps Platform pricing: https://developers.google.com/maps/billing-and-pricing/pricing
- Google Routes API billing: https://developers.google.com/maps/documentation/routes/usage-and-billing
- Google Maps Platform service terms: https://cloud.google.com/maps-platform/terms/maps-service-terms
- Waze Transport SDK: https://developers.google.com/waze/intro-transport
- OpenRouteService plans: https://openrouteservice.org/plans/
- SunCalc: https://github.com/mourner/suncalc
- Israel GTFS feed: https://mobilitydatabase.org/feeds/gtfs/mdb-2519
- Israel GTFS developer document: https://www.gov.il/BlobFolder/generalpage/gtfs_general_transit_feed_specifications/he/Gtfs_Documentation_v4.pdf
- Open Bus: https://github.com/hasadna/open-bus
