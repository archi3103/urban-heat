"use client";

import type { ParetoPoint } from "@/types";

interface ParetoAnalyticsProps {
  points: ParetoPoint[];
  /** compact = drawer size; full = dedicated tab viewport */
  variant?: "compact" | "full";
}

/**
 * Pareto trade-off frontier visualization placeholder.
 * Replace the SVG scatter with Recharts, D3, or Plotly.
 *
 * X-axis: intervention cost | Y-axis: cooling effect (°C)
 */
export function ParetoAnalytics({ points, variant = "compact" }: ParetoAnalyticsProps) {
  const maxCost = Math.max(...points.map((p) => p.cost));
  const maxCooling = Math.max(...points.map((p) => p.coolingEffect));
  const isFull = variant === "full";

  const toX = (cost: number) => 60 + (cost / maxCost) * (isFull ? 520 : 200);
  const toY = (cooling: number) =>
    (isFull ? 320 : 140) - (cooling / maxCooling) * (isFull ? 240 : 100);

  const viewW = isFull ? 640 : 280;
  const viewH = isFull ? 360 : 160;
  const axisBottom = isFull ? 320 : 140;
  const axisRight = isFull ? 600 : 260;
  const gridLines = isFull ? 8 : 4;

  return (
    <div className={`flex flex-col ${isFull ? "min-h-[360px]" : "h-full min-h-[160px]"}`}>
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            NSGA-II Pareto Frontier
          </p>
          <p className="mt-0.5 text-[11px] text-slate-600">
            Intervention cost vs. projected cooling effect
          </p>
        </div>
        {isFull && (
          <div className="flex gap-3 text-[10px] text-slate-500">
            <LegendDot color="#2563eb" label="Candidate solutions" />
            <LegendDot color="#dc2626" label="Frontier curve" dashed />
          </div>
        )}
      </div>

      <div
        className={`relative flex-1 rounded-lg border border-slate-700/40 bg-slate-950/50 ${
          isFull ? "p-4" : "p-2"
        }`}
      >
        <svg
          viewBox={`0 0 ${viewW} ${viewH}`}
          className="h-full w-full"
          role="img"
          aria-label="Pareto trade-off chart showing cost versus cooling effect"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines */}
          {Array.from({ length: gridLines + 1 }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1={60}
              y1={40 + (i * (axisBottom - 40)) / gridLines}
              x2={axisRight}
              y2={40 + (i * (axisBottom - 40)) / gridLines}
              stroke="rgba(100,116,139,0.12)"
              strokeWidth={1}
            />
          ))}
          {Array.from({ length: gridLines + 1 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={60 + (i * (axisRight - 60)) / gridLines}
              y1={40}
              x2={60 + (i * (axisRight - 60)) / gridLines}
              y2={axisBottom}
              stroke="rgba(100,116,139,0.08)"
              strokeWidth={1}
            />
          ))}

          {/* Axes */}
          <line x1={60} y1={axisBottom} x2={axisRight} y2={axisBottom} stroke="rgba(148,163,184,0.35)" />
          <line x1={60} y1={40} x2={60} y2={axisBottom} stroke="rgba(148,163,184,0.35)" />

          {/* Axis labels */}
          <text
            x={(60 + axisRight) / 2}
            y={viewH - 8}
            textAnchor="middle"
            className="fill-slate-500 text-[10px]"
          >
            Intervention Cost (index)
          </text>
          <text
            x={16}
            y={(40 + axisBottom) / 2}
            textAnchor="middle"
            transform={`rotate(-90 16 ${(40 + axisBottom) / 2})`}
            className="fill-slate-500 text-[10px]"
          >
            Cooling Effect (°C)
          </text>

          {/* Frontier curve */}
          <polyline
            points={points
              .slice()
              .sort((a, b) => a.cost - b.cost)
              .map((p) => `${toX(p.cost)},${toY(p.coolingEffect)}`)
              .join(" ")}
            fill="none"
            stroke="url(#paretoGradient)"
            strokeWidth={isFull ? 2.5 : 2}
            strokeDasharray={isFull ? "6 3" : "4 2"}
          />

          {/* Data points */}
          {points.map((point, idx) => (
            <g key={point.id}>
              <circle
                cx={toX(point.cost)}
                cy={toY(point.coolingEffect)}
                r={isFull ? (idx === 0 ? 8 : 6) : 5}
                className={
                  idx === 0 && isFull
                    ? "fill-blue-400 stroke-blue-200/60"
                    : "fill-blue-500/80 stroke-blue-300/50"
                }
                strokeWidth={isFull ? 2 : 1}
              />
              {isFull && point.label && (
                <text
                  x={toX(point.cost)}
                  y={toY(point.coolingEffect) - 12}
                  textAnchor="middle"
                  className="fill-slate-400 text-[9px]"
                >
                  {point.label}
                </text>
              )}
              {point.label && (
                <title>{`${point.label}: cost ${point.cost}, cooling ${point.coolingEffect}°C`}</title>
              )}
            </g>
          ))}

          <defs>
            <linearGradient id="paretoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

function LegendDot({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: dashed ? "transparent" : color, border: dashed ? `1px dashed ${color}` : "none" }}
      />
      {label}
    </span>
  );
}
