// "use client";

// import { useState } from "react";
// import { TabNavigation } from "@/components/layout/TabNavigation";
// import { TopNav } from "@/components/layout/TopNav";
// import { HeatStressTab } from "@/components/tabs/HeatStressTab";
// import { PinnSimulatorTab } from "@/components/tabs/PinnSimulatorTab";
// import { StrategyTab } from "@/components/tabs/StrategyTab";
// import { useInterventionState } from "@/hooks/useInterventionState";
// import type { DashboardTab } from "@/types/dashboard";

// /**
//  * Main application shell — command-center layout with three dedicated workspaces.
//  *
//  * ┌─────────────────────────────────────────┐
//  * │              TopNav                      │
//  * ├─────────────────────────────────────────┤
//  * │           TabNavigation                  │
//  * ├─────────────────────────────────────────┤
//  * │  Tab 1: Full-width map + side drawer     │
//  * │  Tab 2: PINN metrics | Scenario sliders  │
//  * │  Tab 3: Pareto frontier + strategy table │
//  * └─────────────────────────────────────────┘
//  */
// export function DashboardLayout() {
//   const [activeTab, setActiveTab] = useState<DashboardTab>("heat-stress");
//   const intervention = useInterventionState();

//   return (
//     <div className="flex h-full flex-col overflow-hidden bg-slate-950">
//       <TopNav />
//       <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

//       <main className="flex min-h-0 flex-1 flex-col">
//         {activeTab === "heat-stress" && <HeatStressTab />}
//         {activeTab === "pinn-simulator" && (
//           <PinnSimulatorTab
//             values={intervention.values}
//             onChange={intervention.setValue}
//             onReset={intervention.reset}
//           />
//         )}
//         {activeTab === "strategy" && <StrategyTab />}
//       </main>
//     </div>
//   );
// }

"use client";

import { HeatStressTab } from "@/components/tabs/HeatStressTab";
import { PinnSimulatorTab } from "@/components/tabs/PinnSimulatorTab";
import { useInterventionState } from "@/hooks/useInterventionState";
import type { DashboardTab } from "@/types/dashboard";
import { useState } from "react";

export function DashboardLayout() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("heat-stress");
  const interventionState = useInterventionState();

  return (
    <div className="flex h-full flex-col bg-[#0b0b10] text-slate-100">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between border-b border-[#2d2d3f] px-6 py-3 bg-[#101018]">
        <h1 className="text-sm font-bold tracking-wider text-white">
          TAPAS : Urban Heat Mitigation Engine
        </h1>

        <nav className="flex space-x-2" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === "heat-stress"}
            onClick={() => setActiveTab("heat-stress")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "heat-stress"
                ? "bg-[#1e1e2f] text-[#8be9fd] border border-[#44475a]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Heat Stress Maps & Diagnostics
          </button>

          <button
            role="tab"
            aria-selected={activeTab === "pinn-simulator"}
            onClick={() => setActiveTab("pinn-simulator")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "pinn-simulator"
                ? "bg-[#1e1e2f] text-[#8be9fd] border border-[#44475a]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            PINN Core & Scenario Simulator
          </button>
        </nav>
      </header>

      {/* Main Tab Content Area */}
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {activeTab === "heat-stress" && <HeatStressTab />}
        {activeTab === "pinn-simulator" && (
          <PinnSimulatorTab
            values={interventionState.values}
            onChange={interventionState.setValue}
            onReset={interventionState.reset}
          />
        )}
      </main>
    </div>
  );
}