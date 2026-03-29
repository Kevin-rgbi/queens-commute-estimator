import { Coordinate } from "@/lib/types";

const EARTH_RADIUS_KM = 6371;

export function haversineDistanceKm(a: Coordinate, b: Coordinate): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);

  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return EARTH_RADIUS_KM * c;
}

export function metersToKm(meters: number): number {
  return meters / 1000;
}

export function secondsToMinutes(seconds: number): number {
  return seconds / 60;
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}
