import type { GSOEHotspot } from "@/types/hotspot";

interface UrbanDiagnosticsProps {
  selectedHotspot: GSOEHotspot | null;
  /** stacked = single column for drawer; grid = responsive grid (default) */
  variant?: "grid" | "stacked";
  onCoolingCardClick?: () => void;
}

/**
 * Urban heat diagnostics summary cards.
 * Binds dynamically to the selected hotspot, removing mock metrics.
 */
export function UrbanDiagnostics({
  selectedHotspot,
  variant = "grid",
  onCoolingCardClick,
}: UrbanDiagnosticsProps) {
  const gridClass =
    variant === "stacked"
      ? "grid grid-cols-1 gap-3"
      : "grid grid-cols-2 gap-3 sm:grid-cols-4";

  if (!selectedHotspot) {
    return (
      <div className="rounded-lg border border-slate-800/40 bg-slate-900/20 p-4 text-center text-xs text-slate-500">
        No active hotspot selected. Click a map pin to load metrics.
      </div>
    );
  }

  const cards = [
    {
      id: "lst",
      label: "Land Surface Temp.",
      value: selectedHotspot.originalLst.toFixed(2),
      unit: "°C",
      trend: "up" as const,
      delta: `Severity: ${selectedHotspot.severity}`,
      clickable: false,
    },
    {
      id: "cooling",
      label: "Cooling Potential",
      value: `-${selectedHotspot.bestCooling.toFixed(2)}`,
      unit: "°C",
      trend: "down" as const,
      delta: `Optimal: ${selectedHotspot.bestIntervention}`,
      clickable: true,
    },
  ];

  return (
    <div className={gridClass}>
      {cards.map((card) => {
        const isClickable = card.clickable && !!onCoolingCardClick;
        return (
          <button
            key={card.id}
            type={isClickable ? "button" : undefined}
            onClick={isClickable ? onCoolingCardClick : undefined}
            disabled={!isClickable}
            className={`flex flex-col items-start w-full text-left rounded-lg border border-slate-700/50 bg-slate-800/40 p-3 transition-all ${
              isClickable
                ? "hover:border-cyan-500/50 hover:bg-slate-800/70 cursor-pointer group focus:outline-none focus:ring-1 focus:ring-cyan-500"
                : "hover:border-slate-600/60"
            }`}
          >
            <div className="flex items-start justify-between gap-1 w-full">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 group-hover:text-slate-400">
                {card.label}
              </p>
              <div className="flex items-center gap-1">
                {card.clickable && (
                  <span className="text-[9px] uppercase font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-800/30 px-1 py-0.2 rounded opacity-80 group-hover:opacity-100">
                    Compare
                  </span>
                )}
                {card.trend && (
                  <span
                    className={`text-xs font-mono ${
                      card.trend === "up" ? "text-red-400" : "text-blue-400"
                    }`}
                    aria-label={`Trend: ${card.trend}`}
                  >
                    {card.trend === "up" ? "↑" : "↓"}
                  </span>
                )}
              </div>
            </div>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-slate-100">
              {card.value}
              {card.unit && (
                <span className="ml-0.5 text-sm font-normal text-slate-400">
                  {card.unit}
                </span>
              )}
            </p>
            {card.delta && (
              <p className="mt-1 truncate text-[10px] text-slate-400 font-sans">
                {card.delta}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
