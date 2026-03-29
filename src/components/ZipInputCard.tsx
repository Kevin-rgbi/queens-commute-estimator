"use client";

import { TravelMode } from "@/lib/types";

type ZipInputCardProps = {
  zipCode: string;
  travelMode: TravelMode;
  loading: boolean;
  onZipChange: (zipCode: string) => void;
  onTravelModeChange: (travelMode: TravelMode) => void;
  onEstimate: () => void;
};

const TRAVEL_MODES: Array<{ label: string; value: TravelMode }> = [
  { label: "Car", value: "car" },
  { label: "Train / Public Transit", value: "transit" },
  { label: "Walk", value: "walk" },
];

export function ZipInputCard({
  zipCode,
  travelMode,
  loading,
  onZipChange,
  onTravelModeChange,
  onEstimate,
}: ZipInputCardProps) {
  return (
    <section className="card space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Plan Your Commute</h2>
        <p className="mt-1 text-sm text-slate-600">
          Enter a NYC-area ZIP code and compare estimated time to Queens College.
        </p>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">ZIP Code</span>
        <input
          value={zipCode}
          onChange={(event) => onZipChange(event.target.value.replace(/[^\d]/g, "").slice(0, 5))}
          inputMode="numeric"
          placeholder="e.g. 11367"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-200"
        />
      </label>

      <div>
        <span className="mb-2 block text-sm font-medium text-slate-700">Travel Mode</span>
        <div className="grid gap-2 sm:grid-cols-3">
          {TRAVEL_MODES.map((mode) => {
            const selected = travelMode === mode.value;
            return (
              <button
                key={mode.value}
                type="button"
                onClick={() => onTravelModeChange(mode.value)}
                className={
                  "rounded-xl border px-4 py-3 text-sm font-medium transition " +
                  (selected
                    ? "border-teal-500 bg-teal-50 text-teal-900"
                    : "border-slate-300 bg-white text-slate-700 hover:border-teal-300")
                }
              >
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={onEstimate}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {loading ? "Estimating..." : "Estimate Commute"}
      </button>
    </section>
  );
}
