"use client";

import { KeyDriversBreakdown } from "@/components/diagnostics/KeyDriversBreakdown";
import { UrbanDiagnostics } from "@/components/diagnostics/UrbanDiagnostics";
import type { GSOEHotspot } from "@/types/hotspot";

interface DiagnosticsSideDrawerProps {
  open: boolean;
  onToggle: () => void;
  selectedHotspot: GSOEHotspot | null;
  onCoolingCardClick: () => void;
}

/**
 * Collapsible right-side drawer for Tab 1.
 * Houses urban diagnostic cards and key driver breakdown —
 * keeps the map full-width when collapsed.
 */
export function DiagnosticsSideDrawer({
  open,
  onToggle,
  selectedHotspot,
  onCoolingCardClick,
}: DiagnosticsSideDrawerProps) {
  return (
    <>
      {/* Toggle tab on map edge when drawer is closed */}
      {!open && (
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-0 top-1/2 z-[1001] flex -translate-y-1/2 flex-col items-center gap-1 rounded-l-lg border border-r-0 border-slate-700/60 bg-slate-900/95 px-2 py-4 backdrop-blur-sm transition-colors hover:border-slate-600 hover:bg-slate-800/95"
          aria-label="Open diagnostics drawer"
        >
          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 [writing-mode:vertical-rl]">
            Diagnostics
          </span>
        </button>
      )}

      {/* Drawer panel */}
      <aside
        className={`absolute right-0 top-0 z-[1000] flex h-full flex-col border-l border-slate-700/60 bg-slate-900/95 backdrop-blur-md transition-[width,transform] duration-300 ease-in-out ${
          open ? "w-80 lg:w-96" : "w-0 overflow-hidden border-0"
        }`}
        aria-label="Urban diagnostics"
        aria-hidden={!open}
      >
        {open && (
          <>
            <header className="flex shrink-0 items-center justify-between border-b border-slate-700/60 px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  Heat Stress Diagnostics
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Urban metrics &amp; key driver breakdown
                </p>
              </div>
              <button
                type="button"
                onClick={onToggle}
                className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
                aria-label="Close diagnostics drawer"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </header>

            <div className="flex-1 space-y-8 overflow-y-auto px-5 py-5">
              <UrbanDiagnostics
                selectedHotspot={selectedHotspot}
                variant="stacked"
                onCoolingCardClick={onCoolingCardClick}
              />
              <div className="border-t border-slate-800 pt-6">
                <KeyDriversBreakdown drivers={selectedHotspot?.drivers ?? []} />
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
