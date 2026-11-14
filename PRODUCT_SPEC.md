# SunRoute – Product Specification

Status: approved plan, 2026-11-14. Technical details are in `TECHNICAL_DECISIONS.md`.

## 1. Product overview

SunRoute tells a passenger which side of a vehicle will get direct sun during a journey, so they can sit on the shaded side.

- Personal use, in Israel. Not a commercial product.
- Version 1 covers car journeys only. Bus journeys come later.
- The app is a Progressive Web App (PWA): it runs in the browser and can be installed on the home screen of an iPhone or Android phone.

## 2. Users and main use cases

### A. Car journey (version 1)

The user can:

1. Enter a start and a destination.
2. Choose a departure date and time.
3. See the driving route on an interactive map.
4. See where the sun is relative to the car along the route: right, left, front, behind, or below the horizon.
5. See the estimated sun exposure of each side.
6. Get a recommended side to sit on.
7. Change the departure time and compare options.

### B. Bus journey (later)

The user chooses a bus line, a boarding stop and an exit stop, plus date and time. The app uses the real line route and gives the same sun analysis. Not in version 1.

## 3. Functional requirements

### Search

- FR1. Start and destination fields with address and place search in Hebrew.
- FR2. "My location" as a possible start.
- FR3. Date picker (default: today) and time picker (default: now).
- FR4. A swap button for start and destination.
- FR5. Recently used and saved places, kept on the device.

### Route

- FR6. Fetch a driving route with its shape and travel time.
- FR7. Show the route on a map that can be moved and zoomed.

### Sun analysis

- FR8. For each small part of the route, compute the arrival time, the car heading and the sun position.
- FR9. Classify each part: sun on the right, on the left, in front, behind, or below the horizon.
- FR10. Estimate exposure for each side, weighted by time and by sun height.
- FR11. Recommend the side with less exposure. If the difference is small, say "no clear difference".
- FR12. If the sun is below the horizon for the whole trip, say so instead of recommending a side.

### Results

- FR13. Colour the route on the map by sun side.
- FR14. Show the sun direction with a simple indicator (sun icon or arrow relative to the car).
- FR15. Summary: percent of the journey and minutes with sun on the right and on the left, plus time with sun in front, behind, and below the horizon.
- FR16. A clear note that results are estimates and that buildings, trees, hills and clouds are not included.

### Comparison

- FR17. The user can add two or three departure times and see them side by side.
- FR18. Changing the time recomputes the result immediately, without a new route request.

### General

- FR19. Full Hebrew interface, right-to-left.
- FR20. Mobile-first layout that also works on desktop.
- FR21. Installable on the home screen.
- FR22. Clear error messages in Hebrew (no route found, no network, place not found).

## 4. User flows

### Flow 1 – plan a trip

1. Open the app. The search screen appears.
2. Type the start and the destination and pick from the suggestions.
3. Keep or change the date and time.
4. Tap "חשב מסלול".
5. The results screen shows the map, the recommended side and the summary.

### Flow 2 – compare departure times

1. On the results screen, tap "השווה שעות יציאה".
2. Add a second time (for example 15:30 next to 14:00).
3. See both results side by side, with the better option marked.

### Flow 3 – repeat a trip

1. Open the app.
2. Tap a saved or recent trip.
3. The result is computed for the current time.

## 5. Screens

### Screen 1 – Search (main screen)

- Start field, destination field, swap button.
- Date and time.
- "חשב מסלול" button.
- List of recent and saved trips.

### Screen 2 – Results

- Top: the answer in one line, for example "שב בצד ימין – פחות שמש".
- Map: route coloured by sun side, with a legend.
- A small car diagram that shows where the sun is.
- Summary card: percent and minutes for right and left, time with sun in front and behind.
- Time control to change the departure time quickly.
- Estimate note.

### Screen 3 – Compare

- One card per departure time: recommended side, exposure of each side, travel time.
- The best option is marked.

## 6. Three levels of truth

The app must keep these apart in its wording:

| Level | Meaning | Reliability |
|---|---|---|
| Sun position | Where the sun is in the sky at a place and time | Reliable |
| Estimated exposure | How much sun reaches each side, from a simple model | Estimate |
| Real shade | Effect of buildings, trees, hills, clouds, tunnels, window tint | Not known to the app |

## 7. MVP scope

### In version 1

- Start and destination search.
- Date and time.
- Driving route on an interactive map.
- Sun calculation along the route.
- Right / left / front / behind indicators.
- Exposure estimate and recommended side.
- Manual comparison of departure times.
- Saved and recent places on the device.
- Hebrew, RTL, installable PWA.

### Postponed

- Bus journeys.
- Automatic search for the best departure time.
- Choosing between alternative routes.
- User accounts, sync between devices.
- Weather and cloud data.
- Building and terrain shade.
- "Open in Waze" button.

## 8. Definition of the final working application

Version 1 is done when:

1. It is online at a public HTTPS address.
2. It installs on an iPhone and on an Android phone and opens like an app.
3. A real trip (for example Tel Aviv to Haifa) gives a route, a coloured map, a summary and a recommended side.
4. The sun direction matches reality on at least three real test trips.
5. Changing the departure time changes the result correctly.
6. The whole interface is in Hebrew and right-to-left.
7. Monthly cost is zero at normal personal use.
