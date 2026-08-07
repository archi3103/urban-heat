# TAPAS — Urban Heat Mitigation Engine

Civic-tech web dashboard for urban heat island (UHI) mitigation planning. Built with **Next.js 16**, **React 19**, **TypeScript**, and **Tailwind CSS v4**.

## Quick Start

```bash
cd tapas-dashboard
npm install   # already done if scaffolded via create-next-app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
tapas-dashboard/
├── src/
│   ├── app/
│   │   ├── globals.css          # Design tokens & dark theme
│   │   ├── layout.tsx           # Root layout & metadata
│   │   └── page.tsx             # Dashboard entry point
│   ├── components/
│   │   ├── layout/
│   │   │   ├── DashboardLayout.tsx   # Main shell orchestrator
│   │   │   ├── TopNav.tsx            # Brand + live status bar
│   │   │   └── DiagnosticsDrawer.tsx # Bottom analytics drawer
│   │   ├── map/
│   │   │   └── MapPanel.tsx          # Map viewport (mount Leaflet/Mapbox here)
│   │   ├── sidebar/
│   │   │   ├── InterventionSidebar.tsx
│   │   │   └── InterventionSlider.tsx
│   │   ├── diagnostics/
│   │   │   ├── UrbanDiagnostics.tsx  # Metric cards
│   │   │   └── ParetoAnalytics.tsx   # Trade-off chart placeholder
│   │   └── ui/
│   │       ├── StatusIndicator.tsx
│   │       └── PanelHeader.tsx
│   ├── hooks/
│   │   └── useInterventionState.ts   # Shared slider state
│   ├── lib/
│   │   └── constants.ts              # Config & placeholder data
│   └── types/
│       └── index.ts                  # Shared TypeScript types
├── public/
└── package.json
```

## Layout Overview

| Region | Component | Purpose |
|--------|-----------|---------|
| Top bar | `TopNav` | Title, model/data/region status indicators |
| Center | `MapPanel` | Interactive thermal map (`.map-container`) |
| Right | `InterventionSidebar` | Collapsible albedo, NDVI, waste heat sliders |
| Bottom | `DiagnosticsDrawer` | Urban metrics + Pareto frontier analytics |

## Map Integration (react-leaflet)

The central map reads GSOE hotspot data from `public/data/best_per_hotspot.csv`.

### CSV Schema (`best_per_hotspot.csv`)

| Column | Description |
|--------|-------------|
| `grid_id` | Target grid ID (e.g. `HOTSPOT_726764`) |
| `global_rank` | Global hotspot rank (lower = hotter priority) |
| `lat`, `lon` | WGS84 coordinates |
| `detected_lst` | Observed land surface temperature (°C) |
| `gsoe_target_lst` | GSOE optimized target LST (°C) |
| `mitigation_delta` | Cooling delta (°C, negative = improvement) |
| `tree_canopy_pct`, `cool_roof_pct`, … | Deployment strategy intervention % |
| `master_score`, `cost_efficiency`, `confidence`, `scalability` | 0–1 performance metrics |

### Swapping datasets dynamically

```tsx
const { hotspots, reload } = useHotspotData("/data/best_per_hotspot.csv");
// Later: reload("/data/new_run.csv") or reload("/data/export.json")
```

JSON array exports using the same snake_case keys are also supported.

### Map components

| File | Role |
|------|------|
| `ThermalMap.tsx` | Esri satellite base + heatmap + markers |
| `layers/ThermalHeatmapLayer.tsx` | leaflet.heat UHI overlay |
| `markers/HotspotMarker.tsx` | Neon pin + popup trigger |
| `markers/HotspotPopupContent.tsx` | Tactical GSOE popup card |
| `hooks/useHotspotData.ts` | CSV/JSON data loader |

## Next Integration Steps

1. **Charts** — Replace `ParetoAnalytics` SVG with [Recharts](https://recharts.org/) or D3.
2. **Backend** — Wire `useInterventionState` values to your GSOE/PIHDC Python pipeline via API routes; export results to `best_per_hotspot.csv`.
3. **Live data** — Replace `PLACEHOLDER_DIAGNOSTICS` with real LST/UHI outputs from `dataset/met_feat/`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
