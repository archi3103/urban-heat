"use client";

import { useCallback } from "react";
import { useMap } from "react-leaflet";

interface MapZoomControlsProps {
  className?: string;
}

/** Zoom +/- controls wired directly to the Leaflet map instance */
export function MapZoomControls({ className }: MapZoomControlsProps) {
  const map = useMap();

  const zoomIn = useCallback(() => map.zoomIn(), [map]);
  const zoomOut = useCallback(() => map.zoomOut(), [map]);

  return (
    <div className={className}>
      <button
        type="button"
        aria-label="Zoom in"
        onClick={zoomIn}
        className="flex h-8 w-8 items-center justify-center rounded border border-slate-700/60 bg-slate-900/95 text-sm text-slate-300 backdrop-blur-sm transition-colors hover:border-slate-500 hover:text-white"
      >
        +
      </button>
      <button
        type="button"
        aria-label="Zoom out"
        onClick={zoomOut}
        className="flex h-8 w-8 items-center justify-center rounded border border-slate-700/60 bg-slate-900/95 text-sm text-slate-300 backdrop-blur-sm transition-colors hover:border-slate-500 hover:text-white"
      >
        −
      </button>
    </div>
  );
}
