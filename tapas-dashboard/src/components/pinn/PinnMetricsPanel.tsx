"use client";

import type { PinnMetric } from "@/lib/constants";
import { PLACEHOLDER_PINN_METRICS, PLACEHOLDER_PINN_TRAINING } from "@/lib/constants";
import { PanelHeader } from "@/components/ui/PanelHeader";

interface PinnMetricsPanelProps {
  metrics?: PinnMetric[];
}

const STATUS_STYLES: Record<PinnMetric["status"], string> = {
  pass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  neutral: "border-slate-600/40 bg-slate-800/40 text-slate-400",
};

const STATUS_LABELS: Record<PinnMetric["status"], string> = {
  pass: "Validated",
  warn: "Review",
  neutral: "Info",
};

/**
 * Left panel for Tab 2 — validated PINN physics-constraint metrics.
 */
export function PinnMetricsPanel({
  metrics = PLACEHOLDER_PINN_METRICS,
}: PinnMetricsPanelProps) {
  const training = PLACEHOLDER_PINN_TRAINING;
  const allPass = metrics.every((m) => m.status === "pass");

  return (
    <section
      className="flex min-h-0 flex-1 flex-col overflow-hidden border-r border-slate-800/80 bg-slate-900/40"
      aria-label="PINN model validation metrics"
    >
      <PanelHeader
        title="PINN Core Validation"
        subtitle="Physics-informed neural network · constraint residuals"
        action={
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              allPass
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-amber-500/30 bg-amber-500/10 text-amber-400"
            }`}
          >
            {allPass ? "All constraints pass" : "Needs review"}
          </span>
        }
      />

      <div className="flex-1 space-y-6 overflow-y-auto p-5 lg:p-6">
        {/* Training summary card */}
        <article className="rounded-xl border border-slate-700/50 bg-slate-950/60 p-4">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Model Architecture
          </h3>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
            <MetricDetail label="Architecture" value={training.architecture} />
            <MetricDetail label="Checkpoint" value={training.checkpoint} mono />
            <MetricDetail label="Training Grids" value={training.grids} />
            <MetricDetail label="Epochs" value={String(training.epochs)} />
          </dl>
        </article>

        {/* Constraint residuals */}
        <div>
          <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Physics Constraint Residuals
          </h3>
          <ul className="space-y-2.5">
            {metrics.map((metric) => (
              <li
                key={metric.id}
                className="rounded-lg border border-slate-700/40 bg-slate-800/30 p-3.5 transition-colors hover:border-slate-600/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200">{metric.label}</p>
                    {metric.detail && (
                      <p className="mt-0.5 text-[11px] text-slate-500">{metric.detail}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-mono text-sm font-semibold tabular-nums text-slate-100">
                      {metric.value}
                    </span>
                    <span
                      className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase ${STATUS_STYLES[metric.status]}`}
                    >
                      {STATUS_LABELS[metric.status]}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Validation note */}
        <div className="rounded-lg border border-dashed border-slate-700/60 bg-slate-950/40 p-4">
          <p className="text-xs font-medium text-slate-400">Validation Protocol</p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
            Residuals computed on hold-out Ahmedabad grid cells against satellite LST.
            SEB and heat-equation PDE terms enforce surface energy balance and
            advection-diffusion physics.
          </p>
        </div>
      </div>
    </section>
  );
}

function MetricDetail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] text-slate-600">{label}</dt>
      <dd
        className={`mt-0.5 truncate text-xs text-slate-300 ${mono ? "font-mono" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
