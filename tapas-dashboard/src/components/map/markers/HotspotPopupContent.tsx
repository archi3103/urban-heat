import type { GSOEHotspot } from "@/types/hotspot";

interface HotspotPopupContentProps {
  hotspot: GSOEHotspot;
}

function formatTemp(value: number): string {
  return `${value.toFixed(2)}°C`;
}

function formatScore(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function rankBadgeClass(rank: number): string {
  if (rank <= 3) return "bg-red-500/20 text-red-400 border-red-500/40";
  if (rank <= 7) return "bg-orange-500/20 text-orange-400 border-orange-500/40";
  return "bg-amber-500/20 text-amber-400 border-amber-500/40";
}

/**
 * Tactical popup card shown when a hotspot neon pin is clicked.
 * Styled for Leaflet popup container via `.tapas-hotspot-popup`.
 */
export function HotspotPopupContent({ hotspot }: HotspotPopupContentProps) {
  const deltaPositive = hotspot.bestCooling > 0;

  return (
    <div className="tapas-popup-inner w-[280px] font-sans text-slate-100">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Target Grid
          </p>
          <p className="font-mono text-sm font-bold text-slate-50">
            {hotspot.gridId}
          </p>
        </div>
        <span
          className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${rankBadgeClass(hotspot.globalRank)}`}
        >
          Rank #{hotspot.globalRank}
        </span>
      </div>

      {/* Temperature metrics */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-md border border-red-500/30 bg-red-950/40 p-2">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-red-400/80">
            Detected LST
          </p>
          <p className="mt-0.5 font-mono text-lg font-bold text-red-300">
            {formatTemp(hotspot.originalLst)}
          </p>
        </div>
        <div className="rounded-md border border-blue-500/30 bg-blue-950/40 p-2">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-blue-400/80">
            GSOE Target LST
          </p>
          <p className="mt-0.5 font-mono text-lg font-bold text-blue-300">
            {formatTemp(hotspot.scenarioLst)}
          </p>
        </div>
      </div>

      {/* Mitigation delta badge */}
      <div className="mb-3 flex justify-center">
        <span
          className={`rounded-full border px-3 py-1 text-xs font-mono font-semibold ${
            deltaPositive
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
              : "border-red-500/40 bg-red-500/15 text-red-400"
          }`}
        >
          Δ Mitigation -{hotspot.bestCooling.toFixed(2)}°C
        </span>
      </div>

      {/* Deployment strategy pills */}
      {hotspot.interventions.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
            Deployment Strategy
          </p>
          <div className="flex flex-wrap gap-1.5">
            {hotspot.interventions.map((pill) => (
              <span
                key={pill.label}
                className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-300"
              >
                {pill.label}{" "}
                <span className="font-mono font-semibold">{pill.value}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 4-grid performance & feasibility metrics */}
      <div className="grid grid-cols-2 gap-1.5 rounded-md border border-slate-700/50 bg-slate-800/50 p-2">
        {[
          { label: "Feasibility Score", value: hotspot.feasibilityAdjustedScore.toFixed(4) },
          { label: "Feasibility Rank", value: `#${hotspot.feasibilityRank}` },
          { label: "Urban Density", value: `${Math.round(hotspot.actualUrbanDensity).toLocaleString()}` },
          { label: "Available Ground", value: `${hotspot.availableGround.toFixed(1)}%` },
        ].map((metric) => (
          <div key={metric.label} className="rounded bg-slate-900/60 px-2 py-1.5">
            <p className="text-[8px] font-semibold uppercase tracking-wider text-slate-500">
              {metric.label}
            </p>
            <p className="font-mono text-xs font-bold text-slate-200">
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
