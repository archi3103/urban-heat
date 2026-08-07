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
  reload: (url?: string) => Promise<void>;
}

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
      try {
        const fallbackData = await loadHotspotData("/data/best_per_hotspot.csv");
        setHotspots(fallbackData);
        setLoading(false);
        return;
      } catch (fallbackErr) {
        // Fallback failed
      }
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
      hotspots.filter(
        (h) => h.globalRank !== undefined && h.globalRank <= TOP_TIER_RANK_THRESHOLD,
      ),
    [hotspots],
  );

  return { hotspots, topTierHotspots, loading, error, reload };
}