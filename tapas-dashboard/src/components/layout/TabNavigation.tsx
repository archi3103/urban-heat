"use client";

import type { DashboardTab, TabConfig } from "@/types/dashboard";
import { DASHBOARD_TABS } from "@/types/dashboard";

interface TabNavigationProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

/**
 * Command-center tab bar — sits directly below TopNav.
 * Each tab loads a dedicated full-view workspace.
 */
export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div
      className="shrink-0 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-slate-950/60 backdrop-blur-sm"
      role="tablist"
      aria-label="Dashboard sections"
    >
      <div className="flex gap-0.5 overflow-x-auto px-3 lg:px-5">
        {DASHBOARD_TABS.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onSelect={() => onTabChange(tab.id)}
          />
        ))}
      </div>
    </div>
  );
}

function TabButton({
  tab,
  isActive,
  onSelect,
}: {
  tab: TabConfig;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${tab.id}`}
      id={`tab-${tab.id}`}
      onClick={onSelect}
      className={`group relative shrink-0 px-4 py-3.5 text-left transition-all sm:px-5 ${
        isActive
          ? "bg-slate-800/30 text-slate-50"
          : "text-slate-500 hover:bg-slate-800/15 hover:text-slate-300"
      }`}
    >
      {/* Active indicator bar */}
      <span
        className={`absolute inset-x-4 bottom-0 h-0.5 rounded-full transition-all ${
          isActive
            ? "bg-gradient-to-r from-red-500 via-violet-500 to-blue-500 opacity-100"
            : "opacity-0 group-hover:opacity-40 bg-slate-600"
        }`}
        aria-hidden
      />

      <span className="flex items-center gap-2">
        <span className="text-base leading-none" aria-hidden>
          {tab.icon}
        </span>
        <span className="whitespace-nowrap text-xs font-semibold tracking-wide sm:text-sm">
          {tab.label}
        </span>
      </span>
    </button>
  );
}
