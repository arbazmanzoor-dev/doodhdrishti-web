/** Backend route table. Keep in sync with the API contract in README.md. */
export const ENDPOINTS = {
  login: '/auth/login',
  predict: '/predict',
  samples: '/samples',
  sample: (id: string) => `/samples/${encodeURIComponent(id)}`,
  confirmSample: (id: string) => `/samples/${encodeURIComponent(id)}/confirm`,
  farmers: '/farmers',
  farmer: (id: string) => `/farmers/${encodeURIComponent(id)}`,
  centres: '/centres',
  statsSummary: '/stats/summary',
  statsTrends: '/stats/trends',
  statsHotspots: '/stats/hotspots',
} as const;
