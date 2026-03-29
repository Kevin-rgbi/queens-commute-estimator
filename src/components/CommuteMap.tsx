"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";

import { Coordinate } from "@/lib/types";

const destinationIcon = L.divIcon({
  className: "",
  html: '<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#dc2626;border:3px solid #ffffff;box-shadow:0 0 0 2px rgba(220,38,38,0.35);"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const originIcon = L.divIcon({
  className: "",
  html: '<span style="display:block;width:16px;height:16px;border-radius:9999px;background:#0f766e;border:3px solid #ffffff;box-shadow:0 0 0 2px rgba(15,118,110,0.35);"></span>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
          <Popup>Queens Tech Incubator at Queens College (Destination)</Popup>
        </Marker>

        {origin ? (
          <>
            <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
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
