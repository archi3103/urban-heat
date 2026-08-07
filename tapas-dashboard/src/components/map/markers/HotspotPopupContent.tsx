import type { GSOEHotspot } from "@/types/hotspot";

interface HotspotPopupContentProps {
  hotspot: GSOEHotspot;
}

function formatTemp(value: number): string {
  return `${value.toFixed(2)}°C`;
}

function rankBadgeClass(rank: number): string {
  if (rank <= 3) return "bg-red-500/20 text-red-400 border-red-500/40";
  if (rank <= 15) return "bg-orange-500/20 text-orange-400 border-orange-500/40";
  if (rank <= 50) return "bg-amber-500/20 text-amber-400 border-amber-500/40";
  return "bg-sky-500/20 text-sky-400 border-sky-500/40";
}

/**
 * Tactical popup card shown when a hotspot neon pin or neutral marker is clicked.
 * Streamlined layout focusing on Detected LST, Max Mitigation, and Top 5 strategies.
 */
export function HotspotPopupContent({ hotspot }: HotspotPopupContentProps) {
  return (
    <div className="tapas-popup-inner w-[280px] font-sans text-slate-100">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Target Grid
          </p>
          <p className="font-mono text-sm font-bold text-slate-50">
            {hotspot.gridId}
          </p>
        </div>
        {hotspot.isHotspot && hotspot.globalRank !== undefined ? (
          <span
            className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${rankBadgeClass(hotspot.globalRank)}`}
          >
            Rank #{hotspot.globalRank}
          </span>
        ) : (
          <span
            className="shrink-0 rounded border border-slate-700 bg-slate-800/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400"
          >
            STANDARD GRID
          </span>
        )}
      </div>

      {/* Temperature metrics */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="rounded-md border border-red-500/30 bg-red-950/40 p-2">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-red-400/80">
            Detected LST
          </p>
          <p className="mt-0.5 font-mono text-lg font-bold text-red-300">
            {formatTemp(hotspot.originalLst)}
          </p>
        </div>
        <div className="rounded-md border border-emerald-500/30 bg-emerald-950/40 p-2">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-400/80">
            Max Mitigation
          </p>
          <p className="mt-0.5 font-mono text-lg font-bold text-emerald-300">
            -{formatTemp(hotspot.bestScenario.cooling)}
          </p>
        </div>
      </div>

      {/* Top 5 Intervention Strategies */}
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Top 5 Intervention Strategies
        </p>
        <div className="max-h-[160px] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700">
          {hotspot.scenarios.slice(0, 5).map((scenario, index) => (
            <div
              key={scenario.scenarioId || index}
              className={`flex items-center justify-between gap-2 rounded border border-slate-800/85 bg-slate-900/60 px-2.5 py-1.5 text-xs transition-colors hover:bg-slate-800/50 ${
                index === 0 ? "border-emerald-500/30 bg-emerald-950/10" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-200">
                  {scenario.scenarioName}
                </p>
                <p className="text-[9px] text-slate-400 font-mono">
                  F-Rank #{scenario.feasibilityRank}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono font-bold text-emerald-400">
                  -{scenario.cooling.toFixed(2)}°C
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
