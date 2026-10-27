"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { loadHotspotData } from "@/lib/parseHotspotData";
import { DEMO_HOTSPOTS } from "@/lib/demoHotspots";
import {
  TOP_TIER_RANK_THRESHOLD,
  type GSOEHotspot,
} from "@/types/hotspot";

interface UseHotspotDataResult {
  hotspots: GSOEHotspot[];
  topTierHotspots: GSOEHotspot[];
  loading: boolean;
  error: string | null;
  isDemoData: boolean;
  reload: (url?: string) => Promise<void>;
}

export function useHotspotData(sourceUrl?: string): UseHotspotDataResult {
  const [hotspots, setHotspots] = useState<GSOEHotspot[]>(DEMO_HOTSPOTS);
  const [loading, setLoading] = useState(Boolean(sourceUrl));
  const [error, setError] = useState<string | null>(null);
  const [isDemoData, setIsDemoData] = useState(!sourceUrl);

  const reload = useCallback(async (url?: string) => {
    const target = url ?? sourceUrl;
    if (!target) {
      setHotspots(DEMO_HOTSPOTS);
      setIsDemoData(true);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await loadHotspotData(target);
      setHotspots(data);
      setIsDemoData(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load hotspot data";
      setError(message);
      setHotspots([]);
      setIsDemoData(false);
    } finally {
      setLoading(false);
    }
  }, [sourceUrl]);

  useEffect(() => {
    if (!sourceUrl) return;

    let cancelled = false;
    loadHotspotData(sourceUrl)
      .then((data) => {
        if (cancelled) return;
        setHotspots(data);
        setIsDemoData(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load hotspot data");
        setHotspots([]);
        setIsDemoData(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sourceUrl]);

  const topTierHotspots = useMemo(
    () =>
      hotspots.filter(
        (h) => h.globalRank !== undefined && h.globalRank <= TOP_TIER_RANK_THRESHOLD,
      ),
    [hotspots],
  );

  return { hotspots, topTierHotspots, loading, error, isDemoData, reload };
}