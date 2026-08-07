import type { ReactNode } from "react";

interface PanelHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional action slot (collapse button, export, etc.) */
  action?: ReactNode;
}

/**
 * Consistent header for map, sidebar, and drawer panels.
 */
export function PanelHeader({ title, subtitle, action }: PanelHeaderProps) {
  return (
    <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-700/60 px-4 py-3">
      <div className="min-w-0">
        <h2 className="truncate text-sm font-semibold tracking-wide text-slate-100">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
