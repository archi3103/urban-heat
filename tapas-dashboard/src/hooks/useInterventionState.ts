"use client";

import { useCallback, useState } from "react";
import { DEFAULT_INTERVENTION_VALUES } from "@/lib/constants";
import type { InterventionKey, InterventionValues } from "@/types";

/**
 * Manages intervention slider state for the right sidebar.
 * Centralizes values so map tiles and model API can subscribe later.
 */
export function useInterventionState(
  initial: InterventionValues = { ...DEFAULT_INTERVENTION_VALUES },
) {
  const [values, setValues] = useState<InterventionValues>(initial);

  const setValue = useCallback((key: InterventionKey, value: number) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    setValues({ ...DEFAULT_INTERVENTION_VALUES });
  }, []);

  return { values, setValue, reset };
}
