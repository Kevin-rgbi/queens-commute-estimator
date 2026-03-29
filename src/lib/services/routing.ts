import { Coordinate } from "@/lib/types";
import { metersToKm, secondsToMinutes } from "@/lib/utils/geo";

export type RouteProfile = "driving" | "walking";

export type RouteEstimate = {
  distanceKm: number;
  durationMin: number;
  geometry: Coordinate[];
  durationAdjusted: boolean;
};

type OsrmRouteResponse = {
  routes: Array<{
    distance: number;
    duration: number;
    geometry: {
      coordinates: [number, number][];
    };
  }>;
};

export async function estimateRouteWithOsrm(
  origin: Coordinate,
  destination: Coordinate,
  profile: RouteProfile,
): Promise<RouteEstimate> {
  const url =
    `https://router.project-osrm.org/route/v1/${profile}/` +
    `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
    "?overview=full&geometries=geojson";

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Routing service unavailable for ${profile} mode.`);
  }

  const payload = (await response.json()) as OsrmRouteResponse;
  const route = payload.routes?.[0];

  if (!route) {
    throw new Error("No route found for this ZIP code and travel mode.");
  }

  const rawDistanceKm = metersToKm(route.distance);
  const rawDurationMin = secondsToMinutes(route.duration);
  const adjustedDurationMin = applyDurationSanity(profile, rawDistanceKm, rawDurationMin);

  return {
    distanceKm: rawDistanceKm,
    durationMin: adjustedDurationMin,
    geometry: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
    durationAdjusted: adjustedDurationMin !== rawDurationMin,
  };
}

function applyDurationSanity(
  profile: RouteProfile,
  distanceKm: number,
  durationMin: number,
): number {
  if (profile === "walking") {
    // Clamp walking pace to a realistic upper bound (~6 km/h).
    const minWalkingMinutes = (distanceKm / 6) * 60;
    return Math.max(durationMin, minWalkingMinutes);
  }

  if (profile === "driving") {
    // Prevent impossible city-driving durations by capping average speed (~65 km/h).
    const minDrivingMinutes = (distanceKm / 65) * 60;
    return Math.max(durationMin, minDrivingMinutes);
  }

  return durationMin;
}
