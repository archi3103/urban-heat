/**
 * Core type definitions for the TAPAS Urban Heat Mitigation Engine.
 * Extend these as backend APIs and map layers are integrated.
 */

/** Live system status for the top navigation bar */
export type SystemStatus = "online" | "syncing" | "offline";

/** Intervention parameter keys controlled via the right sidebar */
export type InterventionKey = "albedo" | "ndvi" | "wasteHeat";

/** Single intervention slider configuration */
export interface InterventionConfig {
  key: InterventionKey;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  /** Thermal accent color token for slider track */
  accent: "thermal-hot" | "thermal-cool" | "thermal-neutral";
}

/** Current values for all intervention parameters */
export type InterventionValues = Record<InterventionKey, number>;

/** Urban diagnostic metric displayed in the bottom drawer */
export interface DiagnosticMetric {
  id: string;
  label: string;
  value: string;
  unit?: string;
  trend?: "up" | "down" | "stable";
  /** Optional delta from baseline, e.g. "-1.2°C" */
  delta?: string;
}

/** Point on the Pareto trade-off frontier (placeholder for chart library) */
export interface ParetoPoint {
  id: string;
  cost: number;
  coolingEffect: number;
  label?: string;
}
