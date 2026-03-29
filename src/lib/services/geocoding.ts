import { NYC_ZIP_PATTERN } from "@/lib/constants";
import { Coordinate } from "@/lib/types";

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
};

type ZippopotamResponse = {
  "post code": string;
  country: string;
  "country abbreviation": string;
  places: Array<{
    "place name": string;
    longitude: string;
    latitude: string;
    state: string;
    "state abbreviation": string;
  }>;
};

export type ZipGeocodeResult = {
  coordinate: Coordinate;
  label: string;
};

export async function geocodeZip(zipCode: string): Promise<ZipGeocodeResult> {
  if (!NYC_ZIP_PATTERN.test(zipCode)) {
    throw new Error("Please enter a valid 5-digit ZIP code.");
  }

  const normalizedZip = zipCode.trim();

  const nominatimResult = await geocodeZipWithNominatim(normalizedZip);
  if (nominatimResult) {
    return nominatimResult;
  }

  const zippopotamResult = await geocodeZipWithZippopotam(normalizedZip);
  if (zippopotamResult) {
    return zippopotamResult;
  }

  throw new Error("Could not geocode that ZIP code right now. Please try again in a moment.");
}

async function geocodeZipWithNominatim(zipCode: string): Promise<ZipGeocodeResult | null> {
  const strictUrl =
    `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zipCode)}` +
    "&city=New%20York&state=New%20York&country=United%20States&format=jsonv2&limit=1";

  try {
    const strictResults = await fetchNominatim(strictUrl);
    if (strictResults.length > 0) {
      return toZipGeocodeResult(strictResults[0]);
    }
  } catch {
    // Fall through to additional providers.
  }

  const fallbackUrl =
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${zipCode}, NYC`)}` +
    "&format=jsonv2&limit=1";

  try {
    const fallbackResults = await fetchNominatim(fallbackUrl);
    if (fallbackResults.length > 0) {
      return toZipGeocodeResult(fallbackResults[0]);
    }
  } catch {
    // Fall through to additional providers.
  }

  return null;
}

async function geocodeZipWithZippopotam(zipCode: string): Promise<ZipGeocodeResult | null> {
  const response = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(zipCode)}`, {
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 1800 },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as ZippopotamResponse;
  const place = payload.places?.[0];
  if (!place) {
    return null;
  }

  return {
    coordinate: {
      lat: Number(place.latitude),
      lng: Number(place.longitude),
    },
    label: `${place["place name"]}, ${place.state} ${payload["post code"]}, ${payload.country}`,
  };
}

async function fetchNominatim(url: string): Promise<NominatimResult[]> {
  const contact = process.env.NOMINATIM_EMAIL ?? "no-reply@example.com";

  const response = await fetch(url, {
    headers: {
      "User-Agent": `QueensCommuteEstimator/1.0 (${contact})`,
      Accept: "application/json",
    },
    next: { revalidate: 1800 },
  });

  if (!response.ok) {
    throw new Error("Geocoding service is currently unavailable.");
  }

  const payload = (await response.json()) as NominatimResult[];
  return payload;
}

function toZipGeocodeResult(result: NominatimResult): ZipGeocodeResult {
  return {
    coordinate: {
      lat: Number(result.lat),
      lng: Number(result.lon),
    },
    label: result.display_name,
  };
}
