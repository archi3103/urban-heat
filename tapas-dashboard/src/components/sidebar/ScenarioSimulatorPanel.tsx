"use client";

import { InterventionSlider } from "@/components/sidebar/InterventionSlider";
import { PanelHeader } from "@/components/ui/PanelHeader";
import { INTERVENTION_CONFIGS } from "@/lib/constants";
import type { InterventionKey, InterventionValues } from "@/types";

interface ScenarioSimulatorPanelProps {
  values: InterventionValues;
  onChange: (key: InterventionKey, value: number) => void;
  onReset: () => void;
}

/**
 * Right panel for Tab 2 — GSOE intervention sliders and scenario controls.
 */
export function ScenarioSimulatorPanel({
  values,
  onChange,
  onReset,
}: ScenarioSimulatorPanelProps) {
  return (
    <section
      className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-900/20"
      aria-label="GSOE scenario simulator"
    >
      <PanelHeader
        title="Scenario Simulator"
        subtitle="GSOE intervention parameters · what-if analysis"
        action={
          <button
            type="button"
            onClick={onReset}
            className="rounded-md border border-slate-700/60 px-2.5 py-1 text-xs font-medium text-slate-400 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-slate-200"
          >
            Reset baseline
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-5 lg:p-6">
        <div className="mx-auto max-w-lg space-y-7">
          {INTERVENTION_CONFIGS.map((config) => (
            <InterventionSlider
              key={config.key}
              config={config}
              value={values[config.key]}
              onChange={(v) => onChange(config.key, v)}
            />
          ))}

          {/* Live scenario output preview */}
          <div className="rounded-xl border border-slate-700/50 bg-slate-950/50 p-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Projected Impact
            </h3>
            <dl className="mt-3 grid grid-cols-2 gap-3">
              <OutputStat
                label="Est. LST Δ"
                value={`-${(values.albedo * 3.2 + values.ndvi * 2.1).toFixed(1)}°C`}
                accent="text-blue-400"
              />
              <OutputStat
                label="Heat Flux"
                value={`${values.wasteHeat} W/m²`}
                accent="text-red-400"
              />
              <OutputStat
                label="Green Cover"
                value={`${(values.ndvi * 100).toFixed(0)}%`}
                accent="text-violet-400"
              />
              <OutputStat
                label="Albedo Gain"
                value={`+${((values.albedo - 0.2) * 100).toFixed(0)}%`}
                accent="text-slate-300"
              />
            </dl>
            <p className="mt-3 text-[10px] text-slate-600">
              Placeholder projection — wire to GSOE re-run API
            </p>
          </div>

          {/* Scenario presets */}
          <div className="rounded-xl border border-dashed border-slate-700/60 bg-slate-950/30 p-4">
            <p className="text-xs font-medium text-slate-400">Scenario Presets</p>
            <p className="mt-1 text-[11px] text-slate-600">
              Load NSGA-II optimal strategies from Tab 3 or connect GSOE batch runs.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Aggressive Greening", "Cool Roofs", "Balanced Mix"].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled
                  className="rounded-md border border-slate-700/50 px-2.5 py-1 text-[11px] text-slate-500 opacity-60"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OutputStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
      <dt className="text-[10px] text-slate-600">{label}</dt>
      <dd className={`mt-0.5 font-mono text-sm font-semibold tabular-nums ${accent}`}>
        {value}
      </dd>
    </div>
  );
}
