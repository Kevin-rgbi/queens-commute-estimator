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
    }

    if (mode === "walk") {
      const route = await estimateRouteWithOsrm(originResult.coordinate, destination, "walking");
      distanceKm = route.distanceKm;
      durationMin = route.durationMin;
      geometry = route.geometry;
      explanation =
        "Walk estimate is based on pedestrian network distance from ZIP centroid to destination using OSRM walking profile.";
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

    const response: CommuteEstimate = {
      zipCode: body.zipCode,
      mode,
      originLabel: originResult.label,
      origin: originResult.coordinate,
      destinationLabel: `${DESTINATION.name}, ${DESTINATION.address}`,
      destination,
      distanceKm: Number(distanceKm.toFixed(2)),
      durationMin: Math.round(durationMin),
      rating: getCommuteRating(durationMin),
      explanation,
      methodology:
        "Estimates are generated from ZIP centroid geocoding, GIS routing logic, and mode-specific assumptions. Transit uses modular API logic with optional MTA GTFS alert weighting.",
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
