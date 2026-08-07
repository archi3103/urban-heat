// "use client";

// import L from "leaflet";
// import { Marker, Popup } from "react-leaflet";
// import { HotspotPopupContent } from "@/components/map/markers/HotspotPopupContent";
// import type { GSOEHotspot } from "@/types/hotspot";

// /** Neon glow tier colors based on global rank */
// function glowColor(rank: number): string {
//   if (rank <= 3) return "#ef4444";
//   if (rank <= 7) return "#f97316";
//   return "#fbbf24";
// }

// function createNeonPinIcon(rank: number): L.DivIcon {
//   const color = glowColor(rank);
//   const size = rank <= 3 ? 28 : rank <= 7 ? 24 : 20;
//   const pulse = rank <= 3;

//   return L.divIcon({
//     className: "tapas-hotspot-marker",
//     html: `
//       <div class="tapas-pin-wrapper" style="--pin-color: ${color}; --pin-size: ${size}px">
//         ${pulse ? '<span class="tapas-pin-pulse"></span>' : ""}
//         <span class="tapas-pin-core"></span>
//         <span class="tapas-pin-tip"></span>
//       </div>
//     `,
//     iconSize: [size, size + 8],
//     iconAnchor: [size / 2, size + 6],
//     popupAnchor: [0, -(size + 4)],
//   });
// }

// interface HotspotMarkerProps {
//   hotspot: GSOEHotspot;
// }

// /**
//  * Glowing neon pin for top-tier UHI hotspots.
//  * Opens a tactical popup card on click.
//  */
// export function HotspotMarker({ hotspot }: HotspotMarkerProps) {
//   const icon = createNeonPinIcon(hotspot.globalRank);

//   return (
//     <Marker
//       position={[hotspot.lat, hotspot.lon]}
//       icon={icon}
//       zIndexOffset={1000 - hotspot.globalRank}
//     >
//       <Popup
//         className="tapas-hotspot-popup"
//         closeButton
//         minWidth={300}
//         maxWidth={320}
//       >
//         <HotspotPopupContent hotspot={hotspot} />
//       </Popup>
//     </Marker>
//   );
// }




"use client";

import L from "leaflet";
import { Marker, Popup } from "react-leaflet";
import { HotspotPopupContent } from "@/components/map/markers/HotspotPopupContent";
import type { GSOEHotspot } from "@/types/hotspot";

/** Neon glow tier colors based on global rank */
function glowColor(rank: number): string {
  if (rank <= 3) return "#ef4444";  // Red (Top 3)
  if (rank <= 15) return "#f97316"; // Orange (Top 15)
  if (rank <= 50) return "#fbbf24"; // Yellow (Mid tier)
  return "#38bdf8";                 // Blue/Cyan (Lower tier)
}

function createNeonPinIcon(rank: number, isSelected: boolean): L.DivIcon {
  const color = isSelected ? "#8be9fd" : glowColor(rank);
  const size = isSelected ? 28 : (rank <= 3 ? 24 : rank <= 15 ? 18 : 12);
  const pulse = rank <= 3 || isSelected;

  return L.divIcon({
    className: `tapas-hotspot-marker${isSelected ? " selected-pin" : ""}`,
    html: `
      <div class="tapas-pin-wrapper" style="--pin-color: ${color}; --pin-size: ${size}px; filter: drop-shadow(0 0 ${isSelected ? "8px" : "4px"} ${color})">
        ${pulse ? '<span class="tapas-pin-pulse"></span>' : ""}
        <span class="tapas-pin-core"></span>
        <span class="tapas-pin-tip"></span>
      </div>
    `,
    iconSize: [size, size + 6],
    iconAnchor: [size / 2, size + 4],
    popupAnchor: [0, -(size + 2)],
  });
}

interface HotspotMarkerProps {
  hotspot: GSOEHotspot;
  isSelected?: boolean;
  onSelect?: () => void;
}

/**
 * Glowing neon pin for UHI hotspots.
 * Opens a tactical popup card on click.
 */
export function HotspotMarker({ hotspot, isSelected = false, onSelect }: HotspotMarkerProps) {
  const icon = createNeonPinIcon(hotspot.globalRank, isSelected);

  return (
    <Marker
      position={[hotspot.lat, hotspot.lon]}
      icon={icon}
      zIndexOffset={isSelected ? 9999 : 1000 - hotspot.globalRank}
      eventHandlers={{
        click: () => {
          if (onSelect) onSelect();
        },
      }}
    >
      <Popup
        className="tapas-hotspot-popup"
        closeButton
        minWidth={300}
        maxWidth={320}
      >
        <HotspotPopupContent hotspot={hotspot} />
      </Popup>
    </Marker>
  );
}