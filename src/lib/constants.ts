import { Coordinate } from "@/lib/types";

export const DESTINATION = {
  name: "Queens Tech Incubator at Queens College",
  address: "65-30 Kissena Blvd, Queens, NY 11367",
  coordinate: {
    lat: 40.73659,
    lng: -73.81678,
  } satisfies Coordinate,
};

export const COMMUTE_THRESHOLDS = {
  VERY_SHORT_MAX: 20,
  SHORT_MAX: 35,
  MODERATE_MAX: 50,
  LONG_MAX: 70,
};

export const NYC_ZIP_PATTERN = /^\d{5}$/;
