"use client";

import { useState, useEffect } from "react";
import { DiagnosticsSideDrawer } from "@/components/diagnostics/DiagnosticsSideDrawer";
import { MapPanel } from "@/components/map/MapPanel";
import { useHotspotData } from "@/hooks/useHotspotData";
import { CoolingComparisonModal } from "@/components/diagnostics/CoolingComparisonModal";
import type { GSOEHotspot } from "@/types/hotspot";

/**
 * Tab 1 — Full-width thermal map with collapsible diagnostics side drawer.
 * Hotspot popup cards remain on the map layer (Leaflet popups).
 */
export function HeatStressTab() {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const { hotspots, loading, error } = useHotspotData();
  const [selectedHotspot, setSelectedHotspot] = useState<GSOEHotspot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Set the first hotspot as default selection when data is loaded
  useEffect(() => {
    if (hotspots.length > 0 && !selectedHotspot) {
      setSelectedHotspot(hotspots[0]);
    }
  }, [hotspots, selectedHotspot]);

  return (
    <div
      id="panel-heat-stress"
      role="tabpanel"
      aria-labelledby="tab-heat-stress"
      className="relative flex min-h-0 flex-1 flex-col"
    >
      <div className="relative min-h-0 flex-1">
        {/* Absolute fill ensures Leaflet gets a non-zero height in flex layout */}
        <div className="absolute inset-0">
          <MapPanel
            fullWidth
            hotspots={hotspots}
            loading={loading}
            error={error}
            selectedHotspot={selectedHotspot}
            onSelectHotspot={setSelectedHotspot}
          />
        </div>
        <DiagnosticsSideDrawer
          open={drawerOpen}
          onToggle={() => setDrawerOpen((o) => !o)}
          selectedHotspot={selectedHotspot}
          onCoolingCardClick={() => setIsModalOpen(true)}
        />
      </div>

      <CoolingComparisonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        hotspot={selectedHotspot}
      />
    </div>
  );
}
