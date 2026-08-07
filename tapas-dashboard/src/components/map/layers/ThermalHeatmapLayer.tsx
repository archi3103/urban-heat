"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

/** UHI thermal gradient: deep blue → lime → yellow → orange → crimson */
export const THERMAL_GRADIENT: Record<number, string> = {
  0.0: "#1e3a8a",
  0.25: "#84cc16",
  0.5: "#eab308",
  0.75: "#f97316",
  1.0: "#dc2626",
};

interface ThermalHeatmapLayerProps {
  points: [number, number, number][];
}

function mapHasSize(map: L.Map): boolean {
  const size = map.getSize();
  return size.x > 0 && size.y > 0;
}

/**
 * Smooth UHI heat-stress overlay using leaflet.heat.
 * Points are [lat, lng, normalizedIntensity] from parseHotspotData.
 *
 * Defers mount until the map container has non-zero dimensions — leaflet.heat
 * calls canvas getImageData on addTo() and throws if height is 0.
 */
export function ThermalHeatmapLayer({ points }: ThermalHeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;

    let layer: L.Layer | null = null;
    let rafId = 0;
    let cancelled = false;

    const mountLayer = () => {
      if (cancelled || layer || !mapHasSize(map)) return;

      layer = L.heatLayer(points, {
        radius: 38,
        blur: 28,
        maxZoom: 18,
        minOpacity: 0.35,
        max: 1.0,
        gradient: THERMAL_GRADIENT,
      });

      layer.addTo(map);
    };

    const tryMount = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        map.invalidateSize({ animate: false });
        if (mapHasSize(map)) {
          mountLayer();
        } else if (!cancelled) {
          tryMount();
        }
      });
    };

    const handleResize = () => {
      if (!layer) tryMount();
    };

    map.whenReady(tryMount);
    map.on("resize", handleResize);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      map.off("resize", handleResize);
      if (layer) map.removeLayer(layer);
    };
  }, [map, points]);

  return null;
}
