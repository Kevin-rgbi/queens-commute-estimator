import { NextRequest, NextResponse } from "next/server";

import { DESTINATION } from "@/lib/constants";
import { geocodeZip } from "@/lib/services/geocoding";
import { estimateRouteWithOsrm } from "@/lib/services/routing";
import { estimateTransitCommute } from "@/lib/services/transit";
import { CommuteEstimate, TravelMode } from "@/lib/types";
import { getCommuteRating } from "@/lib/utils/commute";

type EstimateRequest = {
  zipCode: string;
  mode: TravelMode;
};

function getDurationRange(mode: TravelMode, durationMin: number): { min: number; max: number } {
  const baseDurationMin = Math.max(1, Math.round(durationMin));
  const spreadByMode: Record<TravelMode, { minFactor: number; maxFactor: number; floorSpread: number }> = {
    car: { minFactor: 0.8, maxFactor: 1.35, floorSpread: 3 },
    transit: { minFactor: 0.85, maxFactor: 1.4, floorSpread: 5 },
    walk: { minFactor: 0.9, maxFactor: 1.2, floorSpread: 4 },
  };

  const spread = spreadByMode[mode];
  const minFromFactor = Math.floor(baseDurationMin * spread.minFactor);
  const maxFromFactor = Math.ceil(baseDurationMin * spread.maxFactor);

  const min = Math.max(1, Math.min(minFromFactor, baseDurationMin - spread.floorSpread));
  const max = Math.max(min + 1, Math.max(maxFromFactor, baseDurationMin + spread.floorSpread));

  return { min, max };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EstimateRequest;

    if (!body?.zipCode || !body?.mode) {
      return NextResponse.json(
        { error: "ZIP code and travel mode are required." },
        { status: 400 },
      );
    }

    const originResult = await geocodeZip(body.zipCode);

    const destination = DESTINATION.coordinate;
    const mode = body.mode;

    let distanceKm = 0;
    let durationMin = 0;
    let geometry = [originResult.coordinate, destination];
    let explanation = "";

    if (mode === "car") {
      const route = await estimateRouteWithOsrm(originResult.coordinate, destination, "driving");
      distanceKm = route.distanceKm;
      durationMin = route.durationMin;
      geometry = route.geometry;
      explanation =
        "Car estimate is based on OSRM road routing from ZIP centroid to destination with current road-network speeds.";
      if (route.durationAdjusted) {
        explanation += " Duration was adjusted to a realistic city-driving bound.";
      }
    }

    if (mode === "walk") {
      const route = await estimateRouteWithOsrm(originResult.coordinate, destination, "walking");
      distanceKm = route.distanceKm;
      durationMin = route.durationMin;
      geometry = route.geometry;
      explanation =
        "Walk estimate is based on pedestrian network distance from ZIP centroid to destination using OSRM walking profile.";
      if (route.durationAdjusted) {
        explanation += " Duration was adjusted to a realistic walking-speed bound.";
      }
    }

    if (mode === "transit") {
      const transit = await estimateTransitCommute({
        origin: originResult.coordinate,
        destination,
      });

      distanceKm = transit.distanceKm;
      durationMin = transit.durationMin;
      geometry = transit.geometry;
      explanation = transit.explanation;
    }

    const durationRange = getDurationRange(mode, durationMin);

    const response: CommuteEstimate = {
      zipCode: body.zipCode,
      mode,
      originLabel: originResult.label,
      origin: originResult.coordinate,
      destinationLabel: `${DESTINATION.name}, ${DESTINATION.address}`,
      destination,
      distanceKm: Number(distanceKm.toFixed(2)),
      durationMin: Math.round(durationMin),
      durationRangeMin: durationRange.min,
      durationRangeMax: durationRange.max,
      rating: getCommuteRating(durationMin),
      explanation,
      methodology:
        "Estimates are generated from ZIP centroid geocoding, GIS routing logic, and mode-specific assumptions. Transit uses modular API logic with optional MTA GTFS alert weighting. Time ranges are planning guides and do not account for personal delays or major world events.",
      geometry,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while estimating commute time.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
