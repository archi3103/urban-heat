"use client";

import { InterventionSlider } from "@/components/sidebar/InterventionSlider";
import { PanelHeader } from "@/components/ui/PanelHeader";
import { INTERVENTION_CONFIGS } from "@/lib/constants";
import type { InterventionKey, InterventionValues } from "@/types";

interface InterventionSidebarProps {
  values: InterventionValues;
  onChange: (key: InterventionKey, value: number) => void;
  onReset: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

/**
 * Collapsible right sidebar for intervention parameter controls.
 * Pass values/onChange from useInterventionState at the layout level.
 */
export function InterventionSidebar({
  values,
  onChange,
  onReset,
  collapsed,
  onToggleCollapse,
}: InterventionSidebarProps) {
  return (
    <aside
      className={`relative flex shrink-0 flex-col border-l border-slate-700/60 bg-slate-900/80 transition-[width] duration-300 ease-in-out ${
        collapsed ? "w-12" : "w-72 lg:w-80"
      }`}
      aria-label="Intervention controls"
      aria-expanded={!collapsed}
    >
      {/* Collapse toggle — always visible on the inner edge */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className="absolute -left-3 top-16 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-600 bg-slate-800 text-slate-400 shadow-lg transition-colors hover:border-slate-500 hover:text-slate-200"
        aria-label={collapsed ? "Expand intervention panel" : "Collapse intervention panel"}
      >
        <svg
          className={`h-3.5 w-3.5 transition-transform ${collapsed ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {!collapsed && (
        <>
          <PanelHeader
            title="Intervention Controls"
            subtitle="Adjust mitigation parameters"
            action={
              <button
                type="button"
                onClick={onReset}
                className="rounded px-2 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
              >
                Reset
              </button>
            }
          />

          <div className="flex-1 space-y-6 overflow-y-auto p-4">
            {INTERVENTION_CONFIGS.map((config) => (
              <InterventionSlider
                key={config.key}
                config={config}
                value={values[config.key]}
                onChange={(v) => onChange(config.key, v)}
              />
            ))}

            {/* Placeholder for future preset scenarios */}
            <div className="rounded-lg border border-dashed border-slate-700/80 bg-slate-800/30 p-3">
              <p className="text-xs font-medium text-slate-400">Scenario Presets</p>
              <p className="mt-1 text-xs text-slate-600">
                Connect GSOE optimization outputs here
              </p>
            </div>
          </div>
        </>
      )}

      {collapsed && (
        <div className="flex flex-1 flex-col items-center pt-20">
          <span
            className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 [writing-mode:vertical-rl]"
          >
            Controls
          </span>
        </div>
      )}
    </aside>
  );
}
