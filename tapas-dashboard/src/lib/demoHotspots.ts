import { parseHotspotJson } from "@/lib/parseHotspotData";
import type { GSOEHotspotRow } from "@/types/hotspot";

const demoGrids = [
  { id: "DEMO-001", lat: 23.030, lon: 72.580, lst: 43.1, severity: "Critical", cooling: 2.6, drivers: ["low_surface_albedo", "canopy_deficit", "built_up_density"] },
  { id: "DEMO-002", lat: 23.018, lon: 72.551, lst: 42.5, severity: "High", cooling: 2.3, drivers: ["canopy_deficit", "impervious_surface", "low_surface_albedo"] },
  { id: "DEMO-003", lat: 23.046, lon: 72.602, lst: 41.9, severity: "High", cooling: 2.1, drivers: ["built_up_density", "low_surface_albedo", "anthropogenic_heat"] },
  { id: "DEMO-004", lat: 22.995, lon: 72.572, lst: 41.6, severity: "High", cooling: 2.0, drivers: ["canopy_deficit", "anthropogenic_heat", "impervious_surface"] },
  { id: "DEMO-005", lat: 23.063, lon: 72.568, lst: 40.9, severity: "Moderate", cooling: 1.8, drivers: ["low_surface_albedo", "built_up_density", "canopy_deficit"] },
  { id: "DEMO-006", lat: 23.002, lon: 72.615, lst: 40.6, severity: "Moderate", cooling: 1.7, drivers: ["impervious_surface", "anthropogenic_heat", "canopy_deficit"] },
  { id: "DEMO-007", lat: 23.032, lon: 72.532, lst: 40.2, severity: "Moderate", cooling: 1.6, drivers: ["canopy_deficit", "low_surface_albedo", "built_up_density"] },
  { id: "DEMO-008", lat: 22.978, lon: 72.551, lst: 39.9, severity: "Moderate", cooling: 1.5, drivers: ["anthropogenic_heat", "impervious_surface", "low_surface_albedo"] },
  { id: "DEMO-009", lat: 23.079, lon: 72.601, lst: 39.7, severity: "Moderate", cooling: 1.5, drivers: ["built_up_density", "canopy_deficit", "anthropogenic_heat"] },
  { id: "DEMO-010", lat: 23.009, lon: 72.638, lst: 39.4, severity: "Moderate", cooling: 1.4, drivers: ["impervious_surface", "low_surface_albedo", "canopy_deficit"] },
  { id: "DEMO-011", lat: 23.047, lon: 72.642, lst: 39.1, severity: "Moderate", cooling: 1.3, drivers: ["canopy_deficit", "built_up_density", "impervious_surface"] },
  { id: "DEMO-012", lat: 22.971, lon: 72.605, lst: 38.8, severity: "Moderate", cooling: 1.2, drivers: ["low_surface_albedo", "anthropogenic_heat", "canopy_deficit"] },
];

const demoScenarios = [
  { name: "Urban canopy + cool roofs", type: "Balanced", factor: 1, tree: 28, greenRoof: 12, coolRoof: 35, pavement: 10, rainGarden: 8, water: 4 },
  { name: "Reflective roofs + pavements", type: "Cool surfaces", factor: 0.78, tree: 8, greenRoof: 5, coolRoof: 48, pavement: 24, rainGarden: 3, water: 2 },
  { name: "Street trees + rain gardens", type: "Nature based", factor: 0.68, tree: 42, greenRoof: 8, coolRoof: 12, pavement: 7, rainGarden: 22, water: 5 },
];

const rows: GSOEHotspotRow[] = demoGrids.flatMap((grid, gridIndex) =>
  demoScenarios.map((scenario, scenarioIndex) => {
    const cooling = Number((grid.cooling * scenario.factor).toFixed(2));
    const isBest = scenarioIndex === 0;

    return {
      Grid_ID: grid.id,
      EE_Lat: grid.lat,
      EE_Lon: grid.lon,
      Global_Rank: gridIndex + 1,
      Severity: grid.severity,
      Original_LST: grid.lst,
      Driver_1: grid.drivers[0],
      Driver_2: grid.drivers[1],
      Driver_3: grid.drivers[2],
      Scenario_Rank: scenarioIndex + 1,
      Scenario_ID: `${grid.id}-S${scenarioIndex + 1}`,
      Scenario_Name: scenario.name,
      Scenario_Type: scenario.type,
      Tree_Canopy: scenario.tree,
      Green_Roof: scenario.greenRoof,
      Cool_Roof: scenario.coolRoof,
      Cool_Pavement: scenario.pavement,
      Rain_Garden: scenario.rainGarden,
      Water_Body: scenario.water,
      Scenario_LST: Number((grid.lst - cooling).toFixed(2)),
      Cooling: cooling,
      Cooling_Percent: Number(((cooling / grid.lst) * 100).toFixed(1)),
      Relative_Performance: Number((cooling / grid.cooling).toFixed(2)),
      Is_Best: isBest ? "True" : "False",
      Best_Intervention: demoScenarios[0].name,
      Best_Cooling: grid.cooling,
      Actual_Urban_Density: 55 + (gridIndex % 6) * 5,
      Density_Percent: 55 + (gridIndex % 6) * 5,
      Available_Ground: 18 + (gridIndex % 5) * 6,
      Spatial_Penalty: Number((0.08 + (gridIndex % 4) * 0.04).toFixed(2)),
      Feasibility_Adjusted_Score: Number((0.92 - scenarioIndex * 0.12 - gridIndex * 0.01).toFixed(2)),
      Feasibility_Rank: scenarioIndex + 1,
    };
  }),
);

/** Illustrative preview locations and scenarios; these are not observed measurements. */
export const DEMO_HOTSPOTS = parseHotspotJson(rows);
