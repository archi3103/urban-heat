"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { loadHotspotData } from "@/lib/parseHotspotData";
import {
  DEFAULT_HOTSPOT_DATA_URL,
  TOP_TIER_RANK_THRESHOLD,
  type GSOEHotspot,
} from "@/types/hotspot";

interface UseHotspotDataResult {
  hotspots: GSOEHotspot[];
  topTierHotspots: GSOEHotspot[];
  loading: boolean;
  error: string | null;
  /** Reload from a new CSV/JSON URL — enables dynamic dataset swapping */
  reload: (url?: string) => Promise<void>;
}

/**
 * Fetches and parses GSOE best_per_hotspot data.
 * Point `sourceUrl` at any CSV/JSON matching the GSOE export schema.
 */
export function useHotspotData(
  sourceUrl: string = DEFAULT_HOTSPOT_DATA_URL,
): UseHotspotDataResult {
  const [hotspots, setHotspots] = useState<GSOEHotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (url?: string) => {
    const target = url ?? sourceUrl;
    setLoading(true);
    setError(null);

    try {
      const data = await loadHotspotData(target);
      setHotspots(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load hotspot data";
      setError(message);
      setHotspots([]);
    } finally {
      setLoading(false);
    }
  }, [sourceUrl]);

  useEffect(() => {
    reload();
  }, [reload]);

  const topTierHotspots = useMemo(
    () =>
      hotspots.filter((h) => h.globalRank <= TOP_TIER_RANK_THRESHOLD),
    [hotspots],
  );

  return { hotspots, topTierHotspots, loading, error, reload };
}
