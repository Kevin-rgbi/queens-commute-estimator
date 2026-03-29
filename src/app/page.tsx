"use client";

import { useMemo, useState } from "react";

import { MapClient } from "@/components/MapClient";
import { ResultsCard } from "@/components/ResultsCard";
import { ZipInputCard } from "@/components/ZipInputCard";
import { DESTINATION } from "@/lib/constants";
import { CommuteEstimate, TravelMode } from "@/lib/types";

export default function Home() {
  const [zipCode, setZipCode] = useState("");
  const [travelMode, setTravelMode] = useState<TravelMode>("car");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CommuteEstimate | null>(null);

  async function estimateCommute() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/estimate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ zipCode, mode: travelMode }),
      });

      const payload = (await response.json()) as CommuteEstimate & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to estimate this commute.");
      }

      setResult(payload);
    } catch (requestError) {
      setResult(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "An unexpected error occurred while estimating your commute.",
      );
    } finally {
      setLoading(false);
    }
  }

  const mapGeometry = useMemo(() => {
    if (!result) {
      return [];
    }
    return result.geometry;
  }, [result]);

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <p className="eyebrow">GIS + Transit Estimate</p>
        <h1 className="hero-title">Queens Commute Estimator</h1>
        <p className="hero-copy">
          Estimate relative travel time from any NYC-area ZIP code to the Queens Tech Incubator at
          Queens College, using geocoding, routing, and transit-aware logic.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-6">
          <ZipInputCard
            zipCode={zipCode}
            travelMode={travelMode}
            loading={loading}
            onZipChange={setZipCode}
            onTravelModeChange={setTravelMode}
            onEstimate={estimateCommute}
          />
          <ResultsCard result={result} error={error} />
        </div>

        <div className="space-y-6">
          <section className="card space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Interactive Map</h2>
              <p className="mt-1 text-sm text-slate-600">
                Destination marker is fixed at Queens College. Origin marker uses your ZIP centroid.
              </p>
            </div>

            <MapClient
              origin={result?.origin ?? null}
              destination={DESTINATION.coordinate}
              geometry={mapGeometry}
            />
          </section>

          <section className="card">
            <h2 className="text-lg font-semibold text-slate-900">Methodology</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              This estimate geocodes ZIP code to a representative origin point, routes to Queens
              Tech Incubator via GIS-aware services, and computes mode-specific travel time. Car and
              walk use road/pedestrian network routing; transit uses a modular layer with optional
              MTA GTFS alert integration or fallback heuristics.
            </p>
            <p className="mt-3 text-sm text-slate-600">
              Relative commute thresholds: 0-20 Very Short, 21-35 Short, 36-50 Moderate, 51-70 Long,
              71+ Very Long.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
