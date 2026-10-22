# DoodhDrishti — Web

**Seeing purity in every drop.** This is the landing page and dashboard for DoodhDrishti, Team Nexora's smartphone-based milk adulteration detector. Collection centres test milk with the phone app. Cooperatives and food safety officers use this site to track results, farmers, and hotspots.

React 18 · Vite · TypeScript · Tailwind CSS · React Router v6 · Recharts · React-Leaflet · lucide-react · Axios

## Quick start

```bash
npm install
cp .env.example .env     # mock mode is on by default
npm run dev              # http://localhost:5173
```

In mock mode, the login page accepts any email and password. Pick a role from the dropdown to see how it shows in the top bar.

| Script              | What it does                         |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Vite dev server with HMR             |
| `npm run build`     | Type-check (`tsc -b`) + production build to `dist/` |
| `npm run typecheck` | Type-check only                      |
| `npm run preview`   | Serve the production build           |

## Environment variables

| Variable        | Default                 | Purpose |
| --------------- | ----------------------- | ------- |
| `VITE_API_URL`  | `http://localhost:8000` | Base URL of the backend API |
| `VITE_USE_MOCK` | `true`                  | `true` serves every request from the in-browser mock in `src/mocks`. Set it to `false` to call `VITE_API_URL`. |

## Mock mode

`src/mocks/data.ts` builds a fixed, seeded dataset: 12 collection centres at real Karnataka coordinates, 48 farmers, and about 2,300 samples spread over 45 days. The data comes out the same on every reload, so charts don't jump around. The verdict split is roughly 69% pure, 18% suspicious, and 13% adulterated.

`src/mocks/handlers.ts` mirrors the API contract and adds a small random delay to each response, so you can see the loading states. Two details:

- **`/predict` reads the uploaded photo.** It measures the image's brightness and yellow tint: a bright, white image comes back as purer milk, and a dim or translucent one as diluted. This is a stand-in for the real model.
- **Saved tests live in memory only.** They disappear when the page reloads.

## Pages

| Route          | Access    | Contents |
| -------------- | --------- | -------- |
| `/`            | public    | Hero, how it works, the science, impact, team, footer |
| `/login`       | public    | Email, password, role. The JWT is kept in memory and in `localStorage`. |
| `/dashboard`   | protected | KPI cards, 30-day tested-vs-adulterated trend, average water % by centre, latest 10 tests |
| `/test`        | protected | Drag-and-drop or capture a photo, pick centre and farmer, see the result card, save to record |
| `/samples`     | protected | Filters (date range, centre, verdict, farmer search), pagination, CSV export, detail drawer |
| `/farmers`     | protected | Farmer list with % pure, last test, and a water % sparkline. Sortable. |
| `/farmers/:id` | protected | Stats, quality history chart, full test table |
| `/map`         | protected | Leaflet map with markers coloured by adulteration rate and sized by volume, plus a ranked centre list |
| `/settings`    | protected | Profile, language picker (English, Hindi, Kannada; placeholder for now), connection info |

A `401` from the real API logs the user out and sends them back to `/login`.

## API contract

All requests send `Authorization: Bearer <token>` once the user is logged in. The TypeScript types are in `src/types.ts`, the typed client is in `src/api/client.ts`, and the routes are in `src/api/endpoints.ts`.

**Verdict values:** `"pure" | "suspicious" | "adulterated"`
**Role values:** `"centre_operator" | "cooperative_admin" | "food_safety_officer"`
**Dates:** ISO 8601 strings. `confidence` is a number from 0 to 1.

### Auth
`POST /auth/login`
```json
// request
{ "email": "a@b.in", "password": "…" }
// response
{ "token": "jwt…", "user": { "id": "u1", "name": "Priya Debnath", "email": "a@b.in", "role": "food_safety_officer", "centre_id": "c01" } }
```

### Predict
`POST /predict`: `multipart/form-data` with the fields `image` (file), `farmer_id`, and `centre_id`
```json
{ "verdict": "suspicious", "water_pct": 7.4, "starch_pct": 0.2, "confidence": 0.91, "sample_id": "s02314", "created_at": "2026-10-22T06:12:00Z" }
```

`POST /samples/:id/confirm` → `Sample`
> ⚠️ **This endpoint is not in the original contract.** The frontend added it so the **Save to record** button has something to call. The backend team needs to agree on it, or tell us that `/predict` already saves the sample (in which case the button can be dropped).

### Samples
`GET /samples?from=YYYY-MM-DD&to=YYYY-MM-DD&centre_id=&verdict=&q=&page=1&page_size=15` → `{ "items": Sample[], "total": number }`
`page_size=0` means "return every match". CSV export uses it.

`GET /samples/:id` → `Sample`
```ts
interface Sample {
  id: string; farmer_id: string; farmer_name: string; centre_id: string; centre_name: string;
  water_pct: number; starch_pct: number; verdict: Verdict; confidence: number;
  image_url: string | null; created_at: string;
}
```

### Farmers
`GET /farmers` → `FarmerSummary[]`
```ts
{ id, name, village, centre_id, phone?, total_samples, pure_pct, last_test_at, trend: number[] /* recent water %, oldest first */ }
```
`GET /farmers/:id` → `FarmerSummary & { centre_name: string; samples: Sample[] /* newest first */ }`

### Centres
`GET /centres` → `{ id, name, district, lat, lng, active }[]`

### Stats
`GET /stats/summary`
```ts
{ samples_today, adulterated_pct, avg_water_pct, active_centres,
  recent: Sample[] /* latest 10 */,
  water_by_centre: { centre_id, centre_name, avg_water_pct }[] /* last 30 days */ }
```
`GET /stats/trends?days=30` → `{ date: "YYYY-MM-DD", tested, adulterated }[]`
`GET /stats/hotspots` → `{ centre_id, centre_name, district, lat, lng, total_samples, adulterated_pct, avg_water_pct }[]`

### Errors
For non-2xx responses, the frontend reads `{ "message": "…" }` or FastAPI-style `{ "detail": "…" }`. If neither is present, it falls back to a generic message.

## Verdict thresholds (mock and UI copy)

| Verdict     | Rule |
| ----------- | ---- |
| Pure        | water < 5% and starch < 0.6% |
| Suspicious  | water 5–12% or starch 0.6–1.5% |
| Adulterated | water ≥ 12% or starch ≥ 1.5% |

In production these should come from the model or the backend. Change them in `verdictFor()` in `src/mocks/data.ts`.

## Project structure

```
src/
  api/          client.ts (axios + typed API + token store), endpoints.ts
  mocks/        data.ts (seeded dataset), handlers.ts (mock API)
  types.ts      all shared types
  context/      AuthContext.tsx
  hooks/        useAsync, useDebounce, useMediaQuery
  components/
    layout/     AppLayout, Sidebar, Topbar, ProtectedRoute
    ui/         Card, Button, Field, Drawer, VerdictBadge, ConfidenceBar, States, Logo, PageHeader
    charts/     TrendChart, WaterByCentreChart, Sparkline, ChartTooltip, theme
    SamplesTable.tsx, SampleDetail.tsx
  pages/        Landing, Login, Dashboard, TestSample, Samples, Farmers, FarmerDetail, HotspotMap, Settings
```

## Notes

- **Brand:** navy `#2F2B6E`, purple `#7F79B6`, saffron `#E88A1A`, lavender `#ECEBF7`. Headings use Spectral and body text uses Inter. The tokens are in `tailwind.config.js`.
- **Charts:** they use a slightly more saturated violet (`#5B54B0`) and red (`#DC2626`). Plain brand purple looks grey as a line colour. This pair passes contrast and colour-blind separation checks.
- **Map tiles:** these come from OpenStreetMap. Before production use, switch to a tile provider with an API key.
- **Profile edits and language choice:** these are saved in the browser only, because the contract has no profile endpoint yet.
