

// "use client";

// import { HeatStressTab } from "@/components/tabs/HeatStressTab";
// import { PinnSimulatorTab } from "@/components/tabs/PinnSimulatorTab";
// import { useInterventionState } from "@/hooks/useInterventionState";
// import type { DashboardTab } from "@/types/dashboard";
// import { useState } from "react";

// export function DashboardLayout() {
//   const [activeTab, setActiveTab] = useState<DashboardTab>("heat-stress");
//   const interventionState = useInterventionState();

//   return (
//     <div className="flex h-full flex-col bg-[#0b0b10] text-slate-100">
//       {/* Top Navigation Bar */}
//       <header className="flex items-center justify-between border-b border-[#2d2d3f] px-6 py-3 bg-[#101018]">
//         <h1 className="text-sm font-bold tracking-wider text-white">
//           TAPAS : Urban Heat Mitigation Engine
//         </h1>

//         <nav className="flex space-x-2" role="tablist">
//           <button
//             role="tab"
//             aria-selected={activeTab === "heat-stress"}
//             onClick={() => setActiveTab("heat-stress")}
//             className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
//               activeTab === "heat-stress"
//                 ? "bg-[#1e1e2f] text-[#8be9fd] border border-[#44475a]"
//                 : "text-gray-400 hover:text-white"
//             }`}
//           >
//             Heat Stress Maps & Diagnostics
//           </button>

//           <button
//             role="tab"
//             aria-selected={activeTab === "pinn-simulator"}
//             onClick={() => setActiveTab("pinn-simulator")}
//             className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
//               activeTab === "pinn-simulator"
//                 ? "bg-[#1e1e2f] text-[#8be9fd] border border-[#44475a]"
//                 : "text-gray-400 hover:text-white"
//             }`}
//           >
//             PINN Core & Scenario Simulator
//           </button>
//         </nav>
//       </header>

//       {/* Main Tab Content Area */}
//       <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
//         {activeTab === "heat-stress" && <HeatStressTab />}
//         {activeTab === "pinn-simulator" && (
//           <PinnSimulatorTab
//             values={interventionState.values}
//             onChange={interventionState.setValue}
//             onReset={interventionState.reset}
//           />
//         )}
//       </main>
//     </div>
//   );
// }


"use client";

import { HeatStressTab } from "@/components/tabs/HeatStressTab";
import { PinnSimulatorTab } from "@/components/tabs/PinnSimulatorTab";
import { StrategyTab } from "@/components/tabs/StrategyTab";
import { TabNavigation } from "@/components/layout/TabNavigation";
import { useInterventionState } from "@/hooks/useInterventionState";
import type { DashboardTab } from "@/types/dashboard";
import { useState } from "react";

export function DashboardLayout() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("heat-stress");
  const interventions = useInterventionState();

  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-100">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-9 w-1 shrink-0 rounded-full bg-gradient-to-b from-red-500 via-violet-500 to-blue-500" />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold tracking-wide text-white sm:text-base">
              TAPAS <span className="font-normal text-slate-400">/ Urban Heat Mitigation</span>
            </h1>
            <p className="mt-0.5 text-[9px] font-mono uppercase tracking-[0.18em] text-slate-500 sm:text-[10px]">
              Ahmedabad · Decision support preview
            </p>
          </div>
        </div>
        <span className="ml-3 shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-amber-300 sm:text-[10px]">
          Illustrative data
        </span>
      </header>
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className={activeTab === "heat-stress" ? "flex min-h-0 flex-1 flex-col" : "hidden"}>
          <HeatStressTab />
        </div>
        <div className={activeTab === "pinn-simulator" ? "flex min-h-0 flex-1 flex-col" : "hidden"}>
          <PinnSimulatorTab
            values={interventions.values}
            onChange={interventions.setValue}
            onReset={interventions.reset}
          />
        </div>
        <div className={activeTab === "strategy" ? "flex min-h-0 flex-1 flex-col" : "hidden"}>
          <StrategyTab />
        </div>
      </main>
    </div>
  );
}