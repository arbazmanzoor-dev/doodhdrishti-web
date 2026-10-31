
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

// =====================================================
// Configuration
// =====================================================

export const USE_MOCK =
  (import.meta.env.VITE_USE_MOCK ?? 'true').toLowerCase() !== 'false';

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'
).replace(/\/+$/, '');

const REQUEST_TIMEOUT = 10000;

// =====================================================
// Token storage
// =====================================================

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
    if (memoryToken) {
      return memoryToken;
    }

    memoryToken = safeStorage()?.getItem(TOKEN_KEY) ?? null;
    return memoryToken;
  },

  set(token: string | null): void {
    memoryToken = token;

    const storage = safeStorage();

    if (!storage) {
      return;
    }

    try {
      if (token) {
        storage.setItem(TOKEN_KEY, token);
      } else {
        storage.removeItem(TOKEN_KEY);
      }
    } catch {
      // Continue using the in-memory token if storage is unavailable.
    }
  },
};

// =====================================================
// Axios instance
// =====================================================

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    Accept: 'application/json',
  },
});

// Attach the login token to authenticated requests.
http.interceptors.request.use((config) => {
  const token = tokenStore.get();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// =====================================================
// Authentication error handling
// =====================================================

let onUnauthorized: (() => void) | null = null;

/**
 * AuthContext can register a callback to handle expired
 * or invalid authentication tokens.
 */
export function setUnauthorizedHandler(
  fn: (() => void) | null,
): void {
  onUnauthorized = fn;
}

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; detail?: string }>) => {
    if (error.response?.status === 401) {
      onUnauthorized?.();
    }

    return Promise.reject(error);
  },
);

// =====================================================
// API error formatting
// =====================================================

export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{
      message?: string;
      detail?: string;
    }>;

    const data = axiosError.response?.data;

    let message: string;

    if (data?.message || data?.detail) {
      message = data.message ?? data.detail ?? 'Request failed.';
    } else if (axiosError.code === 'ECONNABORTED') {
      message = 'The server took too long to respond.';
    } else if (axiosError.response) {
      message = `Request failed (${axiosError.response.status}).`;
    } else {
      message =
        'Cannot reach the server. Check that the backend is running.';
    }

    return {
      status: axiosError.response?.status,
      message,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      status: (error as Error & { status?: number }).status,
    };
  }

  return {
    message: 'Something went wrong.',
  };
}

// =====================================================
// Real backend API
// =====================================================

const real = {
  // POST /auth/login
  login: (body: LoginRequest) =>
    http
      .post<LoginResponse>(ENDPOINTS.login, {
        email: body.email,
        password: body.password,
        // The backend uses this until real user accounts carry their own role.
        role: body.role,
      })
      .then((response) => response.data),

  // POST /predict
  predict: ({
    image,
    farmer_id,
    centre_id,
  }: PredictRequest) => {
    const form = new FormData();

    form.append('image', image);
    form.append('farmer_id', farmer_id);
    form.append('centre_id', centre_id);

    return http
      .post<PredictResponse>(ENDPOINTS.predict, form)
      .then((response) => response.data);
  },

  // POST /samples/:id/confirm
  confirmSample: (id: string) =>
    http
      .post<Sample>(ENDPOINTS.confirmSample(id))
      .then((response) => response.data),

  // GET /samples
  listSamples: (query: SampleQuery) =>
    http
      .get<Paginated<Sample>>(ENDPOINTS.samples, {
        params: query,
      })
      .then((response) => response.data),

  // GET /samples/:id
  getSample: (id: string) =>
    http
      .get<Sample>(ENDPOINTS.sample(id))
      .then((response) => response.data),

  // GET /farmers
  listFarmers: () =>
    http
      .get<FarmerSummary[]>(ENDPOINTS.farmers)
      .then((response) => response.data),

  // GET /farmers/:id
  getFarmer: (id: string) =>
    http
      .get<FarmerDetail>(ENDPOINTS.farmer(id))
      .then((response) => response.data),

  // GET /centres
  listCentres: () =>
    http
      .get<Centre[]>(ENDPOINTS.centres)
      .then((response) => response.data),

  // GET /stats/summary
  statsSummary: () =>
    http
      .get<StatsSummary>(ENDPOINTS.statsSummary)
      .then((response) => response.data),

  // GET /stats/trends
  statsTrends: (days = 30) =>
    http
      .get<TrendPoint[]>(ENDPOINTS.statsTrends, {
        params: { days },
      })
      .then((response) => response.data),

  // GET /stats/hotspots
  statsHotspots: () =>
    http
      .get<Hotspot[]>(ENDPOINTS.statsHotspots)
      .then((response) => response.data),
};

export type Api = typeof real;

// =====================================================
// Active API selection
// =====================================================

// VITE_USE_MOCK=true  -> use local mock handlers
// VITE_USE_MOCK=false -> use the real Python backend
export const api: Api = USE_MOCK ? mock : real;
