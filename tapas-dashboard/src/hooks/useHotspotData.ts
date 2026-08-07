// "use client";

// import { useCallback, useEffect, useMemo, useState } from "react";
// import { loadHotspotData } from "@/lib/parseHotspotData";
// import {
//   DEFAULT_HOTSPOT_DATA_URL,
//   TOP_TIER_RANK_THRESHOLD,
//   type GSOEHotspot,
// } from "@/types/hotspot";

// interface UseHotspotDataResult {
//   hotspots: GSOEHotspot[];
//   topTierHotspots: GSOEHotspot[];
//   loading: boolean;
//   error: string | null;
//   /** Reload from a new CSV/JSON URL — enables dynamic dataset swapping */
//   reload: (url?: string) => Promise<void>;
// }

// /**
//  * Fetches and parses GSOE best_per_hotspot data.
//  * Point `sourceUrl` at any CSV/JSON matching the GSOE export schema.
//  */
// export function useHotspotData(
//   sourceUrl: string = DEFAULT_HOTSPOT_DATA_URL,
// ): UseHotspotDataResult {
//   const [hotspots, setHotspots] = useState<GSOEHotspot[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const reload = useCallback(async (url?: string) => {
//     const target = url ?? sourceUrl;
//     setLoading(true);
//     setError(null);

//     try {
//       const data = await loadHotspotData(target);
//       setHotspots(data);
//     } catch (err) {
//       if (!url && target === "/Ahmedabad_Master_Scenarios_FINAL_Sorted (1) (3).csv") {
//         try {
//           const fallbackData = await loadHotspotData("/Ahmedabad_Master_Scenarios_REAL_Density.csv");
//           setHotspots(fallbackData);
//           setLoading(false);
//           return;
//         } catch (fallbackErr) {
//           // ignore fallback error and propagate the primary error
//         }
//       }
//       const message =
//         err instanceof Error ? err.message : "Failed to load hotspot data";
//       setError(message);
//       setHotspots([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [sourceUrl]);

//   useEffect(() => {
//     reload();
//   }, [reload]);

//   const topTierHotspots = useMemo(
//     () =>
//       hotspots.filter(
//         (h) => h.globalRank !== undefined && h.globalRank <= TOP_TIER_RANK_THRESHOLD,
//       ),
//     [hotspots],
//   );

//   return { hotspots, topTierHotspots, loading, error, reload };
// }



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
      if (!url && target === "/data/best_per_hotspot.csv") {
        try {
          const fallbackData = await loadHotspotData("/data/Ahmedabad_Master_Scenarios_REAL_Density.csv");
          setHotspots(fallbackData);
          setLoading(false);
          return;
        } catch (fallbackErr) {
          // ignore fallback error and propagate the primary error
        }
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