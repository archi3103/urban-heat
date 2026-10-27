

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
export type DashboardTab = "heat-stress" | "pinn-simulator" | "strategy";

export interface TabConfig {
  id: DashboardTab;
  label: string;
  icon: string;
  description: string;
}

export const DASHBOARD_TABS: TabConfig[] = [
  {
    id: "heat-stress",
    label: "Heat map",
    icon: "01",
    description: "UHI thermal map and key driver breakdown",
  },
  {
    id: "pinn-simulator",
    label: "Scenario lab",
    icon: "02",
    description: "Explore urban heat mitigation scenarios",
  },
  {
    id: "strategy",
    label: "Strategies",
    icon: "03",
    description: "Compare strategy recommendations and trade-offs",
  },
];