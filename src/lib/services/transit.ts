import GtfsRealtimeBindings from "gtfs-realtime-bindings";

import { Coordinate } from "@/lib/types";
import { haversineDistanceKm } from "@/lib/utils/geo";

const DEFAULT_MTA_ALERTS_URL =
  "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fall-alerts";

type TransitRoutingApiResponse = {
  durationMinutes: number;
  distanceKm: number;
  geometry?: Coordinate[];
  providerName?: string;
  explanation?: string;
};

export type TransitEstimateInput = {
  origin: Coordinate;
  destination: Coordinate;
};

export type TransitEstimate = {
  durationMin: number;
  distanceKm: number;
  geometry: Coordinate[];
  explanation: string;
};

export async function estimateTransitCommute({
  origin,
  destination,
}: TransitEstimateInput): Promise<TransitEstimate> {
  // If a dedicated transit router is configured, prefer it over heuristic estimation.
  const externalEstimate = await tryExternalTransitRouting(origin, destination);
  if (externalEstimate) {
    return externalEstimate;
  }

  const alertsImpact = await fetchMtaAlertsImpact();
  const directDistanceKm = haversineDistanceKm(origin, destination);

  const inVehicleMinutes = (directDistanceKm * 1.28 * 60) / 24;
  const transferAndWaitMinutes = 12;
  const firstLastMileMinutes = 10;

  // Heuristic baseline for NYC transit: in-vehicle + transfer/wait + access/egress walking.
  const baselineMinutes = inVehicleMinutes + transferAndWaitMinutes + firstLastMileMinutes;
  const durationMin = Math.round(
    baselineMinutes * alertsImpact.multiplier + alertsImpact.addedDelayMin,
  );

  return {
    durationMin,
    distanceKm: Number((directDistanceKm * 1.28).toFixed(2)),
    geometry: [origin, destination],
    explanation:
      "Transit estimate uses ZIP centroid geocoding, an NYC subway/bus speed heuristic, " +
      `and optional MTA GTFS alert weighting (${alertsImpact.source}).`,
  };
}

async function tryExternalTransitRouting(
  origin: Coordinate,
  destination: Coordinate,
): Promise<TransitEstimate | null> {
  const endpoint = process.env.TRANSIT_ROUTING_API_URL;
  if (!endpoint) {
    return null;
  }

  const apiKey = process.env.TRANSIT_ROUTING_API_KEY;
  const url =
    `${endpoint}?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as TransitRoutingApiResponse;
  if (!payload.durationMinutes || !payload.distanceKm) {
    return null;
  }

  return {
    durationMin: Math.round(payload.durationMinutes),
    distanceKm: Number(payload.distanceKm.toFixed(2)),
    geometry:
      payload.geometry && payload.geometry.length > 1
        ? payload.geometry
        : [origin, destination],
    explanation:
      payload.explanation ??
      `Transit estimate provided by external routing source (${payload.providerName ?? "custom API"}).`,
  };
}

async function fetchMtaAlertsImpact(): Promise<{
  multiplier: number;
  addedDelayMin: number;
  source: string;
}> {
  const apiKey = process.env.MTA_API_KEY;
  if (!apiKey) {
    return {
      multiplier: 1,
      addedDelayMin: 0,
      source: "no MTA API key configured",
    };
  }

  const feedUrl = process.env.MTA_ALERTS_FEED_URL ?? DEFAULT_MTA_ALERTS_URL;

  try {
    const response = await fetch(feedUrl, {
      headers: {
        "x-api-key": apiKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        multiplier: 1,
        addedDelayMin: 0,
        source: `alerts feed unavailable (${response.status})`,
      };
    }

    const raw = Buffer.from(await response.arrayBuffer());
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(raw);

    const alerts = (feed.entity ?? []).filter((entity) => entity.alert);
    const severeAlerts = alerts.filter((entity) => {
      const text = getAlertText(entity.alert).toLowerCase();
      return /(delay|suspend|no service|reroute|disruption)/.test(text);
    }).length;

    // Alert count increases estimated duration slightly to reflect service disruptions.
    const multiplier = 1 + Math.min(0.3, severeAlerts * 0.02 + alerts.length * 0.003);
    const addedDelayMin = Math.min(12, severeAlerts);

    return {
      multiplier,
      addedDelayMin,
      source: `${alerts.length} active MTA alerts (${severeAlerts} severe)`,
    };
  } catch {
    return {
      multiplier: 1,
      addedDelayMin: 0,
      source: "MTA alert parse failed; fallback heuristics applied",
    };
  }
}

function getAlertText(alert: unknown): string {
  if (!alert || typeof alert !== "object") {
    return "";
  }

  const candidate = alert as {
    headerText?: {
      translation?: Array<{ text?: string | null } | null> | null;
    } | null;
  };

  if (!candidate.headerText?.translation) {
    return "";
  }

  return candidate.headerText.translation
    .map((entry) => entry?.text ?? "")
    .join(" ")
    .trim();
}
