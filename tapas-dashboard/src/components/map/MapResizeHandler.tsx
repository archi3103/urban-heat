"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

/**
 * Keeps the map sized correctly when the central panel resizes
 * (sidebar collapse, drawer toggle, window resize).
 */
export function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();

    const invalidate = () => {
      map.invalidateSize({ animate: false });
    };

    invalidate();

    const observer = new ResizeObserver(invalidate);
    observer.observe(container);

    window.addEventListener("resize", invalidate);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", invalidate);
    };
  }, [map]);

  return null;
}
