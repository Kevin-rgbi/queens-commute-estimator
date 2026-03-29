"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";

import { Coordinate } from "@/lib/types";

const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type CommuteMapProps = {
  origin: Coordinate | null;
  destination: Coordinate;
  geometry: Coordinate[];
};

export default function CommuteMap({
  origin,
  destination,
  geometry,
}: CommuteMapProps) {
  const center: [number, number] = origin
    ? [(origin.lat + destination.lat) / 2, (origin.lng + destination.lng) / 2]
    : [destination.lat, destination.lng];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <MapContainer center={center} zoom={12} scrollWheelZoom className="h-[340px] w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={[destination.lat, destination.lng]} icon={defaultIcon}>
          <Popup>Queens Tech Incubator (Destination)</Popup>
        </Marker>

        {origin ? (
          <>
            <Marker position={[origin.lat, origin.lng]} icon={defaultIcon}>
              <Popup>ZIP Origin Centroid</Popup>
            </Marker>
            <Polyline
              positions={
                geometry.length > 1
                  ? geometry.map((point) => [point.lat, point.lng] as [number, number])
                  : [
                      [origin.lat, origin.lng],
                      [destination.lat, destination.lng],
                    ]
              }
              pathOptions={{ color: "#0f766e", weight: 5, opacity: 0.85 }}
            />
          </>
        ) : null}
      </MapContainer>
    </div>
  );
}
