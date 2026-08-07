// "use client";

// import { PinnMetricsPanel } from "@/components/pinn/PinnMetricsPanel";
// import { ScenarioSimulatorPanel } from "@/components/sidebar/ScenarioSimulatorPanel";
// import type { InterventionKey, InterventionValues } from "@/types";

// interface PinnSimulatorTabProps {
//   values: InterventionValues;
//   onChange: (key: InterventionKey, value: number) => void;
//   onReset: () => void;
// }

// /**
//  * Tab 2 — Split-screen PINN validation metrics and GSOE scenario simulator.
//  */
// export function PinnSimulatorTab({ values, onChange, onReset }: PinnSimulatorTabProps) {
//   return (
//     <div
//       id="panel-pinn-simulator"
//       role="tabpanel"
//       aria-labelledby="tab-pinn-simulator"
//       className="flex min-h-0 flex-1 flex-col lg:flex-row"
//     >
//       <PinnMetricsPanel />
//       <ScenarioSimulatorPanel
//         values={values}
//         onChange={onChange}
//         onReset={onReset}
//       />
//     </div>
//   );
// }



// "use client";

// import { ScenarioSimulatorPanel } from "@/components/sidebar/ScenarioSimulatorPanel";
// import type { InterventionKey, InterventionValues } from "@/types";

// interface PinnSimulatorTabProps {
//   values: InterventionValues;
//   onChange: (key: InterventionKey, value: number) => void;
//   onReset: () => void;
// }

// /**
//  * Tab 2 — Full-screen GSOE scenario simulator.
//  */
// export function PinnSimulatorTab({ values, onChange, onReset }: PinnSimulatorTabProps) {
//   return (
//     <div
//       id="panel-pinn-simulator"
//       role="tabpanel"
//       aria-labelledby="tab-pinn-simulator"
//       className="flex min-h-0 flex-1 flex-col items-center justify-center p-6 w-full max-w-5xl mx-auto"
//     >
//       <div className="w-full">
//         <ScenarioSimulatorPanel
//           values={values}
//           onChange={onChange}
//           onReset={onReset}
//         />
//       </div>
//     </div>
//   );
// }


// "use client";

// import { ScenarioSimulatorPanel } from "@/components/sidebar/ScenarioSimulatorPanel";
// import { StrategyRecommendations } from "@/components/strategy/StrategyRecommendations";
// import type { InterventionKey, InterventionValues } from "@/types";

// interface PinnSimulatorTabProps {
//   values: InterventionValues;
//   onChange: (key: InterventionKey, value: number) => void;
//   onReset: () => void;
// }

// /**
//  * Tab 2 — Unified GSOE Scenario Simulator & Optimal Policy Strategies.
//  */
// export function PinnSimulatorTab({ values, onChange, onReset }: PinnSimulatorTabProps) {
//   return (
//     <div
//       id="panel-pinn-simulator"
//       role="tabpanel"
//       aria-labelledby="tab-pinn-simulator"
//       className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6 space-y-8 w-full max-w-7xl mx-auto"
//     >
//       {/* Interactive Scenario Simulator */}
//       <div className="w-full">
//         <ScenarioSimulatorPanel
//           values={values}
//           onChange={onChange}
//           onReset={onReset}
//         />
//       </div>

//       {/* Pre-computed NSGA-II Strategy Recommendations Table */}
//       <div className="w-full pt-4 border-t border-[#2d2d3f]">
//         <StrategyRecommendations />
//       </div>
//     </div>
//   );
// }

"use client";

import { ScenarioSimulatorPanel } from "@/components/sidebar/ScenarioSimulatorPanel";
import { StrategyRecommendations } from "@/components/strategy/StrategyRecommendations";
import type { InterventionKey, InterventionValues } from "@/types";

interface PinnSimulatorTabProps {
  values: InterventionValues;
  onChange: (key: InterventionKey, value: number) => void;
  onReset: () => void;
}

export function PinnSimulatorTab({ values, onChange, onReset }: PinnSimulatorTabProps) {
  return (
    <div
      id="panel-pinn-simulator"
      role="tabpanel"
      aria-labelledby="tab-pinn-simulator"
      className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6 space-y-8 w-full max-w-7xl mx-auto"
    >
      {/* Interactive Scenario Simulator */}
      <div className="w-full">
        <ScenarioSimulatorPanel
          values={values}
          onChange={onChange}
          onReset={onReset}
        />
      </div>

      {/* Strategy Recommendations Table */}
      <div className="w-full pt-4 border-t border-[#2d2d3f]">
        <StrategyRecommendations />
      </div>
    </div>
  );
}