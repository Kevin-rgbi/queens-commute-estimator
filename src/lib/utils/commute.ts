import { COMMUTE_THRESHOLDS } from "@/lib/constants";
import { CommuteRating } from "@/lib/types";

export function getCommuteRating(durationMin: number): CommuteRating {
  if (durationMin <= COMMUTE_THRESHOLDS.VERY_SHORT_MAX) {
    return "Very Short";
  }

  if (durationMin <= COMMUTE_THRESHOLDS.SHORT_MAX) {
    return "Short";
  }

  if (durationMin <= COMMUTE_THRESHOLDS.MODERATE_MAX) {
    return "Moderate";
  }

  if (durationMin <= COMMUTE_THRESHOLDS.LONG_MAX) {
    return "Long";
  }

  return "Very Long";
}

export function formatDistance(distanceKm: number): string {
  return `${distanceKm.toFixed(1)} km`;
}

export function formatDuration(durationMin: number): string {
  return `${Math.round(durationMin)} min`;
}
