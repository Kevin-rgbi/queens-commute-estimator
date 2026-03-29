import { NYC_ZIP_PATTERN } from "@/lib/constants";
import { Coordinate } from "@/lib/types";

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
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
  const strictUrl =
    `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(normalizedZip)}` +
    "&city=New%20York&state=New%20York&country=United%20States&format=jsonv2&limit=1";

  const strictResults = await fetchNominatim(strictUrl);
  if (strictResults.length > 0) {
    return toZipGeocodeResult(strictResults[0]);
  }

  const fallbackUrl =
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${normalizedZip}, NYC`)}` +
    "&format=jsonv2&limit=1";

  const fallbackResults = await fetchNominatim(fallbackUrl);
  if (fallbackResults.length === 0) {
    throw new Error("Could not locate that ZIP code in the NYC region.");
  }

  return toZipGeocodeResult(fallbackResults[0]);
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
