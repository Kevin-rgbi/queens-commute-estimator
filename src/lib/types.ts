export type TravelMode = "car" | "transit" | "walk";

export type Coordinate = {
  lat: number;
  lng: number;
};

export type CommuteRating =
  | "Very Short"
  | "Short"
  | "Moderate"
  | "Long"
  | "Very Long";

export type CommuteEstimate = {
  zipCode: string;
  mode: TravelMode;
  originLabel: string;
  origin: Coordinate;
  destinationLabel: string;
  destination: Coordinate;
  distanceKm: number;
  durationMin: number;
  durationRangeMin: number;
  durationRangeMax: number;
  rating: CommuteRating;
  explanation: string;
  methodology: string;
  geometry: Coordinate[];
};
