"use client";

import type { SystemStatus } from "@/types";

interface StatusIndicatorProps {
  label: string;
  status: SystemStatus;
  detail?: string;
}

const STATUS_STYLES: Record<
  SystemStatus,
  { dot: string; text: string; pulse?: boolean }
> = {
  online: {
    dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
    text: "text-emerald-400",
  },
  syncing: {
    dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]",
    text: "text-amber-400",
    pulse: true,
  },
  offline: {
    dot: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]",
    text: "text-red-400",
  },
};

/**
 * Live status pill for the top navigation bar.
 * Shows a pulsing dot when the system is syncing data.
 */
export function StatusIndicator({ label, status, detail }: StatusIndicatorProps) {
  const styles = STATUS_STYLES[status];

  return (
    <div
      className="flex items-center gap-2 rounded-md border border-slate-700/60 bg-slate-800/50 px-3 py-1.5"
      role="status"
      aria-label={`${label}: ${status}${detail ? `, ${detail}` : ""}`}
    >
      <span className="relative flex h-2 w-2">
        {styles.pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${styles.dot}`}
          />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${styles.dot}`} />
      </span>
      <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </span>
      {detail && (
        <span className={`text-xs font-mono ${styles.text}`}>{detail}</span>
      )}
    </div>
  );
}
