import axios, { AxiosError } from 'axios';
import { mock } from '../mocks/handlers';
import type {
  ApiError,
  Centre,
  FarmerDetail,
  FarmerSummary,
  Hotspot,
  LoginRequest,
  LoginResponse,
  Paginated,
  PredictRequest,
  PredictResponse,
  Sample,
  SampleQuery,
  StatsSummary,
  TrendPoint,
} from '../types';
import { ENDPOINTS } from './endpoints';

export const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'true') !== 'false';

// ---------- Token store: in memory, mirrored to localStorage ----------
const TOKEN_KEY = 'dd_token';
let memoryToken: string | null = null;

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const tokenStore = {
  get(): string | null {
    if (memoryToken) return memoryToken;
    memoryToken = safeStorage()?.getItem(TOKEN_KEY) ?? null;
    return memoryToken;
  },
  set(token: string | null) {
    memoryToken = token;
    const s = safeStorage();
    if (!s) return;
    if (token) s.setItem(TOKEN_KEY, token);
    else s.removeItem(TOKEN_KEY);
  },
};

// ---------- Axios instance ----------
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  timeout: 30_000,
});

http.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized: (() => void) | null = null;
/** AuthContext registers a callback so a 401 from the backend logs the user out. */
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

http.interceptors.response.use(
  (r) => r,
  (err: AxiosError<{ message?: string; detail?: string }>) => {
    if (err.response?.status === 401) onUnauthorized?.();
    return Promise.reject(err);
  },
);

/** Normalises axios errors, mock errors and anything else into a user-facing message. */
export function toApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; detail?: string } | undefined;
    return {
      status: err.response?.status,
      message:
        data?.message ??
        data?.detail ??
        (err.code === 'ECONNABORTED' ? 'The server took too long to respond.' : err.response ? `Request failed (${err.response.status}).` : 'Cannot reach the server. Check your connection.'),
    };
  }
  if (err instanceof Error) return { message: err.message, status: (err as { status?: number }).status };
  return { message: 'Something went wrong.' };
}

// ---------- Typed API ----------
const real = {
  login: (body: LoginRequest) =>
    http.post<LoginResponse>(ENDPOINTS.login, { email: body.email, password: body.password }).then((r) => r.data),
  predict: ({ image, farmer_id, centre_id }: PredictRequest) => {
    const form = new FormData();
    form.append('image', image);
    form.append('farmer_id', farmer_id);
    form.append('centre_id', centre_id);
    return http.post<PredictResponse>(ENDPOINTS.predict, form).then((r) => r.data);
  },
  confirmSample: (id: string) => http.post<Sample>(ENDPOINTS.confirmSample(id)).then((r) => r.data),
  listSamples: (q: SampleQuery) => http.get<Paginated<Sample>>(ENDPOINTS.samples, { params: q }).then((r) => r.data),
  getSample: (id: string) => http.get<Sample>(ENDPOINTS.sample(id)).then((r) => r.data),
  listFarmers: () => http.get<FarmerSummary[]>(ENDPOINTS.farmers).then((r) => r.data),
  getFarmer: (id: string) => http.get<FarmerDetail>(ENDPOINTS.farmer(id)).then((r) => r.data),
  listCentres: () => http.get<Centre[]>(ENDPOINTS.centres).then((r) => r.data),
  statsSummary: () => http.get<StatsSummary>(ENDPOINTS.statsSummary).then((r) => r.data),
  statsTrends: (days = 30) => http.get<TrendPoint[]>(ENDPOINTS.statsTrends, { params: { days } }).then((r) => r.data),
  statsHotspots: () => http.get<Hotspot[]>(ENDPOINTS.statsHotspots).then((r) => r.data),
};

export type Api = typeof real;

export const api: Api = USE_MOCK ? mock : real;
