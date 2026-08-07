"use client";

import { StatusIndicator } from "@/components/ui/StatusIndicator";

/**
 * Top navigation bar — brand, live system status, and session metadata.
 * Status values are placeholders; connect to WebSocket or polling later.
 */
export function TopNav() {
  return (
    <nav
      className="relative z-50 flex h-14 shrink-0 items-center justify-between border-b border-slate-700/80 bg-slate-900/95 px-4 backdrop-blur-md lg:px-6"
      aria-label="Main navigation"
    >
      {/* Brand */}
      <div className="flex min-w-0 items-center gap-3">
        {/* Thermal gradient accent bar */}
        <div
          className="hidden h-8 w-1 shrink-0 rounded-full sm:block"
          style={{
            background:
              "linear-gradient(180deg, #dc2626 0%, #7c3aed 50%, #2563eb 100%)",
          }}
          aria-hidden
        />
        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold tracking-tight text-slate-50 sm:text-base">
            TAPAS
            <span className="hidden font-normal text-slate-400 sm:inline">
              {" "}
              : Urban Heat Mitigation Engine
            </span>
          </h1>
          <p className="truncate text-[10px] font-mono uppercase tracking-widest text-slate-500 sm:text-xs">
            Civic-Tech Decision Support
          </p>
        </div>
      </div>

      {/* Live status indicators */}
      <div className="flex items-center gap-2 overflow-x-auto">
        <StatusIndicator label="Model" status="online" detail="GSOE v2" />
        <StatusIndicator label="Data" status="syncing" detail="LST" />
        <StatusIndicator
          label="Region"
          status="online"
          detail="Ahmedabad"
        />
      </div>
    </nav>
  );
}
