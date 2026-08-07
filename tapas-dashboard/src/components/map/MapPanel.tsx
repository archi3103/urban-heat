"use client";

import dynamic from "next/dynamic";
import { PanelHeader } from "@/components/ui/PanelHeader";
import type { GSOEHotspot } from "@/types/hotspot";

/** Leaflet requires browser APIs — load map client-side only */
const ThermalMap = dynamic(
  () => import("@/components/map/ThermalMap").then((m) => m.ThermalMap),
  {
    ssr: false,
    loading: () => <MapLoadingState />,
  },
);

function MapLoadingState() {
  return (
    <div className="flex h-full items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Loading thermal map…
        </p>
      </div>
    </div>
  );
}

function MapErrorState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center bg-slate-950 p-6">
      <div className="max-w-sm rounded-lg border border-red-500/30 bg-red-950/20 p-4 text-center">
        <p className="text-sm font-medium text-red-400">Map data unavailable</p>
        <p className="mt-1 text-xs text-slate-500">{message}</p>
      </div>
    </div>
  );
}

interface MapPanelProps {
  /** When true, map fills the entire tab with a floating title overlay */
  fullWidth?: boolean;
  hotspots: GSOEHotspot[];
  loading: boolean;
  error: string | null;
  selectedHotspot: GSOEHotspot | null;
  onSelectHotspot: (hotspot: GSOEHotspot) => void;
}

/**
 * Central map viewport with react-leaflet thermal layers and GSOE hotspot pins.
 * Data source: `/Ahmedabad_Master_Scenarios_REAL_Density.csv` (swappable via useHotspotData).
 */
export function MapPanel({
  fullWidth = false,
  hotspots,
  loading,
  error,
  selectedHotspot,
  onSelectHotspot,
}: MapPanelProps) {
  return (
    <section
      className={`relative flex min-h-0 flex-col overflow-hidden ${
        fullWidth ? "h-full w-full" : "flex-1"
      }`}
      aria-label="Interactive thermal map"
    >
      {fullWidth ? (
        <div className="pointer-events-none absolute left-4 top-4 z-[500] rounded-lg border border-slate-700/50 bg-slate-900/80 px-3 py-2 backdrop-blur-md">
          <h2 className="text-xs font-semibold tracking-wide text-slate-100">
            Urban Thermal Map
          </h2>
          <p className="mt-0.5 text-[10px] text-slate-500">
            Ahmedabad UHI · GSOE intervention overlay
          </p>
        </div>
      ) : (
        <PanelHeader
          title="Urban Thermal Map"
          subtitle="Ahmedabad UHI heat stress · GSOE intervention overlay"
        />
      )}

      <div className="map-container relative min-h-0 flex-1 bg-slate-950">
        {loading && <MapLoadingState />}
        {!loading && error && <MapErrorState message={error} />}
        {!loading && !error && hotspots.length > 0 && (
          <ThermalMap
            hotspots={hotspots}
            selectedHotspot={selectedHotspot}
            onSelectHotspot={onSelectHotspot}
          />
        )}
      </div>
    </section>
  );
}
