# Noura -- Safe City Walks

A safety-first pedestrian routing application for Paris that calculates walking routes weighted by real-world safety factors. Instead of just finding the shortest path, Noura lets users choose how much to prioritize safety over speed, with routes adapting to time of day, street lighting, police proximity, foot traffic, and nearby safe landmarks.

Built as an IBDP Computer Science Internal Assessment.

## The Problem

Standard navigation apps optimize for the fastest route. But when walking alone -- especially at night -- the fastest route through a dark, isolated alley is not the best route. Noura gives walkers the power to choose routes that keep them on well-lit, populated streets near police stations and metro exits, with real-time SOS capabilities if something goes wrong.

## Key Features

### Safety-Weighted Routing
- Modified A* pathfinding on real OpenStreetMap walking networks via OSMnx and NetworkX
- **Tunable safety vs. speed tradeoff**: `safety_weight` parameter from 0.0 (fastest) to 1.0 (safest)
- Route comparison endpoint returning fastest, safest, and balanced routes side by side
- Per-edge safety scoring with detailed breakdown

### Multi-Factor Safety Scoring

Each road segment is scored across six dimensions:

| Factor | Data Source | Scoring Method |
|--------|------------|----------------|
| **Lighting** | OSM `lit` tag + road type inference | 0.0-1.0 based on street type; reduced at night |
| **Road Type** | OSM `highway` tag | Pedestrian zones score highest; isolated paths score lowest |
| **Foot Traffic** | Road classification + metro proximity | Higher near transit hubs; reduced at night/late night |
| **Police Proximity** | 10 precinct coordinates across Paris | Haversine distance scoring (< 200m = 0.95) |
| **Safe Landmarks** | Hospitals + metro stations | Proximity-based scoring with distance thresholds |
| **Time of Day** | User-specified (day/evening/night/late_night) | Multiplier: day=1.0, evening=0.85, night=0.70, late_night=0.55 |

Users can weight each factor from 1-5 based on personal preferences.

### SOS Emergency System
- **SOS Button**: One-tap emergency trigger during active journeys
- **Voice SOS**: Configurable safe word detection via device microphone
- **Shake SOS**: Device shake detection for hands-free emergency alerts
- Emergency contact notification with current location
- Location sharing during active journeys

### Journey Tracking
- Real-time journey monitoring with periodic check-ins
- Check-in system with pending/confirmed/missed statuses
- Journey states: planned, active, completed, cancelled, alert_triggered
- Full journey history with route replay
- Safety alert banners during navigation

### Map Features
- Leaflet-based interactive map with safety heatmap overlay
- Real-time overlays for police stations, hospitals, and metro locations
- Geofence circles for danger zone alerts
- Crowd-sourced safety reports with quick-report dialog
- Saved locations bar for frequent destinations
- Time-of-day selector for route preview at different hours

## Architecture

### Backend (FastAPI + NetworkX)

```
routing-backend/
├── app/
│   ├── main.py                      # FastAPI app factory with CORS and lifespan
│   ├── config.py                    # Pydantic settings (weights, cache, API keys)
│   ├── api/
│   │   ├── routes.py                # POST /api/route and /api/route/compare
│   │   └── health.py                # Health check with graph status
│   ├── core/
│   │   ├── routing_engine.py        # A* pathfinding with safety-weighted edges
│   │   ├── safety_weighting.py      # Multi-factor safety score calculation
│   │   └── graph_manager.py         # OSMnx graph loading with disk cache
│   ├── models/
│   │   ├── route.py                 # Pydantic models (Route, SafetyBreakdown, etc.)
│   │   └── safety_zone.py           # Safety zone definitions
│   └── data/                        # Cached graph files (.graphml)
```

### Frontend (React + Vite + Capacitor)

```
noura-safe-city-walks/
├── src/
│   ├── components/
│   │   ├── journey/                 # JourneyControls, CheckinPrompt, SOS indicators
│   │   ├── map/                     # Heatmap, SafetyScore, GeofenceCircles, overlays
│   │   ├── onboarding/              # Safety preferences setup
│   │   └── ui/                      # 40+ shadcn/ui components
│   ├── hooks/                       # 15+ custom hooks (useJourney, useSafetyScore, etc.)
│   └── pages/                       # Auth, Settings, JourneyHistory, GeofenceSettings
```

## API Reference

### `POST /api/route`

Calculate a single route between two points.

```json
{
  "start": { "lat": 48.8566, "lng": 2.3522 },
  "end": { "lat": 48.8606, "lng": 2.3376 },
  "safety_weight": 0.7,
  "time_of_day": "night",
  "preferences": {
    "lighting": 5,
    "police_stations": 3,
    "busy_areas": 4,
    "cctv_coverage": 2,
    "safe_landmarks": 3
  }
}
```

**Response** includes route geometry (GeoJSON), distance, duration, safety score (0-100), detailed breakdown, and warnings.

### `POST /api/route/compare`

Returns three routes (fastest, safest, balanced) with comparison metrics:
- Extra distance percentage for safest vs. fastest
- Extra time in seconds
- Safety score improvement

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Routing Backend** | FastAPI + Uvicorn |
| **Graph Engine** | NetworkX + OSMnx (OpenStreetMap) |
| **Graph Caching** | diskcache (1-week TTL) |
| **Frontend** | React 18 + Vite + TypeScript |
| **Map** | Leaflet + leaflet.heat (heatmaps) |
| **Mobile** | Capacitor (iOS native builds) |
| **UI** | Tailwind CSS + shadcn/ui + Radix UI |
| **Animations** | Framer Motion |
| **Data** | Supabase (Auth + Postgres) + React Query |
| **Charts** | Recharts |
| **Validation** | Zod + React Hook Form |

## Getting Started

### Backend

```bash
cd routing-backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The first request will download the Paris walking network from OpenStreetMap (cached to disk after first download).

### Frontend

```bash
cd noura-safe-city-walks
npm install
npm run dev
```

### iOS Build (via Capacitor)

```bash
npm run ios:build    # Build + copy + sync
npm run ios:open     # Open in Xcode
```

## Safety Scoring Algorithm

The edge weight for routing combines distance with a safety penalty:

```
weight = base_distance + (1 - safety_score) * base_distance * safety_weight * 2
```

When `safety_weight = 0`, the algorithm produces pure shortest-path routing. When `safety_weight = 1`, unsafe edges receive up to 2x distance penalty, causing the pathfinder to strongly prefer safer alternatives even if they are longer.

## Status

Completed -- submitted as an IBDP Computer Science Internal Assessment.
