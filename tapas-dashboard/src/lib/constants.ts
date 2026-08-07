// import type { DiagnosticMetric, InterventionConfig, ParetoPoint } from "@/types";

// /**
//  * Default intervention slider definitions.
//  * Values map to GSOE/PIHDC model inputs — wire to API later.
//  */
// export const INTERVENTION_CONFIGS: InterventionConfig[] = [
//   {
//     key: "albedo",
//     label: "Surface Albedo",
//     description: "Reflectivity of urban surfaces (0 = absorptive, 1 = reflective)",
//     min: 0.05,
//     max: 0.85,
//     step: 0.01,
//     unit: "α",
//     accent: "thermal-cool",
//   },
//   {
//     key: "ndvi",
//     label: "Vegetation Index (NDVI)",
//     description: "Normalized difference vegetation index for green cover",
//     min: 0,
//     max: 1,
//     step: 0.01,
//     unit: "NDVI",
//     accent: "thermal-neutral",
//   },
//   {
//     key: "wasteHeat",
//     label: "Anthropogenic Waste Heat",
//     description: "Anthropogenic heat flux from buildings & transport",
//     min: 0,
//     max: 150,
//     step: 1,
//     unit: "W/m²",
//     accent: "thermal-hot",
//   },
// ];

// /** Default intervention values (baseline urban scenario) */
// export const DEFAULT_INTERVENTION_VALUES = {
//   albedo: 0.2,
//   ndvi: 0.35,
//   wasteHeat: 45,
// } as const;

// /** Placeholder urban diagnostics — replace with live model output */
// export const PLACEHOLDER_DIAGNOSTICS: DiagnosticMetric[] = [
//   {
//     id: "lst",
//     label: "Land Surface Temp.",
//     value: "38.4",
//     unit: "°C",
//     trend: "up",
//     delta: "+2.1°C vs baseline",
//   },
//   {
//     id: "uhi",
//     label: "UHI Intensity",
//     value: "4.7",
//     unit: "°C",
//     trend: "stable",
//     delta: "ΔT urban − rural",
//   },
//   {
//     id: "pet",
//     label: "Population Exposed",
//     value: "1.24",
//     unit: "M",
//     trend: "down",
//     delta: "-8% with intervention",
//   },
//   {
//     id: "cooling",
//     label: "Cooling Potential",
//     value: "2.3",
//     unit: "°C",
//     trend: "down",
//     delta: "Projected reduction",
//   },
// ];

// /** Placeholder Pareto frontier points — feed to Recharts/D3 later */
// export const PLACEHOLDER_PARETO: ParetoPoint[] = [
//   { id: "p1", cost: 12, coolingEffect: 0.8, label: "Low-cost greening" },
//   { id: "p2", cost: 28, coolingEffect: 1.6, label: "Cool roofs" },
//   { id: "p3", cost: 45, coolingEffect: 2.1, label: "Mixed strategy" },
//   { id: "p4", cost: 72, coolingEffect: 2.8, label: "Full retrofit" },
//   { id: "p5", cost: 95, coolingEffect: 3.2, label: "Max mitigation" },
// ];

// /** Key UHI driver contributions for diagnostics drawer */
// export interface KeyDriver {
//   id: string;
//   label: string;
//   contribution: number;
//   unit: string;
//   impact: "high" | "medium" | "low";
// }

// export const PLACEHOLDER_KEY_DRIVERS: KeyDriver[] = [
//   { id: "albedo", label: "Low Surface Albedo", contribution: 34, unit: "%", impact: "high" },
//   { id: "canopy", label: "Canopy Deficit", contribution: 28, unit: "%", impact: "high" },
//   { id: "anthro", label: "Anthropogenic Waste Heat", contribution: 22, unit: "%", impact: "medium" },
//   { id: "impervious", label: "Impervious Surface Ratio", contribution: 11, unit: "%", impact: "medium" },
//   { id: "svf", label: "Sky View Factor (Urban Canyon)", contribution: 5, unit: "%", impact: "low" },
// ];

// /** Validated PINN model metrics for Tab 2 */
// export interface PinnMetric {
//   id: string;
//   label: string;
//   value: string;
//   status: "pass" | "warn" | "neutral";
//   detail?: string;
// }

// export const PLACEHOLDER_PINN_METRICS: PinnMetric[] = [
//   { id: "data", label: "Data Fidelity Loss", value: "0.042", status: "pass", detail: "L_data < 0.05 threshold" },
//   { id: "seb", label: "Surface Energy Balance", value: "1.2e-3", status: "pass", detail: "SEB residual minimized" },
//   { id: "pde", label: "Heat Equation PDE", value: "3.8e-4", status: "pass", detail: "Physics constraint satisfied" },
//   { id: "morph", label: "Morphological Consistency", value: "2.1e-3", status: "pass", detail: "SVF gradient alignment" },
//   { id: "r2", label: "Validation R²", value: "0.91", status: "pass", detail: "Hold-out grid cells" },
//   { id: "mae", label: "LST MAE", value: "0.8°C", status: "pass", detail: "vs. satellite LST" },
// ];

// export const PLACEHOLDER_PINN_TRAINING = {
//   epochs: 5,
//   grids: "10,000",
//   architecture: "Tabular PINN · 128 hidden",
//   checkpoint: "tabular_pinn_ahmedabad.pth",
// };

// /** NSGA-II optimal strategy recommendations for Tab 3 */
// export interface StrategyRecommendation {
//   rank: number;
//   strategy: string;
//   cooling: number;
//   cost: number;
//   albedo: number;
//   ndvi: number;
//   wasteHeat: number;
//   paretoRank: number;
// }

// export const PLACEHOLDER_RECOMMENDATIONS: StrategyRecommendation[] = [
//   { rank: 1, strategy: "Aggressive Greening + Cool Roofs", cooling: 2.8, cost: 72, albedo: 0.35, ndvi: 0.62, wasteHeat: 28, paretoRank: 1 },
//   { rank: 2, strategy: "Balanced Mixed Mitigation", cooling: 2.1, cost: 45, albedo: 0.28, ndvi: 0.48, wasteHeat: 35, paretoRank: 2 },
//   { rank: 3, strategy: "Cost-Optimized Cool Surfaces", cooling: 1.6, cost: 28, albedo: 0.42, ndvi: 0.30, wasteHeat: 40, paretoRank: 3 },
//   { rank: 4, strategy: "Low-Cost Urban Greening", cooling: 0.8, cost: 12, albedo: 0.22, ndvi: 0.55, wasteHeat: 42, paretoRank: 4 },
//   { rank: 5, strategy: "Baseline (No Intervention)", cooling: 0.0, cost: 0, albedo: 0.20, ndvi: 0.35, wasteHeat: 45, paretoRank: 5 },
// ];




import type { DiagnosticMetric, InterventionConfig, ParetoPoint } from "@/types";

/**
 * Default intervention slider definitions.
 * Values map to GSOE/PIHDC model inputs — wire to API later.
 */
export const INTERVENTION_CONFIGS: InterventionConfig[] = [
  {
    key: "albedo",
    label: "Surface Albedo",
    description: "Reflectivity of urban surfaces (0 = absorptive, 1 = reflective)",
    min: 0.05,
    max: 0.85,
    step: 0.01,
    unit: "α",
    accent: "thermal-cool",
  },
  {
    key: "ndvi",
    label: "Vegetation Index (NDVI)",
    description: "Normalized difference vegetation index for green cover",
    min: 0,
    max: 1,
    step: 0.01,
    unit: "NDVI",
    accent: "thermal-neutral",
  },
  {
    key: "wasteHeat",
    label: "Anthropogenic Waste Heat",
    description: "Anthropogenic heat flux from buildings & transport",
    min: 0,
    max: 150,
    step: 1,
    unit: "W/m²",
    accent: "thermal-hot",
  },
];

/** Default intervention values (baseline urban scenario) */
export const DEFAULT_INTERVENTION_VALUES = {
  albedo: 0.2,
  ndvi: 0.35,
  wasteHeat: 45,
} as const;

/** Placeholder urban diagnostics — replace with live model output */
export const PLACEHOLDER_DIAGNOSTICS: DiagnosticMetric[] = [
  {
    id: "lst",
    label: "Land Surface Temp.",
    value: "38.4",
    unit: "°C",
    trend: "up",
    delta: "+2.1°C vs baseline",
  },
  {
    id: "uhi",
    label: "UHI Intensity",
    value: "4.7",
    unit: "°C",
    trend: "stable",
    delta: "ΔT urban − rural",
  },
  {
    id: "pet",
    label: "Population Exposed",
    value: "1.24",
    unit: "M",
    trend: "down",
    delta: "-8% with intervention",
  },
  {
    id: "cooling",
    label: "Cooling Potential",
    value: "2.3",
    unit: "°C",
    trend: "down",
    delta: "Projected reduction",
  },
];

/** Placeholder Pareto frontier points — feed to Recharts/D3 later */
export const PLACEHOLDER_PARETO: ParetoPoint[] = [
  { id: "p1", cost: 12, coolingEffect: 0.8, label: "Low-cost greening" },
  { id: "p2", cost: 28, coolingEffect: 1.6, label: "Cool roofs" },
  { id: "p3", cost: 45, coolingEffect: 2.1, label: "Mixed strategy" },
  { id: "p4", cost: 72, coolingEffect: 2.8, label: "Full retrofit" },
  { id: "p5", cost: 95, coolingEffect: 3.2, label: "Max mitigation" },
];

/** Key UHI driver contributions for diagnostics drawer */
export interface KeyDriver {
  id: string;
  label: string;
  contribution: number;
  unit: string;
  impact: "high" | "medium" | "low";
}

export const PLACEHOLDER_KEY_DRIVERS: KeyDriver[] = [
  { id: "albedo", label: "Low Surface Albedo", contribution: 34, unit: "%", impact: "high" },
  { id: "canopy", label: "Canopy Deficit", contribution: 28, unit: "%", impact: "high" },
  { id: "anthro", label: "Anthropogenic Waste Heat", contribution: 22, unit: "%", impact: "medium" },
  { id: "impervious", label: "Impervious Surface Ratio", contribution: 11, unit: "%", impact: "medium" },
  { id: "svf", label: "Sky View Factor (Urban Canyon)", contribution: 5, unit: "%", impact: "low" },
];

/** Validated PINN model high-level metrics for Tab 2 (Losses removed) */
export interface PinnMetric {
  id: string;
  label: string;
  value: string;
  status: "pass" | "warn" | "neutral";
  detail?: string;
}

export const PLACEHOLDER_PINN_METRICS: PinnMetric[] = [
  { id: "r2", label: "Validation R²", value: "0.91", status: "pass", detail: "Hold-out grid cells" },
  { id: "mae", label: "LST MAE", value: "0.8°C", status: "pass", detail: "vs. satellite LST" },
];

export const PLACEHOLDER_PINN_TRAINING = {
  epochs: 5,
  grids: "10,000",
  architecture: "Tabular PINN · 128 hidden",
  checkpoint: "tabular_pinn_ahmedabad.pth",
};

/** NSGA-II optimal strategy recommendations for Tab 3 */
export interface StrategyRecommendation {
  rank: number;
  strategy: string;
  cooling: number;
  cost: number;
  albedo: number;
  ndvi: number;
  wasteHeat: number;
  paretoRank: number;
}

export const PLACEHOLDER_RECOMMENDATIONS: StrategyRecommendation[] = [
  { rank: 1, strategy: "Aggressive Greening + Cool Roofs", cooling: 2.8, cost: 72, albedo: 0.35, ndvi: 0.62, wasteHeat: 28, paretoRank: 1 },
  { rank: 2, strategy: "Balanced Mixed Mitigation", cooling: 2.1, cost: 45, albedo: 0.28, ndvi: 0.48, wasteHeat: 35, paretoRank: 2 },
  { rank: 3, strategy: "Cost-Optimized Cool Surfaces", cooling: 1.6, cost: 28, albedo: 0.42, ndvi: 0.30, wasteHeat: 40, paretoRank: 3 },
  { rank: 4, strategy: "Low-Cost Urban Greening", cooling: 0.8, cost: 12, albedo: 0.22, ndvi: 0.55, wasteHeat: 42, paretoRank: 4 },
  { rank: 5, strategy: "Baseline (No Intervention)", cooling: 0.0, cost: 0, albedo: 0.20, ndvi: 0.35, wasteHeat: 45, paretoRank: 5 },
];