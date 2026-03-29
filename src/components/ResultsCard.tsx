import { CommuteEstimate } from "@/lib/types";
import { formatDistance, formatDuration } from "@/lib/utils/commute";

type ResultsCardProps = {
  result: CommuteEstimate | null;
  error: string | null;
};

export function ResultsCard({ result, error }: ResultsCardProps) {
  if (error) {
    return (
      <section className="card border-rose-200 bg-rose-50/70">
        <h3 className="text-base font-semibold text-rose-900">Unable to estimate commute</h3>
        <p className="mt-1 text-sm text-rose-700">{error}</p>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="card">
        <h3 className="text-base font-semibold text-slate-900">Results</h3>
        <p className="mt-1 text-sm text-slate-600">
          Your estimate will appear here after entering a ZIP code and selecting a travel mode.
        </p>
      </section>
    );
  }

  return (
    <section className="card space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Estimated Commute</h3>
        <p className="mt-1 text-sm text-slate-600">{result.originLabel}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Travel Time" value={formatDuration(result.durationMin)} />
        <Stat label="Commute Rating" value={result.rating} />
        <Stat label="Distance" value={formatDistance(result.distanceKm)} />
      </div>

      <div>
        <h4 className="text-sm font-semibold text-slate-800">How this estimate was calculated</h4>
        <p className="mt-1 text-sm text-slate-700">{result.explanation}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <strong className="font-semibold text-slate-900">Text Summary:</strong> From ZIP {result.zipCode},
        traveling by {result.mode === "transit" ? "train/public transit" : result.mode} to Queens Tech Incubator is
        estimated at {formatDuration(result.durationMin)} over {formatDistance(result.distanceKm)} ({result.rating}).
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </article>
  );
}
