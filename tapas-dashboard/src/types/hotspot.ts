// /**
//  * GSOE output schema for best_per_hotspot.csv / JSON exports.
//  * Column names use snake_case to match Python pandas exports.
//  */

// /** Raw row shape as exported from the GSOE pipeline */
// export interface GSOEHotspotRow {
//   grid_id: string;
//   global_rank: number;
//   lat: number;
//   lon: number;
//   detected_lst: number;
//   gsoe_target_lst: number;
//   mitigation_delta: number;
//   tree_canopy_pct?: number;
//   cool_roof_pct?: number;
//   green_infra_pct?: number;
//   water_body_pct?: number;
//   albedo_delta?: number;
//   master_score: number;
//   cost_efficiency: number;
//   confidence: number;
//   scalability: number;
// }

// /** Normalized hotspot record consumed by map components */
// export interface GSOEHotspot {
//   gridId: string;
//   globalRank: number;
//   lat: number;
//   lon: number;
//   detectedLst: number;
//   gsoeTargetLst: number;
//   mitigationDelta: number;
//   interventions: InterventionPill[];
//   masterScore: number;
//   costEfficiency: number;
//   confidence: number;
//   scalability: number;
//   /** Normalized 0–1 intensity for leaflet.heat */
//   heatIntensity: number;
// }

// export interface InterventionPill {
//   label: string;
//   value: string;
// }

// /** Intervention column → display label mapping */
// export const INTERVENTION_COLUMN_LABELS: Record<string, string> = {
//   tree_canopy_pct: "Tree Canopy",
//   cool_roof_pct: "Cool Roof",
//   green_infra_pct: "Green Infra",
//   water_body_pct: "Water Body",
//   albedo_delta: "Albedo Δ",
// };

// /** Default dataset path — swap at runtime via useHotspotData(sourceUrl) */
// export const DEFAULT_HOTSPOT_DATA_URL = "/data/best_per_hotspot.csv";

// /** Ahmedabad city center — map default viewport */
// export const AHMEDABAD_CENTER = { lat: 23.0225, lng: 72.5714 } as const;

// /** Only hotspots at or above this rank tier receive neon pin markers */
// export const TOP_TIER_RANK_THRESHOLD = 15;




export interface GSOEHotspotRow {
  Grid_ID: string;
  EE_Lat: number;
  EE_Lon: number;
  Global_Rank?: number;
  Severity: string;
  Original_LST: number;
  Driver_1: string;
  Driver_2: string;
  Driver_3: string;
  Scenario_Rank: number;
  Scenario_ID: string;
  Scenario_Name: string;
  Scenario_Type: string;
  Tree_Canopy: number;
  Green_Roof: number;
  Cool_Roof: number;
  Cool_Pavement: number;
  Rain_Garden: number;
  Water_Body: number;
  Scenario_LST: number;
  Cooling: number;
  Cooling_Percent: number;
  Relative_Performance: number;
  Is_Best: string; // "True" or "False"
  Best_Intervention: string;
  Best_Cooling: number;
  Actual_Urban_Density: number;
  Density_Percent: number;
  Available_Ground: number;
  Spatial_Penalty: number;
  Feasibility_Adjusted_Score: number;
  Feasibility_Rank: number;
}

export interface GSOEScenario {
  scenarioRank: number;
  scenarioId: string;
  scenarioName: string;
  scenarioType: string;
  treeCanopy: number;
  greenRoof: number;
  coolRoof: number;
  coolPavement: number;
  rainGarden: number;
  waterBody: number;
  scenarioLst: number;
  cooling: number;
  coolingPercent: number;
  isBest: boolean;
  actualUrbanDensity: number;
  feasibilityRank: number;
  feasibilityAdjustedScore: number;
  availableGround: number;
}

export interface GSOEHotspot {
  gridId: string;
  globalRank?: number;
  isHotspot: boolean;
  lat: number;
  lon: number;
  severity: string;
  originalLst: number;
  scenarioLst: number;
  bestCooling: number;
  coolingPercent: number;
  bestIntervention: string;
  drivers: string[];
  interventions: InterventionPill[];
  heatIntensity: number; // Normalized 0-1 for heat maps
  
  // New columns from the Master Scenarios CSV
  actualUrbanDensity: number;
  densityPercent: number;
  availableGround: number;
  spatialPenalty: number;
  feasibilityAdjustedScore: number;
  feasibilityRank: number;
  
  bestScenario: GSOEScenario;
  scenarios: GSOEScenario[];
}

export interface InterventionPill {
  label: string;
  value: string;
}

export const INTERVENTION_COLUMN_LABELS: Record<string, string> = {
  Tree_Canopy: "Tree Canopy",
  Green_Roof: "Green Roof",
  Cool_Roof: "Cool Roof",
  Cool_Pavement: "Cool Pavement",
  Rain_Garden: "Rain Garden",
  Water_Body: "Water Body",
};

/** Point to Ahmedabad_Master_Scenarios_REAL_Density.csv placed inside public/ */
export const DEFAULT_HOTSPOT_DATA_URL = "/Ahmedabad_Master_Scenarios_FINAL_Sorted (1) (3).csv";

export const AHMEDABAD_CENTER = { lat: 23.0225, lng: 72.5714 } as const;

export const TOP_TIER_RANK_THRESHOLD = 15;