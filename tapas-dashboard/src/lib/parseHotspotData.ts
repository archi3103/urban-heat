// import type { GSOEHotspot, GSOEHotspotRow, InterventionPill } from "@/types/hotspot";
// import { INTERVENTION_COLUMN_LABELS } from "@/types/hotspot";

// /** Parse a CSV line respecting quoted fields */
// function parseCsvLine(line: string): string[] {
//   const fields: string[] = [];
//   let current = "";
//   let inQuotes = false;

//   for (let i = 0; i < line.length; i++) {
//     const char = line[i];
//     if (char === '"') {
//       inQuotes = !inQuotes;
//     } else if (char === "," && !inQuotes) {
//       fields.push(current.trim());
//       current = "";
//     } else {
//       current += char;
//     }
//   }
//   fields.push(current.trim());
//   return fields;
// }

// function toNumber(value: string | undefined, fallback = 0): number {
//   if (value === undefined || value === "") return fallback;
//   const n = Number(value);
//   return Number.isFinite(n) ? n : fallback;
// }

// function extractInterventions(row: GSOEHotspotRow): InterventionPill[] {
//   const pills: InterventionPill[] = [];

//   for (const [column, label] of Object.entries(INTERVENTION_COLUMN_LABELS)) {
//     const raw = row[column as keyof GSOEHotspotRow];
//     if (raw === undefined || raw === null || raw === "") continue;

//     const num = Number(raw);
//     if (!Number.isFinite(num) || num <= 0) continue;

//     const formatted =
//       column === "albedo_delta" ? num.toFixed(2) : `${Math.round(num)}%`;
//     pills.push({ label, value: formatted });
//   }

//   return pills;
// }

// function rowToHotspot(
//   row: GSOEHotspotRow,
//   minLst: number,
//   maxLst: number,
// ): GSOEHotspot {
//   const lstRange = maxLst - minLst || 1;
//   const heatIntensity = Math.min(
//     1,
//     Math.max(0, (row.detected_lst - minLst) / lstRange),
//   );

//   return {
//     gridId: row.grid_id,
//     globalRank: row.global_rank,
//     lat: row.lat,
//     lon: row.lon,
//     detectedLst: row.detected_lst,
//     gsoeTargetLst: row.gsoe_target_lst,
//     mitigationDelta: row.mitigation_delta,
//     interventions: extractInterventions(row),
//     masterScore: row.master_score,
//     costEfficiency: row.cost_efficiency,
//     confidence: row.confidence,
//     scalability: row.scalability,
//     heatIntensity,
//   };
// }

// function normalizeRows(rows: GSOEHotspotRow[]): GSOEHotspot[] {
//   if (rows.length === 0) return [];

//   const lstValues = rows.map((r) => r.detected_lst);
//   const minLst = Math.min(...lstValues);
//   const maxLst = Math.max(...lstValues);

//   return rows
//     .map((row) => rowToHotspot(row, minLst, maxLst))
//     .sort((a, b) => a.globalRank - b.globalRank);
// }

// /** Parse raw CSV text into normalized hotspot records */
// export function parseHotspotCsv(csvText: string): GSOEHotspot[] {
//   const lines = csvText
//     .trim()
//     .split(/\r?\n/)
//     .filter((line) => line.trim().length > 0);

//   if (lines.length < 2) return [];

//   const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
//   const rows: GSOEHotspotRow[] = [];

//   for (let i = 1; i < lines.length; i++) {
//     const values = parseCsvLine(lines[i]);
//     const record: Record<string, string> = {};
//     headers.forEach((header, idx) => {
//       record[header] = values[idx] ?? "";
//     });

//     rows.push({
//       grid_id: record.grid_id ?? `HOTSPOT_${i}`,
//       global_rank: toNumber(record.global_rank, i),
//       lat: toNumber(record.lat),
//       lon: toNumber(record.lon),
//       detected_lst: toNumber(record.detected_lst, 30),
//       gsoe_target_lst: toNumber(record.gsoe_target_lst, 30),
//       mitigation_delta: toNumber(record.mitigation_delta),
//       tree_canopy_pct: toNumber(record.tree_canopy_pct),
//       cool_roof_pct: toNumber(record.cool_roof_pct),
//       green_infra_pct: toNumber(record.green_infra_pct),
//       water_body_pct: toNumber(record.water_body_pct),
//       albedo_delta: toNumber(record.albedo_delta),
//       master_score: toNumber(record.master_score, 0.5),
//       cost_efficiency: toNumber(record.cost_efficiency, 0.5),
//       confidence: toNumber(record.confidence, 0.5),
//       scalability: toNumber(record.scalability, 0.5),
//     });
//   }

//   return normalizeRows(rows);
// }

// /** Parse JSON array export (same schema as CSV rows) */
// export function parseHotspotJson(json: unknown): GSOEHotspot[] {
//   if (!Array.isArray(json)) {
//     throw new Error("Hotspot JSON must be an array of records");
//   }

//   const rows = json as GSOEHotspotRow[];
//   return normalizeRows(rows);
// }

// /** Fetch and parse hotspot data from CSV or JSON URL */
// export async function loadHotspotData(url: string): Promise<GSOEHotspot[]> {
//   const response = await fetch(url, { cache: "no-store" });
//   if (!response.ok) {
//     throw new Error(`Failed to load hotspot data (${response.status})`);
//   }

//   const text = await response.text();
//   const trimmed = text.trim();

//   if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
//     return parseHotspotJson(JSON.parse(trimmed));
//   }

//   return parseHotspotCsv(text);
// }

// /** Convert hotspots to leaflet.heat [lat, lng, intensity] tuples */
// export function toHeatmapPoints(
//   hotspots: GSOEHotspot[],
// ): [number, number, number][] {
//   return hotspots.map((h) => [h.lat, h.lon, h.heatIntensity]);
// }

import type { GSOEHotspot, GSOEHotspotRow, GSOEScenario, InterventionPill } from "@/types/hotspot";
import { INTERVENTION_COLUMN_LABELS } from "@/types/hotspot";

/** Parse a CSV line respecting quoted fields */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

function toNumber(value: string | undefined, fallback = 0): number {
  if (value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function extractInterventions(row: GSOEHotspotRow): InterventionPill[] {
  const pills: InterventionPill[] = [];

  for (const [column, label] of Object.entries(INTERVENTION_COLUMN_LABELS)) {
    const raw = row[column as keyof GSOEHotspotRow];
    if (raw === undefined || raw === null || raw === "") continue;

    const num = Number(raw);
    if (!Number.isFinite(num) || num <= 0) continue;

    const formatted = `${Math.round(num)}%`;
    pills.push({ label, value: formatted });
  }

  return pills;
}

function normalizeGroupedRows(grouped: Record<string, GSOEHotspotRow[]>): GSOEHotspot[] {
  const hotspots: GSOEHotspot[] = [];
  const allGridIds = Object.keys(grouped);
  if (allGridIds.length === 0) return [];

  // Determine min/max original LST across all unique hotspots
  const originalLsts = allGridIds.map((gridId) => grouped[gridId][0].Original_LST);
  const minLst = Math.min(...originalLsts);
  const maxLst = Math.max(...originalLsts);
  const lstRange = maxLst - minLst || 1;

  for (const gridId of allGridIds) {
    const rows = grouped[gridId];

    // Inside each grid cell, sort the array of scenarios by:
    // 1) Feasibility Rank (primary — lower numeric rank = higher feasibility).
    // 2) Temperature Reduction / Cooling (°C) (secondary — higher cooling = better).
    const sortedRows = [...rows].sort((a, b) => {
      if (a.Feasibility_Rank !== b.Feasibility_Rank) {
        return a.Feasibility_Rank - b.Feasibility_Rank;
      }
      return b.Cooling - a.Cooling;
    });

    const bestRow = sortedRows[0];

    const scenarios: GSOEScenario[] = sortedRows.map((r) => ({
      scenarioRank: r.Scenario_Rank,
      scenarioId: r.Scenario_ID,
      scenarioName: r.Scenario_Name,
      scenarioType: r.Scenario_Type,
      treeCanopy: r.Tree_Canopy,
      greenRoof: r.Green_Roof,
      coolRoof: r.Cool_Roof,
      coolPavement: r.Cool_Pavement,
      rainGarden: r.Rain_Garden,
      waterBody: r.Water_Body,
      scenarioLst: r.Scenario_LST,
      cooling: r.Cooling,
      coolingPercent: r.Cooling_Percent,
      isBest: r.Is_Best.toLowerCase() === "true",
      actualUrbanDensity: r.Actual_Urban_Density,
      feasibilityRank: r.Feasibility_Rank,
      feasibilityAdjustedScore: r.Feasibility_Adjusted_Score,
      availableGround: r.Available_Ground,
    }));

    const heatIntensity = Math.min(
      1,
      Math.max(0, (bestRow.Original_LST - minLst) / lstRange),
    );

    const isHotspot = bestRow.Global_Rank !== undefined && bestRow.Global_Rank !== null && !isNaN(bestRow.Global_Rank) && bestRow.Global_Rank <= 100;

    hotspots.push({
      gridId: bestRow.Grid_ID,
      globalRank: bestRow.Global_Rank,
      isHotspot,
      lat: bestRow.EE_Lat,
      lon: bestRow.EE_Lon,
      severity: bestRow.Severity,
      originalLst: bestRow.Original_LST,
      scenarioLst: bestRow.Scenario_LST,
      bestCooling: bestRow.Cooling,
      coolingPercent: bestRow.Cooling_Percent,
      bestIntervention: bestRow.Scenario_Name,
      drivers: [bestRow.Driver_1, bestRow.Driver_2, bestRow.Driver_3].filter(Boolean),
      interventions: extractInterventions(bestRow),
      heatIntensity,
      actualUrbanDensity: bestRow.Actual_Urban_Density,
      densityPercent: bestRow.Density_Percent,
      availableGround: bestRow.Available_Ground,
      spatialPenalty: bestRow.Spatial_Penalty,
      feasibilityAdjustedScore: bestRow.Feasibility_Adjusted_Score,
      feasibilityRank: bestRow.Feasibility_Rank,
      bestScenario: scenarios[0],
      scenarios,
    });
  }

  // Sort hotspots: top 100 hotspots first (isHotspot = true, sorted by globalRank), followed by standard grids
  return hotspots.sort((a, b) => {
    if (a.isHotspot && b.isHotspot) {
      return (a.globalRank ?? 999999) - (b.globalRank ?? 999999);
    }
    if (a.isHotspot) return -1;
    if (b.isHotspot) return 1;
    return a.gridId.localeCompare(b.gridId);
  });
}

/** Parse raw CSV text into normalized hotspot records with grouped scenarios */
export function parseHotspotCsv(csvText: string): GSOEHotspot[] {
  const lines = csvText
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const groupedRows: Record<string, GSOEHotspotRow[]> = {};

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx] ?? "";
    });

    const gridId = record.grid_id ?? `GRID_${i}`;
    if (!groupedRows[gridId]) {
      groupedRows[gridId] = [];
    }

    const rawGlobalRank = record.global_rank;
    const globalRank = (rawGlobalRank !== undefined && rawGlobalRank !== "") ? toNumber(rawGlobalRank) : undefined;

    groupedRows[gridId].push({
      Grid_ID: gridId,
      EE_Lat: toNumber(record.ee_lat),
      EE_Lon: toNumber(record.ee_lon),
      Global_Rank: globalRank,
      Severity: record.severity ?? "Moderate",
      Original_LST: toNumber(record.original_lst, 30),
      Driver_1: record.driver_1 ?? "",
      Driver_2: record.driver_2 ?? "",
      Driver_3: record.driver_3 ?? "",
      Scenario_Rank: toNumber(record.scenario_rank, 1),
      Scenario_ID: record.scenario_id ?? "",
      Scenario_Name: record.scenario_name ?? "",
      Scenario_Type: record.scenario_type ?? "",
      Tree_Canopy: toNumber(record.tree_canopy),
      Green_Roof: toNumber(record.green_roof),
      Cool_Roof: toNumber(record.cool_roof),
      Cool_Pavement: toNumber(record.cool_pavement),
      Rain_Garden: toNumber(record.rain_garden),
      Water_Body: toNumber(record.water_body),
      Scenario_LST: toNumber(record.scenario_lst, 30),
      Cooling: toNumber(record.cooling),
      Cooling_Percent: toNumber(record.cooling_percent),
      Relative_Performance: toNumber(record.relative_performance),
      Is_Best: record.is_best ?? "False",
      Best_Intervention: record.best_intervention ?? "",
      Best_Cooling: toNumber(record.best_cooling),
      Actual_Urban_Density: toNumber(record.actual_urban_density),
      Density_Percent: toNumber(record.density_percent),
      Available_Ground: toNumber(record.available_ground),
      Spatial_Penalty: toNumber(record.spatial_penalty),
      Feasibility_Adjusted_Score: toNumber(record.feasibility_adjusted_score),
      Feasibility_Rank: toNumber(record.feasibility_rank),
    });
  }

  return normalizeGroupedRows(groupedRows);
}

/** Parse JSON array export (same schema as CSV rows) */
export function parseHotspotJson(json: unknown): GSOEHotspot[] {
  if (!Array.isArray(json)) {
    throw new Error("Hotspot JSON must be an array of records");
  }

  // Group json rows by Grid_ID if they are raw rows
  const rows = json as GSOEHotspotRow[];
  const grouped: Record<string, GSOEHotspotRow[]> = {};
  rows.forEach((row, i) => {
    const gridId = row.Grid_ID ?? `GRID_${i}`;
    if (!grouped[gridId]) {
      grouped[gridId] = [];
    }
    grouped[gridId].push(row);
  });

  return normalizeGroupedRows(grouped);
}

/** Fetch and parse hotspot data from CSV or JSON URL */
export async function loadHotspotData(url: string): Promise<GSOEHotspot[]> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load hotspot data (${response.status})`);
  }

  const text = await response.text();
  const trimmed = text.trim();

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    return parseHotspotJson(JSON.parse(trimmed));
  }

  return parseHotspotCsv(text);
}

/** Convert hotspots to leaflet.heat [lat, lng, intensity] tuples */
export function toHeatmapPoints(
  hotspots: GSOEHotspot[],
): [number, number, number][] {
  return hotspots.map((h) => [h.lat, h.lon, h.heatIntensity]);
}