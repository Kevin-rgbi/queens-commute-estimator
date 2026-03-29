# Queens Commute Estimator

Modern web app for estimating relative commute time from a NYC ZIP code to the **Queens Tech Incubator at Queens College**.

The app combines:
- ZIP geocoding (GIS origin approximation)
- Routing for car/walk using OSRM
- Modular transit estimation with optional MTA GTFS-realtime alert weighting
- Interactive map visualization (Leaflet)

## Features

- ZIP code input for NYC-area origins
- Fixed destination at Queens College
- Travel mode toggle: Car, Train/Public Transit, Walk
- Results include:
	- Estimated travel time
	- Relative commute rating (Very Short -> Very Long)
	- Distance estimate
	- Explanation of estimate method
- Output shown as both text summary and map visualization
- Destination and ZIP-origin markers on map

## Relative Commute Thresholds

- 0-20 min: Very Short
- 21-35 min: Short
- 36-50 min: Moderate
- 51-70 min: Long
- 71+ min: Very Long

## Tech Stack

- Next.js (App Router, TypeScript)
- React
- Leaflet + React Leaflet
- Tailwind CSS
- Nominatim geocoding
- OSRM routing
- Optional MTA GTFS-realtime alerts parsing (`gtfs-realtime-bindings`)

## Project Structure

```text
src/
	app/
		api/estimate/route.ts      # Main commute estimation API
		page.tsx                   # App UI shell
		globals.css                # Visual design and responsive styles
	components/
		ZipInputCard.tsx           # ZIP + mode UI controls
		ResultsCard.tsx            # Commute metrics and explanation
		CommuteMap.tsx             # Leaflet map rendering
		MapClient.tsx              # Dynamic no-SSR map wrapper
	lib/
		constants.ts               # Destination + thresholds
		types.ts                   # Shared TypeScript types
		utils/
			geo.ts                   # Distance/time conversion helpers
			commute.ts               # Commute categorization helpers
		services/
			geocoding.ts             # ZIP -> coordinate lookup
			routing.ts               # OSRM car/walk route estimates
			transit.ts               # Modular transit layer + optional MTA logic
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env.local
```

3. Start dev server:

```bash
npm run dev
```

4. Open:

`http://localhost:3000`

## Environment Variables

See `.env.example` for placeholders.

- `NOMINATIM_EMAIL`: recommended contact for geocoder user-agent
- `MTA_API_KEY`: optional key for MTA GTFS-realtime alerts weighting
- `MTA_ALERTS_FEED_URL`: optional override for MTA alerts feed
- `TRANSIT_ROUTING_API_URL`: optional external transit router endpoint
- `TRANSIT_ROUTING_API_KEY`: optional bearer key for external transit router

## Transit Layer Modularity

Transit is intentionally modular:
- If `TRANSIT_ROUTING_API_URL` is set, the app uses that live transit routing result.
- Otherwise, it falls back to a GIS-based heuristic.
- If `MTA_API_KEY` is set, active MTA alerts can slightly adjust transit estimates.

This makes it straightforward to replace the fallback with a full GTFS/MTA routing engine later.
