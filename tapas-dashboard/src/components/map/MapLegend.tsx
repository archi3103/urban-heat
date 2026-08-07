import { THERMAL_GRADIENT } from "@/components/map/layers/ThermalHeatmapLayer";

/**
 * Floating LST scale legend matching the thermal heatmap gradient.
 */
export function MapLegend() {
  const stops = Object.entries(THERMAL_GRADIENT)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, color]) => color);

  return (
    <div className="tapas-map-legend pointer-events-none absolute bottom-4 right-4 z-[1000] rounded-lg border border-slate-700/60 bg-slate-900/95 p-3 backdrop-blur-sm">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        UHI Heat Stress
      </p>
      <div
        className="h-2.5 w-28 rounded-full"
        style={{
          background: `linear-gradient(90deg, ${stops.join(", ")})`,
        }}
      />
      <div className="mt-1 flex justify-between text-[10px] font-mono text-slate-500">
        <span>Cool</span>
        <span>Hot</span>
      </div>
    </div>
  );
}
