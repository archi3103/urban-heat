"use client";

import { ParetoAnalytics } from "@/components/diagnostics/ParetoAnalytics";
import { UrbanDiagnostics } from "@/components/diagnostics/UrbanDiagnostics";
import { PLACEHOLDER_DIAGNOSTICS, PLACEHOLDER_PARETO } from "@/lib/constants";

interface DiagnosticsDrawerProps {
  open: boolean;
  onToggle: () => void;
}

/**
 * Bottom drawer for urban diagnostics and Pareto trade-off analytics.
 * Collapses to a slim handle bar; expands to ~40vh on desktop.
 */
export function DiagnosticsDrawer({ open, onToggle }: DiagnosticsDrawerProps) {
  return (
    <section
      className={`relative shrink-0 border-t border-slate-700/60 bg-slate-900/90 transition-[height] duration-300 ease-in-out ${
        open ? "h-[min(40vh,320px)]" : "h-10"
      }`}
      aria-label="Urban diagnostics and analytics"
      aria-expanded={open}
    >
      {/* Drawer handle / toggle bar */}
      <button
        type="button"
        onClick={onToggle}
        className="flex h-10 w-full items-center justify-between px-4 transition-colors hover:bg-slate-800/50"
        aria-label={
          open ? "Collapse diagnostics drawer" : "Expand diagnostics drawer"
        }
      >
        <div className="flex items-center gap-2">
          <div
            className="h-1 w-8 rounded-full bg-slate-600"
            aria-hidden
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Urban Diagnostics &amp; Pareto Analytics
          </span>
        </div>
        <svg
          className={`h-4 w-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {open && (
        <div className="grid h-[calc(100%-2.5rem)] grid-cols-1 gap-4 overflow-y-auto px-4 pb-4 lg:grid-cols-2">
          <UrbanDiagnostics selectedHotspot={null} />
          <ParetoAnalytics points={PLACEHOLDER_PARETO} />
        </div>
      )}
    </section>
  );
}
