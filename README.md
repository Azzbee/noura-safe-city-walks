# Noura

Safe walking routes for women in Paris. Instead of only the fastest path,
Noura shows the fastest, balanced and safest routes side by side, scored on
street lighting, police proximity, foot traffic, safe landmarks and time of day,
and stays with you on the walk: live location sharing, check-ins, SOS, a fake
incoming call and alerts near reported incidents.

This repository is the app (React, Vite, TypeScript, Leaflet, Supabase,
Capacitor for iOS). The safety routing engine lives in
[noura-backend](https://github.com/Azzbee/noura-backend).

## Features

- **Safety-weighted routing**: fastest / balanced / safest with distance, time
  and a safety score, plus "Explain this route"
- **Personal preferences**: rate lighting, police, busy streets, CCTV and safe
  landmarks once; every route is weighted by your answers
- **Time of day**: day, evening, night and late night change scores and zones
- **Safety layer**: commissariats, hospitals, metro hubs, lit areas, 24h
  pharmacies, caution and danger zones, crime-alert heatmap
- **Journey mode**: live tracking, check-ins ("I'm safe" / "Need help"),
  proximity alerts, battery and weather warnings
- **Emergency**: one-tap SOS (police 17, SAMU 15, fire 18, 112) that also
  notifies your emergency contacts with a live tracking link; voice safe word
  and shake-to-SOS on supported devices
- **Fake call**: an incoming call from a contact you choose, now or on a timer
- **Community**: crowd-sourced safety reports with voting
- **Safe zones**: arrival and departure notifications for places like home

## Run it

```sh
npm install
npm run dev            # http://localhost:8080
```

Environment (`.env`):

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Auth and data |
| `VITE_ROUTING_API_URL` | noura-backend URL. Without it the app uses OSRM walking routes with estimated scores |
| `VITE_CARTO_API_KEY` | Free CARTO basemaps key ([carto.com/basemaps/apikey](https://carto.com/basemaps/apikey)). Required since autumn 2026: without it the map shows "API KEY REQUIRED" |
| `VITE_MAP_TILE_URL` | Optional full tile URL template (overrides the CARTO default) |
| `VITE_DEMO_MODE` | `true` runs without Supabase (see below) |

### Demo mode

```sh
VITE_DEMO_MODE=true npm run dev
```

Swaps the Supabase client for an in-memory stand-in
(`src/integrations/supabase/demo-client.ts`) seeded with a demo user, saved
places, emergency contacts and community reports. Nothing leaves the browser:
no account is created and no contact is messaged. Add `?demo-reset` to the URL
to start fresh. Map tiles, geocoding (Nominatim), routing and weather still
use their public services.

### With the safety routing engine

```sh
# in noura-backend
pip install -r requirements.txt
uvicorn main:app --port 8000

# here
VITE_ROUTING_API_URL=http://127.0.0.1:8000 npm run dev
```

## Stack

React 18, Vite, TypeScript, Tailwind, shadcn/ui, Framer Motion, Leaflet +
leaflet.heat, React Query, Supabase (auth, Postgres, edge functions),
Capacitor.
