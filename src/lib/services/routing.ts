import { Coordinate } from "@/lib/types";
import { metersToKm, secondsToMinutes } from "@/lib/utils/geo";

export type RouteProfile = "driving" | "walking";

export type RouteEstimate = {
  distanceKm: number;
  durationMin: number;
  geometry: Coordinate[];
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

  return {
    distanceKm: metersToKm(route.distance),
    durationMin: secondsToMinutes(route.duration),
    geometry: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
  };
}
