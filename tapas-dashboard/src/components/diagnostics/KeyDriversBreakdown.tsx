interface KeyDriversBreakdownProps {
  drivers: string[];
}

const IMPACT_STYLES: Record<string, string> = {
  high: "bg-red-500/20 text-red-400 border-red-500/30",
  medium: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  low: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const BAR_COLORS: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-orange-500",
  low: "bg-slate-500",
};

function formatDriver(driver: string): string {
  const mapping: Record<string, string> = {
    v_component_of_wind_10m: "10m V-Wind Component",
    u_component_of_wind_10m: "10m U-Wind Component",
    MNDWI: "MNDWI (Water Index)",
    GNDVI: "GNDVI (Greenness Index)",
    thermal_capacity: "Thermal Capacity",
  };
  return (
    mapping[driver] ||
    driver.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

/**
 * Horizontal bar breakdown of top UHI contributing factors.
 * Shown in the diagnostics side drawer on Tab 1.
 */
export function KeyDriversBreakdown({ drivers }: KeyDriversBreakdownProps) {
  if (!drivers || drivers.length === 0) {
    return (
      <div className="text-xs text-slate-500 text-center py-4">
        No driver breakdown data available.
      </div>
    );
  }

  const impacts: ("high" | "medium" | "low")[] = ["high", "medium", "low"];
  const contributions = [60, 30, 10];

  const formattedDrivers = drivers.slice(0, 3).map((driver, index) => ({
    id: `${driver}-${index}`,
    label: formatDriver(driver),
    impact: impacts[index] || "low",
    contribution: contributions[index] || 10,
    unit: "%",
  }));

  const maxContribution = Math.max(...formattedDrivers.map((d) => d.contribution));

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Key Driver Breakdown
        </h3>
        <p className="mt-0.5 text-[11px] text-slate-600">
          Relative contribution to urban heat stress
        </p>
      </div>

      <ul className="space-y-3">
        {formattedDrivers.map((driver) => (
          <li key={driver.id}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="truncate text-xs text-slate-300">{driver.label}</span>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase ${IMPACT_STYLES[driver.impact]}`}
                >
                  {driver.impact}
                </span>
                <span className="font-mono text-xs tabular-nums text-slate-400">
                  {driver.contribution}
                  {driver.unit}
                </span>
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full transition-all ${BAR_COLORS[driver.impact]}`}
                style={{
                  width: `${(driver.contribution / maxContribution) * 100}%`,
                  opacity: 0.85,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
