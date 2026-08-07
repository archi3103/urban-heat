// "use client";

// import type { ReactNode } from "react";
// import type { StrategyRecommendation } from "@/lib/constants";
// import { PLACEHOLDER_RECOMMENDATIONS } from "@/lib/constants";

// interface StrategyRecommendationsProps {
//   recommendations?: StrategyRecommendation[];
// }

// /**
//  * NSGA-II optimal intervention recommendation table for Tab 3.
//  */
// export function StrategyRecommendations({
//   recommendations = PLACEHOLDER_RECOMMENDATIONS,
// }: StrategyRecommendationsProps) {
//   return (
//     <div className="flex min-h-0 flex-1 flex-col">
//       <div className="mb-3 flex items-end justify-between gap-4">
//         <div>
//           <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
//             Optimal Intervention Strategies
//           </h3>
//           <p className="mt-0.5 text-[11px] text-slate-600">
//             NSGA-II ranked Pareto-optimal solutions · Ahmedabad grid
//           </p>
//         </div>
//         <span className="shrink-0 rounded-full border border-slate-700/60 bg-slate-800/40 px-2.5 py-1 text-[10px] font-mono text-slate-500">
//           {recommendations.length} solutions
//         </span>
//       </div>

//       <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-700/50 bg-slate-950/40">
//         <table className="w-full min-w-[640px] text-left text-sm">
//           <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm">
//             <tr className="border-b border-slate-700/60">
//               <Th>Rank</Th>
//               <Th>Strategy</Th>
//               <Th align="right">Cooling</Th>
//               <Th align="right">Cost</Th>
//               <Th align="right">Albedo</Th>
//               <Th align="right">NDVI</Th>
//               <Th align="right">Waste Heat</Th>
//               <Th align="center">Pareto</Th>
//             </tr>
//           </thead>
//           <tbody>
//             {recommendations.map((rec) => (
//               <tr
//                 key={rec.rank}
//                 className={`border-b border-slate-800/60 transition-colors hover:bg-slate-800/30 ${
//                   rec.rank === 1 ? "bg-blue-500/5" : ""
//                 }`}
//               >
//                 <Td>
//                   <span
//                     className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
//                       rec.rank === 1
//                         ? "bg-blue-500/20 text-blue-400"
//                         : "bg-slate-800 text-slate-400"
//                     }`}
//                   >
//                     {rec.rank}
//                   </span>
//                 </Td>
//                 <Td>
//                   <span className="font-medium text-slate-200">{rec.strategy}</span>
//                   {rec.rank === 1 && (
//                     <span className="ml-2 rounded border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-blue-400">
//                       Recommended
//                     </span>
//                   )}
//                 </Td>
//                 <Td align="right" mono accent="text-blue-400">
//                   {rec.cooling.toFixed(1)}°C
//                 </Td>
//                 <Td align="right" mono>
//                   {rec.cost}
//                 </Td>
//                 <Td align="right" mono>
//                   {rec.albedo.toFixed(2)}
//                 </Td>
//                 <Td align="right" mono>
//                   {rec.ndvi.toFixed(2)}
//                 </Td>
//                 <Td align="right" mono>
//                   {rec.wasteHeat} W/m²
//                 </Td>
//                 <Td align="center">
//                   <span className="rounded border border-slate-700/50 bg-slate-800/50 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
//                     F{rec.paretoRank}
//                   </span>
//                 </Td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// function Th({
//   children,
//   align = "left",
// }: {
//   children: ReactNode;
//   align?: "left" | "right" | "center";
// }) {
//   return (
//     <th
//       className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 ${
//         align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
//       }`}
//     >
//       {children}
//     </th>
//   );
// }

// function Td({
//   children,
//   align = "left",
//   mono = false,
//   accent,
// }: {
//   children: ReactNode;
//   align?: "left" | "right" | "center";
//   mono?: boolean;
//   accent?: string;
// }) {
//   return (
//     <td
//       className={`px-4 py-3 text-xs ${
//         align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
//       } ${mono ? "font-mono tabular-nums" : ""} ${accent ?? "text-slate-300"}`}
//     >
//       {children}
//     </td>
//   );
// }

"use client";

import type { ReactNode } from "react";
import type { StrategyRecommendation } from "@/lib/constants";
import { PLACEHOLDER_RECOMMENDATIONS } from "@/lib/constants";

interface StrategyRecommendationsProps {
  recommendations?: StrategyRecommendation[];
}

/**
 * NSGA-II optimal intervention recommendation table for Tab 3.
 */
export function StrategyRecommendations({
  recommendations = PLACEHOLDER_RECOMMENDATIONS,
}: StrategyRecommendationsProps) {
  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Section Card Wrapper */}
      <div className="bg-[#101018] border border-[#2d2d3f] p-6 rounded-xl shadow-xl space-y-4">

        <div className="flex items-end justify-between gap-4 border-b border-[#2d2d3f] pb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#ffb86c]">
              Optimal Intervention Strategies
            </h3>
            <p className="mt-1 text-xs text-gray-400">
              NSGA-II ranked Pareto-optimal solutions for Ahmedabad urban heat mitigation
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-[#44475a] bg-[#1e1e2f] px-3 py-1 text-xs font-mono text-[#8be9fd]">
            {recommendations.length} solutions deployed
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#2d2d3f] bg-[#0b0b10]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[#161622] border-b border-[#2d2d3f]">
              <tr>
                <Th>Rank</Th>
                <Th>Strategy</Th>
                <Th align="right">Cooling</Th>
                <Th align="right">Cost Index</Th>
                <Th align="right">Albedo</Th>
                <Th align="right">NDVI</Th>
                <Th align="right">Waste Heat</Th>
                <Th align="center">Pareto</Th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((rec) => (
                <tr
                  key={rec.rank}
                  className={`border-b border-[#2d2d3f]/50 transition-colors hover:bg-[#1e1e2f]/50 ${
                    rec.rank === 1 ? "bg-blue-500/10" : ""
                  }`}
                >
                  <Td>
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        rec.rank === 1
                          ? "bg-blue-500/20 text-[#8be9fd]"
                          : "bg-[#1e1e2f] text-gray-400"
                      }`}
                    >
                      {rec.rank}
                    </span>
                  </Td>
                  <Td>
                    <span className="font-medium text-white">{rec.strategy}</span>
                    {rec.rank === 1 && (
                      <span className="ml-2 rounded border border-[#8be9fd]/30 bg-[#8be9fd]/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-[#8be9fd]">
                        Recommended
                      </span>
                    )}
                  </Td>
                  <Td align="right" mono accent="text-[#50fa7b]">
                    -{rec.cooling.toFixed(1)}°C
                  </Td>
                  <Td align="right" mono>
                    {rec.cost}
                  </Td>
                  <Td align="right" mono>
                    {rec.albedo.toFixed(2)}
                  </Td>
                  <Td align="right" mono>
                    {rec.ndvi.toFixed(2)}
                  </Td>
                  <Td align="right" mono>
                    {rec.wasteHeat} W/m²
                  </Td>
                  <Td align="center">
                    <span className="rounded border border-[#44475a] bg-[#1e1e2f] px-2 py-0.5 font-mono text-xs text-[#ffb86c]">
                      F{rec.paretoRank}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      className={`px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400 ${
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
  mono = false,
  accent,
}: {
  children: ReactNode;
  align?: "left" | "right" | "center";
  mono?: boolean;
  accent?: string;
}) {
  return (
    <td
      className={`px-4 py-3 text-xs ${
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
      } ${mono ? "font-mono tabular-nums" : ""} ${accent ?? "text-gray-300"}`}
    >
      {children}
    </td>
  );
}