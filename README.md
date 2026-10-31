# DoodhDrishti — Web

**Seeing purity in every drop.**

This is the landing page and dashboard for DoodhDrishti, Team Nexora's smartphone-based milk adulteration detector. Collection centres test milk with the phone app. Cooperatives and food safety officers use this website to track results, farmers, and hotspots.

**Tech Stack:** React 18 · Vite · TypeScript · Tailwind CSS · React Router v6 · Recharts · React-Leaflet · lucide-react · Axios · Python Backend

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure frontend environment

```bash
cp .env.example .env
```

Mock mode is enabled by default.

### 3. Start the frontend

```bash
npm run dev
```

Open the URL displayed by Vite, normally:

`http://localhost:5173`

In mock mode, the login page accepts any email and password. Pick a role from the dropdown to see how it appears in the top bar.

### Available Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite development server with HMR |
| `npm run build` | Type-check (`tsc -b`) and production build to `dist/` |
| `npm run typecheck` | Type-check only |
| `npm run preview` | Serve the production build |

---

## Environment Variables

The frontend uses the following environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Base URL of the backend API |
| `VITE_USE_MOCK` | `true` | Controls whether mock data or the real backend API is used |

### Mock Mode

When `VITE_USE_MOCK=true`, every request is served from the in-browser mock implementation in `src/mocks`.

To use the real Python backend, set:

```env
VITE_USE_MOCK=false
VITE_API_URL=http://127.0.0.1:8000
```

**Important:** Restart the frontend development server after changing environment variables.

---

## Running the Backend

The DoodhDrishti backend runs using Python. The frontend can operate independently in mock mode, but real authentication, sample records, farmer information, dashboard statistics, and other backend-dependent features require the Python server.

### 1. Prerequisites

Install the following software:

- Python 3
- Node.js and npm
- Git

Verify your installations:

```bash
python --version
node --version
npm --version
```

On systems where Python uses the `python3` command:

```bash
python3 --version
```

### 2. Backend Environment Variables

The Python backend supports the following environment variables:

| Variable | Purpose |
|---|---|
| `PORT` | Port on which the backend server listens |
| `DD_DB_FILE` | Path to the JSON database file used for storing application data |
| `DD_JWT_SECRET` | Secret key used for signing and verifying JWT authentication tokens |

Example configuration:

```env
PORT=8000
DD_DB_FILE=./db.json
DD_JWT_SECRET=replace-with-a-long-random-secret
```

These are backend environment variables. Set them in the environment used to launch Python, or in a backend environment file if the server is configured to load one.

**Security note:**
- Use a strong, randomly generated JWT secret.
- Never commit real secrets or private credentials to GitHub.
- Keep local environment files out of version control.

### 3. Start the Backend Server

Open a terminal in the project root directory.

Run:

```bash
python3 server/main.py
```

On Windows, if `python3` is not recognized, use:

```powershell
python server/main.py
```

The default frontend backend URL is:

```text
http://127.0.0.1:8000
```

Keep the backend terminal running while using the application.

### 4. Configure the Frontend to Use the Real Backend

By default, the frontend uses mock data. To connect it to the actual Python backend, create or update the `.env` file in the frontend project root.

Add:

```env
VITE_USE_MOCK=false
VITE_API_URL=http://127.0.0.1:8000
```

**What these settings do:**

- `VITE_USE_MOCK=false` disables mock API responses.
- `VITE_API_URL=http://127.0.0.1:8000` tells the frontend where the Python backend is running.

**Important:** If you change `.env`, stop and restart the Vite development server. Vite reads environment variables when it starts.

### 5. Start the Frontend

Open a second terminal in the project root.

Run:

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

`src/mocks/data.ts` builds a fixed, seeded dataset:

- 12 collection centres at real Karnataka coordinates.
- 48 farmers.
- Approximately 2,300 samples spread over 45 days.

The data remains consistent on every reload, so charts do not jump around.

The verdict distribution is approximately:

- 69% Pure
- 18% Suspicious
- 13% Adulterated

`src/mocks/handlers.ts` mirrors the API contract and adds a small random delay to each response, allowing loading states to be tested.

### Mock Prediction Details

Two important details:

1. **`/predict` reads the uploaded photo.** It measures the image's brightness and yellow tint. A bright, white image comes back as purer milk, while a dim or translucent image comes back as diluted. This is a stand-in for the real model, not scientifically validated milk adulteration detection.

2. **Saved tests live in memory only.** They disappear when the page reloads.

---

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

A `401` response from the real API logs the user out and sends them back to `/login`.

---

## API Contract

All requests send:

```http
Authorization: Bearer <token>
```

once the user is logged in.

The TypeScript types are in `src/types.ts`, the typed client is in `src/api/client.ts`, and the routes are in `src/api/endpoints.ts`.

**Verdict values:**

```typescript
"pure" | "suspicious" | "adulterated"
```

**Role values:**

```typescript
"centre_operator" | "cooperative_admin" | "food_safety_officer"
```

**Dates:** ISO 8601 strings.

**Confidence:** A number from 0 to 1.

### Authentication

`POST /auth/login`

Request:

```json
{
  "email": "a@b.in",
  "password": "your-password"
}
```

Response:

```json
// request
{ "email": "a@b.in", "password": "…" }
// response
{ "token": "jwt…", "user": { "id": "u1", "name": "Priya Debnath", "email": "a@b.in", "role": "food_safety_officer", "centre_id": "c01" } }
```

### Predict

`POST /predict`

Content type: `multipart/form-data`

Fields:

- `image` — uploaded image file
- `farmer_id` — farmer identifier
- `centre_id` — collection centre identifier

Example response:

```json
{
  "verdict": "suspicious",
  "water_pct": 7.4,
  "starch_pct": 0.2,
  "confidence": 0.91,
  "sample_id": "s02314",
  "created_at": "2026-10-22T06:12:00Z"
}
```

### Confirm Sample

`POST /samples/:id/confirm` → `Sample`

**Important:** This endpoint was not included in the original API contract. The frontend added it so the **Save to record** button has an endpoint to call.

The frontend and backend teams need to agree on this endpoint or confirm that `/predict` already saves the sample. If `/predict` already saves it, the additional confirmation call may not be necessary.

### Samples

`GET /samples?from=YYYY-MM-DD&to=YYYY-MM-DD&centre_id=&verdict=&q=&page=1&page_size=15`

Response:

```json
{
  "items": [],
  "total": 0
}
```

`page_size=0` means return every matching record. CSV export uses it.

`GET /samples/:id` → `Sample`

Sample interface:

```typescript
interface Sample {
  id: string;
  farmer_id: string;
  farmer_name: string;
  centre_id: string;
  centre_name: string;
  water_pct: number;
  starch_pct: number;
  verdict: Verdict;
  confidence: number;
  image_url: string | null;
  created_at: string;
}
```

### Farmers

`GET /farmers` → `FarmerSummary[]`

Example structure:

```typescript
{
  id: string;
  name: string;
  village: string;
  centre_id: string;
  phone?: string;
  total_samples: number;
  pure_pct: number;
  last_test_at: string;
  trend: number[];
}
```

`trend` contains recent water percentages, oldest first.

`GET /farmers/:id` → `FarmerSummary & { centre_name: string; samples: Sample[] }`

The farmer's samples are returned newest first.

### Centres

`GET /centres`

Response:

```json
[
  {
    "id": "c01",
    "name": "Example Centre",
    "district": "Example District",
    "lat": 15.0,
    "lng": 76.0,
    "active": true
  }
]
```

### Stats

`GET /stats/summary`

Response structure:

```typescript
{
  samples_today: number;
  adulterated_pct: number;
  avg_water_pct: number;
  active_centres: number;
  recent: Sample[];
  water_by_centre: {
    centre_id: string;
    centre_name: string;
    avg_water_pct: number;
  }[];
}
```

`recent` contains the latest 10 samples.

`water_by_centre` contains average water percentages over the last 30 days.

`GET /stats/trends?days=30`

Response:

```typescript
{
  date: "YYYY-MM-DD";
  tested: number;
  adulterated: number;
}[]
```

`GET /stats/hotspots`

Response:

```typescript
{
  centre_id: string;
  centre_name: string;
  district: string;
  lat: number;
  lng: number;
  total_samples: number;
  adulterated_pct: number;
  avg_water_pct: number;
}[]
```

### Errors

For non-2xx responses, the frontend reads:

```json
{
  "message": "Error description"
}
```

or FastAPI-style:

```json
{
  "detail": "Error description"
}
```

If neither is present, the frontend falls back to a generic error message.

---

## Verdict Thresholds (Mock and UI Copy)

| Verdict | Rule |
|---|---|
| Pure | Water < 5% and starch < 0.6% |
| Suspicious | Water 5–12% or starch 0.6–1.5% |
| Adulterated | Water ≥ 12% or starch ≥ 1.5% |

In production, these values should come from the validated model or backend.

The mock verdict rules can be changed in `verdictFor()` inside `src/mocks/data.ts`.

**Important:** These thresholds and image-based mock predictions are for demonstration purposes. They should not be represented as scientifically validated milk testing.

---

## Project Structure

```text
doodhdrishti-web/
│
├── server/
│   └── main.py
│
├── src/
│   ├── api/
│   │   ├── client.ts
│   │   └── endpoints.ts
│   │
│   ├── mocks/
│   │   ├── data.ts
│   │   └── handlers.ts
│   │
│   ├── types.ts
│   │
│   ├── context/
│   │   └── AuthContext.tsx
│   │
│   ├── hooks/
│   │   ├── useAsync
│   │   ├── useDebounce
│   │   └── useMediaQuery
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout
│   │   │   ├── Sidebar
│   │   │   ├── Topbar
│   │   │   └── ProtectedRoute
│   │   │
│   │   ├── ui/
│   │   │   ├── Card
│   │   │   ├── Button
│   │   │   ├── Field
│   │   │   ├── Drawer
│   │   │   ├── VerdictBadge
│   │   │   ├── ConfidenceBar
│   │   │   ├── States
│   │   │   ├── Logo
│   │   │   └── PageHeader
│   │   │
│   │   ├── charts/
│   │   │   ├── TrendChart
│   │   │   ├── WaterByCentreChart
│   │   │   ├── Sparkline
│   │   │   ├── ChartTooltip
│   │   │   └── theme
│   │   │
│   │   ├── SamplesTable.tsx
│   │   └── SampleDetail.tsx
│   │
│   └── pages/
│       ├── Landing
│       ├── Login
│       ├── Dashboard
│       ├── TestSample
│       ├── Samples
│       ├── Farmers
│       ├── FarmerDetail
│       ├── HotspotMap
│       └── Settings
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Notes

### Branding

- Navy: `#2F2B6E`
- Purple: `#7F79B6`
- Saffron: `#E88A1A`
- Lavender: `#ECEBF7`

Headings use Spectral and body text uses Inter.

The design tokens are in `tailwind.config.js`.

### Charts

Charts use a slightly more saturated violet (`#5B54B0`) and red (`#DC2626`).

Plain brand purple looks grey as a line colour. This pair passes contrast and colour-blind separation checks.

### Map Tiles

Map tiles come from OpenStreetMap.

Before production use, switch to a tile provider with an API key.

### Profile Edits and Language Choice

Profile edits and language preferences are saved in the browser because the current API contract does not include a profile endpoint.

### Development and Production

- Use mock mode for frontend development and UI demonstrations.
- Use the Python backend for API integration testing.
- Keep secrets out of Git.
- Do not treat simulated prediction results as validated scientific results.

---

**DoodhDrishti — Seeing purity in every drop.**

**A Team Nexora Project.**
