"use client";

import dynamic from "next/dynamic";

import { Coordinate } from "@/lib/types";

const CommuteMap = dynamic(() => import("@/components/CommuteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[340px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
      Loading map...
    </div>
  ),
});

type MapClientProps = {
  origin: Coordinate | null;
  destination: Coordinate;
  geometry: Coordinate[];
};

export function MapClient({ origin, destination, geometry }: MapClientProps) {
  return <CommuteMap origin={origin} destination={destination} geometry={geometry} />;
}
