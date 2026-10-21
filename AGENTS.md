# Okada Connect

Ride-hailing app connecting customers with nearby motorcycle (okada) riders.

Two parts live in this repository:

- `server/` — FastAPI + Postgres API (see `README.md` for the phase plan and endpoints)
- `client/` — React + Vite + Tailwind CSS frontend

## Development Servers

- Frontend: Vite on http://localhost:5173 (`npm run dev` from `client/`)
- API: FastAPI on http://localhost:4000 (`python3 main.py` from `server/`)
- Postgres on localhost:5432, database `okada_connect` (see `DATABASE_URL` in `.env`)

The Vite dev server proxies `/api` to `http://localhost:4000` (configured in `client/vite.config.ts`), so the frontend always calls same-origin `/api/...`.

## Project Structure

This is the canonical project structure. Start with task-relevant files below. Only follow imports or inspect other files when required, when a documented path is missing, or when the repository contradicts this guide.

### Frontend (`client/`)

- `client/src/main.tsx` — React entrypoint; mounts `client/src/App.tsx` inside `BrowserRouter` + `AuthProvider`
- `client/src/App.tsx` — Landing page and the route table (`/`, `/login`, `/register`, `/customer`, `/rider`)
- `client/src/pages/Login.tsx` — Sign in, owns the shared `AuthShell` layout used by register too
- `client/src/pages/Register.tsx` — Create account (customer or rider)
- `client/src/pages/CustomerDashboard.tsx` — Pickup confirmation, ride request, live ride tracking
- `client/src/pages/RiderDashboard.tsx` — Online toggle, nearby requests, accept/start/complete
- `client/src/components/Icon.tsx` — Shared inline SVG icon set
- `client/src/components/Brand.tsx` — `Logo`, `Eyebrow`, `RiderIllustration` hero artwork
- `client/src/components/RoleSwitch.tsx` — Rider/customer toggle used by login and register
- `client/src/components/MapView.tsx` — Imperative Leaflet map wrapper (markers sync by id)
- `client/src/hooks/useGeolocation.ts` — Browser GPS watcher
- `client/src/context/AuthContext.tsx` — Session state; persists the JWT
- `client/src/services/api.ts` — Typed API client for every backend endpoint
- `client/src/index.css` — Tailwind import plus global styles and component CSS
- `client/index.html` — Vite HTML shell containing the `#root` element
- `client/vite.config.ts` — Vite config: React, Tailwind CSS v4, `@` alias, `/api` proxy
- `client/package.json` — Dependencies and the dev, build, preview, and typecheck scripts

### Backend (`server/`)

- `server/main.py` — FastAPI app; registers the routers
- `server/config/db.py` — Connection pool and schema bootstrap
- `server/db/schema.sql` — Idempotent schema (runs on boot)
- `server/controllers/` — Route handlers: `auth.py`, `customers.py`, `riders.py`, `rides.py`
- `server/models/` — SQL access: `users.py`, `rides.py`
- `server/middleware/auth.py` — JWT dependency and role guards
- `server/utils/` — `security.py` (hashing, tokens), `geo.py` (haversine)
- `server/schemas.py` — Pydantic request/response models

## Dependencies

- Frontend runtime: React 18, React DOM 18, React Router 6, Leaflet + React Leaflet
- Styling: Tailwind CSS v4 with the `@tailwindcss/vite` plugin
- Build tooling: Vite 6, TypeScript 5.7, and `@vitejs/plugin-react`
- Backend: FastAPI, uvicorn, psycopg (v3) + psycopg_pool, bcrypt, PyJWT

## Styling

The frontend uses **Tailwind CSS v4** through the `@tailwindcss/vite` plugin configured in `client/vite.config.ts`. `client/src/index.css` imports Tailwind with `@import 'tailwindcss';`. Use Tailwind utility classes directly in JSX and put global CSS or Tailwind v4 theme customization in `client/src/index.css`. This project does not need a Tailwind config file or PostCSS config.

`client/src/main.tsx` imports `client/src/index.css`, so global font wiring belongs in `client/src/index.css`. Keep CSS `@import` statements first, then add any `@font-face` rules and font-family defaults there.

Tailwind emits utility classes in `@layer utilities`, and CSS outside any cascade layer overrides every layer regardless of specificity. Put global element styles, such as resets and defaults for `body`, headings, `button`, or `input`, inside `@layer base { ... }` so utility classes on those elements still apply. Tailwind's Preflight already applies `box-sizing: border-box`, removes default margins, and sets `font: inherit` on form controls, so do not repeat those rules.

## Conventions

- API responses use **camelCase** on the wire (`motorcycleNumber`), while the database uses **snake_case** (`motorcycle_number`). Conversion happens in `server/models/`.
- Ride statuses: `pending` → `accepted` → `arriving` → `in_progress` → `completed`, or `cancelled`.
- Live updates use short-interval polling (4–6s); real-time sockets are deferred to a later phase.
- A customer may have only one active ride at a time.
