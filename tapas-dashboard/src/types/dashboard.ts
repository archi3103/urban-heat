

// /** Dashboard command-center tab identifiers */
// export type DashboardTab = "heat-stress" | "pinn-simulator";

// export interface TabConfig {
//   id: DashboardTab;
//   label: string;
//   icon: string;
//   description: string;
// }

// export const DASHBOARD_TABS: TabConfig[] = [
//   {
//     id: "heat-stress",
//     label: "Heat Stress Maps & Diagnostics",
//     icon: "",
//     description: "UHI thermal map and key driver breakdown",
//   },
//   {
//     id: "pinn-simulator",
//     label: "PINN Core & Scenario Simulator",
//     icon: "",
//     description: "Validated AI/ML metrics and GSOE intervention controls",
//   },
// ];




/** Dashboard command-center tab identifiers */
export type DashboardTab = "heat-stress";

export interface TabConfig {
  id: DashboardTab;
  label: string;
  icon: string;
  description: string;
}

export const DASHBOARD_TABS: TabConfig[] = [
  {
    id: "heat-stress",
    label: "Heat Stress Maps & Diagnostics",
    icon: "",
    description: "UHI thermal map and key driver breakdown",
  },
];