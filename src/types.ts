// ---------- Domain ----------

export type Verdict = 'pure' | 'suspicious' | 'adulterated';

export type Role = 'centre_operator' | 'cooperative_admin' | 'food_safety_officer';

export const ROLE_LABELS: Record<Role, string> = {
  centre_operator: 'Centre operator',
  cooperative_admin: 'Cooperative admin',
  food_safety_officer: 'Food safety officer',
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  centre_id?: string;
}

export interface Centre {
  id: string;
  name: string;
  district: string;
  lat: number;
  lng: number;
  active: boolean;
}

export interface Farmer {
  id: string;
  name: string;
  village: string;
  centre_id: string;
  phone?: string;
}

export interface FarmerSummary extends Farmer {
  total_samples: number;
  pure_pct: number;
  last_test_at: string | null;
  /** Recent water % readings, oldest first — used for sparklines. */
  trend: number[];
}

export interface FarmerDetail extends FarmerSummary {
  centre_name: string;
  samples: Sample[];
}

export interface Sample {
  id: string;
  farmer_id: string;
  farmer_name: string;
  centre_id: string;
  centre_name: string;
  water_pct: number;
  starch_pct: number;
  verdict: Verdict;
  /** 0–1 */
  confidence: number;
  image_url: string | null;
  created_at: string;
  /** Set for samples tested after milk type was added; older samples don't have it. */
  milk_type?: MilkType;
}

// ---------- API payloads ----------

export interface LoginRequest {
  email: string;
  password: string;
  /** Role picked on the login page. Optional; the backend may ignore it once accounts carry their own role. */
  role?: Role;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export type MilkType = 'cow' | 'buffalo' | 'mixed';

export const MILK_TYPE_LABELS: Record<MilkType, string> = {
  cow: 'Cow',
  buffalo: 'Buffalo',
  mixed: 'Mixed',
};

export interface PredictRequest {
  image: File;
  farmer_id: string;
  centre_id: string;
  /** Optional; backends that don't use it ignore the extra form field. */
  milk_type?: MilkType;
}

export interface PredictResponse {
  verdict: Verdict;
  water_pct: number;
  starch_pct: number;
  confidence: number;
  sample_id: string;
  created_at: string;
}

export interface SampleQuery {
  from?: string;
  to?: string;
  centre_id?: string;
  verdict?: Verdict;
  q?: string;
  page?: number;
  page_size?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
}

export interface StatsSummary {
  samples_today: number;
  adulterated_pct: number;
  avg_water_pct: number;
  active_centres: number;
  recent: Sample[];
  water_by_centre: { centre_id: string; centre_name: string; avg_water_pct: number }[];
}

export interface TrendPoint {
  date: string; // YYYY-MM-DD
  tested: number;
  adulterated: number;
}

export interface Hotspot {
  centre_id: string;
  centre_name: string;
  district: string;
  lat: number;
  lng: number;
  total_samples: number;
  adulterated_pct: number;
  avg_water_pct: number;
}

export interface ApiError {
  message: string;
  status?: number;
}
