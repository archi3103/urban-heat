"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { MapLegend } from "@/components/map/MapLegend";
import { MapResizeHandler } from "@/components/map/MapResizeHandler";
import { MapZoomControls } from "@/components/map/MapZoomControls";
import { ThermalHeatmapLayer } from "@/components/map/layers/ThermalHeatmapLayer";
import { HotspotMarker } from "@/components/map/markers/HotspotMarker";
import { toHeatmapPoints } from "@/lib/parseHotspotData";
import { AHMEDABAD_CENTER } from "@/types/hotspot";
import type { GSOEHotspot } from "@/types/hotspot";

/** Esri World Imagery — darkened via CSS for tactical satellite look */
const SATELLITE_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

/** CARTO dark labels overlay for street/context readability */
const DARK_LABELS_URL =
  "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png";

interface ThermalMapProps {
  hotspots: GSOEHotspot[];
  selectedHotspot: GSOEHotspot | null;
  onSelectHotspot: (hotspot: GSOEHotspot) => void;
}

/**
 * Production-grade interactive thermal map for TAPAS.
 * - Dark tactical satellite base (Esri + CSS filter)
 * - UHI heatmap overlay (leaflet.heat)
 * - Neon hotspot pins with GSOE tactical popups
 */
export function ThermalMap({
  hotspots,
  selectedHotspot,
  onSelectHotspot,
}: ThermalMapProps) {
  const heatmapPoints = useMemo(() => toHeatmapPoints(hotspots), [hotspots]);

  return (
    <div className="tapas-map relative h-full w-full">
      <MapContainer
        center={[AHMEDABAD_CENTER.lat, AHMEDABAD_CENTER.lng]}
        zoom={13}
        minZoom={10}
        maxZoom={18}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
      >
        {/* Dark tactical satellite base layer */}
        <TileLayer url={SATELLITE_TILE_URL} maxZoom={19} />

        {/* Semi-transparent dark labels for urban context */}
        <TileLayer
          url={DARK_LABELS_URL}
          maxZoom={19}
          opacity={0.55}
          subdomains="abcd"
        />

        {/* UHI thermal heat stress overlay */}
        <ThermalHeatmapLayer points={heatmapPoints} />

        {/* Hotspot neon pins for all loaded coordinates */}
        {hotspots.map((hotspot) => (
          <HotspotMarker
            key={hotspot.gridId}
            hotspot={hotspot}
            isSelected={selectedHotspot?.gridId === hotspot.gridId}
            onSelect={() => onSelectHotspot(hotspot)}
          />
        ))}

        <MapResizeHandler />

        {/* Custom zoom controls (must be child of MapContainer) */}
        <MapZoomControls className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-1" />
      </MapContainer>

      <MapLegend />

      {/* Hotspot count badge */}
      <div className="pointer-events-none absolute left-4 top-4 z-[1000] rounded-md border border-slate-700/60 bg-slate-900/90 px-3 py-1.5 backdrop-blur-sm">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Active Hotspots
        </p>
        <p className="font-mono text-sm font-bold text-slate-200">
          {hotspots.filter((h) => h.isHotspot).length}
          <span className="text-slate-500"> / {hotspots.length} Grids</span>
        </p>
      </div>
    </div>
  );
}
