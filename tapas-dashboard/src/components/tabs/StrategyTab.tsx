// "use client";

// import { ParetoAnalytics } from "@/components/diagnostics/ParetoAnalytics";
// import { StrategyRecommendations } from "@/components/strategy/StrategyRecommendations";
// import { PLACEHOLDER_PARETO } from "@/lib/constants";

// /**
//  * Tab 3 — Full-page NSGA-II Pareto frontier and optimal strategy table.
//  */
// export function StrategyTab() {
//   return (
//     <div
//       id="panel-strategy"
//       role="tabpanel"
//       aria-labelledby="tab-strategy"
//       className="flex min-h-0 flex-1 flex-col overflow-hidden"
//     >
//       <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5 lg:p-6">
//         {/* Page header */}
//         <header className="shrink-0">
//           <h2 className="text-base font-semibold text-slate-100">
//             Optimal Strategy &amp; Pareto Analytics
//           </h2>
//           <p className="mt-1 text-xs text-slate-500">
//             NSGA-II multi-objective optimization · cost vs. cooling trade-off frontier
//           </p>
//         </header>

//         {/* Pareto chart — generous vertical space */}
//         <section
//           className="shrink-0 rounded-xl border border-slate-700/50 bg-slate-900/40 p-5 lg:p-6"
//           aria-label="Pareto frontier chart"
//         >
//           <ParetoAnalytics points={PLACEHOLDER_PARETO} variant="full" />
//         </section>

//         {/* Recommendations table */}
//         <section className="flex min-h-[280px] flex-1 flex-col">
//           <StrategyRecommendations />
//         </section>
//       </div>
//     </div>
//   );
// }


"use client";

import { ParetoAnalytics } from "@/components/diagnostics/ParetoAnalytics";
import { StrategyRecommendations } from "@/components/strategy/StrategyRecommendations";
import { PLACEHOLDER_PARETO } from "@/lib/constants";

/**
 * Tab 3 — Full-page NSGA-II Pareto frontier and optimal strategy table.
 */
export function StrategyTab() {
  return (
    <div
      id="panel-strategy"
      role="tabpanel"
      aria-labelledby="tab-strategy"
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5 lg:p-6 max-w-7xl mx-auto w-full">
        {/* Page header */}
        <header className="shrink-0 bg-[#101018] border border-[#2d2d3f] p-5 rounded-xl">
          <h2 className="text-base font-bold text-white">
            Optimal Strategy &amp; Pareto Analytics
          </h2>
          <p className="mt-1 text-xs text-[#8be9fd]">
            NSGA-II multi-objective optimization · cost vs. cooling trade-off frontier
          </p>
        </header>

        {/* Pareto chart — controlled height container */}
        <section
          className="shrink-0 rounded-xl border border-[#2d2d3f] bg-[#101018] p-5 lg:p-6 shadow-xl"
          aria-label="Pareto frontier chart"
        >
          <h3 className="text-xs font-bold text-[#ffb86c] uppercase tracking-wider mb-4">
            Pareto Frontier — Cost vs. Cooling
          </h3>
          <div className="w-full h-[320px] max-w-4xl mx-auto flex items-center justify-center">
            <ParetoAnalytics points={PLACEHOLDER_PARETO} variant="compact" />
          </div>
        </section>

        {/* Recommendations table */}
        <section className="flex flex-col">
          <StrategyRecommendations />
        </section>
      </div>
    </div>
  );
}