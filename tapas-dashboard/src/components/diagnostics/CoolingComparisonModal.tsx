"use client";

import type { GSOEHotspot, GSOEScenario } from "@/types/hotspot";

interface CoolingComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotspot: GSOEHotspot | null;
}

export function CoolingComparisonModal({
  isOpen,
  onClose,
  hotspot,
}: CoolingComparisonModalProps) {
  if (!isOpen || !hotspot) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Card */}
      <div 
        className="relative flex flex-col w-full max-w-4xl max-h-[85vh] rounded-xl border border-slate-700/80 bg-slate-900/95 shadow-2xl text-slate-100 backdrop-blur-md overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-slate-700/60 px-6 py-4">
          <div>
            <h2 id="modal-title" className="text-base font-bold text-white tracking-wide">
              Cooling Interventions Comparison
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Hotspot: <span className="font-mono text-cyan-400 font-semibold">{hotspot.gridId}</span> · 
              Original LST: <span className="font-semibold text-red-400">{hotspot.originalLst.toFixed(2)}°C</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            aria-label="Close comparison modal"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                Recommended Strategy
              </p>
              <p className="mt-1 font-bold text-white text-sm">
                {hotspot.bestIntervention}
              </p>
            </div>
            
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                Max Cooling Potential
              </p>
              <p className="mt-1 font-mono font-bold text-white text-lg">
                -{hotspot.bestCooling.toFixed(2)}°C
              </p>
            </div>

            <div className="rounded-lg border border-purple-500/20 bg-purple-950/20 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-400">
                Urban Density Constraints
              </p>
              <p className="mt-1 font-mono font-bold text-white text-sm">
                {Math.round(hotspot.actualUrbanDensity).toLocaleString()} p/km²
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-slate-700/60 overflow-hidden bg-slate-950/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700/60 bg-slate-900/50 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Scenario / Intervention Name</th>
                    <th className="px-4 py-3 text-center">Type</th>
                    <th className="px-4 py-3 text-right">Scenario LST</th>
                    <th className="px-4 py-3 text-right">Cooling Delta</th>
                    <th className="px-4 py-3 text-right">Feasibility Rank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                  {hotspot.scenarios.map((scenario) => (
                    <tr
                      key={scenario.scenarioId}
                      className={`transition-colors hover:bg-slate-800/40 ${
                        scenario.isBest
                          ? "bg-emerald-950/20 border-l-2 border-l-emerald-500 font-medium"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center justify-center rounded w-5 h-5 text-[10px] ${
                          scenario.isBest 
                            ? "bg-emerald-500/20 text-emerald-300 font-bold" 
                            : "bg-slate-800 text-slate-400"
                        }`}>
                          {scenario.scenarioRank}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-200">
                        <div className="flex items-center gap-2">
                          <span>{scenario.scenarioName}</span>
                          {scenario.isBest && (
                            <span className="shrink-0 rounded bg-emerald-500/20 border border-emerald-500/30 px-1 py-0.5 text-[9px] font-semibold text-emerald-400 uppercase">
                              Best
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${
                          scenario.scenarioType === "Hybrid"
                            ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                            : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                        }`}>
                          {scenario.scenarioType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300">
                        {scenario.scenarioLst.toFixed(2)}°C
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-400 font-medium">
                        -{scenario.cooling.toFixed(2)}°C
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400">
                        #{scenario.feasibilityRank}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex shrink-0 items-center justify-end border-t border-slate-700/60 px-6 py-4 bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-4 py-2 border border-slate-700/80 transition-colors"
          >
            Close View
          </button>
        </footer>
      </div>
    </div>
  );
}
