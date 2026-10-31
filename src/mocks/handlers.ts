import type {
  Centre,
  FarmerDetail,
  FarmerSummary,
  Hotspot,
  LoginRequest,
  LoginResponse,
  SignupRequest,
  Paginated,
  PredictRequest,
  PredictResponse,
  Role,
  Sample,
  SampleQuery,
  StatsSummary,
  TrendPoint,
} from '../types';
import { isValidEmail } from '../lib';
import { centres, farmers, sampleImage, samples, verdictFor } from './data';

const delay = (ms = 250 + Math.random() * 350) => new Promise((r) => setTimeout(r, ms));
const round1 = (n: number) => Math.round(n * 10) / 10;
const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const withImage = (s: Sample): Sample => ({ ...s, image_url: s.image_url ?? sampleImage(s.water_pct, s.starch_pct) });

class MockHttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// ---------- Demo accounts ----------
// Saved in this browser's localStorage. Passwords are stored only as salted SHA-256 hashes.
// This is a stand-in for the real backend's accounts, not real security.

interface MockAccount {
  id: string;
  name: string;
  role: Role;
  salt: string;
  hash: string;
}

const ACCOUNTS_KEY = 'dd_mock_accounts';
export const DEMO_ACCOUNT = { email: 'demo@doodhdrishti.in', password: 'demo1234', name: 'Demo Officer', role: 'cooperative_admin' as Role };

function randomSalt(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function loadAccounts(): Promise<Record<string, MockAccount>> {
  let accounts: Record<string, MockAccount> = {};
  try {
    accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? '{}');
  } catch {
    /* storage unavailable or corrupt: start fresh */
  }
  if (!accounts[DEMO_ACCOUNT.email]) {
    const salt = randomSalt();
    accounts[DEMO_ACCOUNT.email] = {
      id: 'u001',
      name: DEMO_ACCOUNT.name,
      role: DEMO_ACCOUNT.role,
      salt,
      hash: await hashPassword(DEMO_ACCOUNT.password, salt),
    };
    saveAccounts(accounts);
  }
  return accounts;
}

function saveAccounts(accounts: Record<string, MockAccount>) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    /* storage unavailable: accounts last for this page load only */
  }
}

function sessionFor(email: string, a: MockAccount): LoginResponse {
  return {
    token: `mock.${btoa(email)}.${Date.now()}`,
    user: { id: a.id, name: a.name, email, role: a.role, centre_id: 'c01' },
  };
}

// Predictions waiting for "Save to record".
const pending = new Map<string, Sample>();
let nextId = samples.length + 1;

/**
 * Rough stand-in for the real model: reads the photo's pixels. Brighter, more opaque
 * (whiter) images read as purer milk; dim / translucent ones read as diluted.
 */
/** Otsu's threshold over the gray values whose index passes `include`. */
function otsu(gray: Float32Array, include: (i: number) => boolean): number {
  const hist = new Array<number>(256).fill(0);
  let total = 0;
  for (let i = 0; i < gray.length; i++) {
    if (!include(i)) continue;
    hist[Math.min(255, Math.max(0, Math.round(gray[i])))]++;
    total++;
  }
  if (total === 0) return 255;
  let sumAll = 0;
  for (let v = 0; v < 256; v++) sumAll += v * hist[v];
  let sumB = 0;
  let wB = 0;
  let best = 0;
  let threshold = 0;
  for (let v = 0; v < 256; v++) {
    wB += hist[v];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += v * hist[v];
    const between = wB * wF * (sumB / wB - (sumAll - sumB) / wF) ** 2;
    if (between > best) {
      best = between;
      threshold = v;
    }
  }
  return threshold;
}

async function analyseImage(file: File): Promise<{ water: number; starch: number; confidence: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new MockHttpError(422, 'Could not read this image. Try a clear JPG or PNG photo.'));
      el.src = url;
    });
    const scale = 200 / Math.max(img.naturalWidth, img.naturalHeight);
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new MockHttpError(500, 'Image analysis is not supported in this browser.');
    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);

    const n = w * h;
    const gray = new Float32Array(n);
    for (let i = 0; i < n; i++) gray[i] = 0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2];

    // Same idea as the ML pipeline's ROI step: threshold the lit cup off the black
    // background, then the brighter milk surface off the cup walls.
    const t1 = otsu(gray, () => true);
    const t2 = otsu(gray, (i) => gray[i] > t1);
    const milk: number[] = [];
    for (let i = 0; i < n; i++) if (gray[i] > t1 && gray[i] > t2) milk.push(i);
    if (milk.length < n * 0.01) {
      throw new MockHttpError(422, "Couldn't find the milk in this photo. Take it from above, flash on, on a dark background.");
    }

    // Inner circle around the milk's centre (70% of its equivalent radius), to skip the meniscus edge.
    let cx = 0;
    let cy = 0;
    for (const i of milk) {
      cx += i % w;
      cy += Math.floor(i / w);
    }
    cx /= milk.length;
    cy /= milk.length;
    const r = Math.sqrt(milk.length / Math.PI) * 0.7;
    let roi = milk.filter((i) => (i % w - cx) ** 2 + (Math.floor(i / w) - cy) ** 2 <= r * r);
    if (roi.length < 30) roi = milk;

    // Drop the brightest 1% (glare, bubbles).
    const sorted = roi.map((i) => gray[i]).sort((a, b) => a - b);
    const glare = sorted[Math.floor(sorted.length * 0.99)];
    roi = roi.filter((i) => gray[i] <= glare);

    const brightness = roi.reduce((s, i) => s + gray[i], 0) / roi.length / 255; // 0..1
    // A dark or flat photo has no bright milk surface; the thresholds above then
    // just pick the least-dark pixels. Don't turn that into a reading.
    if (brightness < 0.3) {
      throw new MockHttpError(422, "Couldn't find the milk in this photo. Take it from above, flash on, on a dark background.");
    }
    // Pure milk photographed this way measures about 0.82-0.96. Watered milk lets the
    // black background show through, so it reads darker. Rough rule, not a trained model.
    const water = Math.min(35, Math.max(0, (0.8 - brightness) * 60));
    // Colour alone can't measure starch, so the demo doesn't pretend to.
    const starch = 0;
    const confidence = 0.6 + Math.min(0.3, Math.abs(water - 5) / 40);
    return { water: round1(water), starch, confidence: Math.round(confidence * 100) / 100 };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const mock = {
  async signup({ name, email, password, role }: SignupRequest): Promise<LoginResponse> {
    await delay();
    const cleanEmail = email.trim().toLowerCase();
    if (!name.trim()) throw new MockHttpError(400, 'Enter your full name.');
    if (!isValidEmail(cleanEmail)) throw new MockHttpError(400, 'Enter a valid email address, like name@cooperative.in.');
    if (password.length < 8) throw new MockHttpError(400, 'Password must be at least 8 characters.');
    const accounts = await loadAccounts();
    if (accounts[cleanEmail]) throw new MockHttpError(409, 'An account with this email already exists. Sign in instead.');
    const salt = randomSalt();
    const account: MockAccount = {
      id: `u${Date.now().toString(36)}`,
      name: name.trim(),
      role,
      salt,
      hash: await hashPassword(password, salt),
    };
    accounts[cleanEmail] = account;
    saveAccounts(accounts);
    return sessionFor(cleanEmail, account);
  },

  async login({ email, password }: LoginRequest): Promise<LoginResponse> {
    await delay();
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) throw new MockHttpError(400, 'Enter a valid email address, like name@cooperative.in.');
    const account = (await loadAccounts())[cleanEmail];
    if (!account) throw new MockHttpError(401, 'No account with this email. Sign up first.');
    if ((await hashPassword(password, account.salt)) !== account.hash) {
      throw new MockHttpError(401, 'Incorrect password.');
    }
    return sessionFor(cleanEmail, account);
  },

  async predict({ image, farmer_id, centre_id, milk_type }: PredictRequest): Promise<PredictResponse> {
    if (!image.type.startsWith('image/')) throw new MockHttpError(415, 'Please upload an image file (JPG or PNG).');
    const farmer = farmers.find((f) => f.id === farmer_id);
    const centre = centres.find((c) => c.id === centre_id);
    if (!farmer || !centre) throw new MockHttpError(400, 'Unknown farmer or centre.');
    const [{ water, starch, confidence }, imageUrl] = await Promise.all([
      analyseImage(image),
      new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.readAsDataURL(image);
      }),
      delay(1400),
    ]);
    const sample: Sample = {
      id: `s${String(nextId++).padStart(5, '0')}`,
      farmer_id,
      farmer_name: farmer.name,
      centre_id,
      centre_name: centre.name,
      water_pct: water,
      starch_pct: starch,
      verdict: verdictFor(water, starch),
      confidence,
      image_url: imageUrl,
      created_at: new Date().toISOString(),
      milk_type,
    };
    pending.set(sample.id, sample);
    return {
      verdict: sample.verdict,
      water_pct: water,
      starch_pct: starch,
      confidence,
      sample_id: sample.id,
      created_at: sample.created_at,
    };
  },

  async confirmSample(id: string): Promise<Sample> {
    await delay();
    const s = pending.get(id);
    if (!s) {
      const existing = samples.find((x) => x.id === id);
      if (existing) return existing;
      throw new MockHttpError(404, 'Sample not found.');
    }
    pending.delete(id);
    samples.unshift(s);
    return s;
  },

  async listSamples(q: SampleQuery): Promise<Paginated<Sample>> {
    await delay();
    const page = q.page ?? 1;
    const size = q.page_size ?? 15;
    const term = q.q?.trim().toLowerCase();
    const filtered = samples.filter((s) => {
      const day = dayKey(s.created_at);
      if (q.from && day < q.from) return false;
      if (q.to && day > q.to) return false;
      if (q.centre_id && s.centre_id !== q.centre_id) return false;
      if (q.verdict && s.verdict !== q.verdict) return false;
      if (term && !s.farmer_name.toLowerCase().includes(term) && !s.farmer_id.includes(term)) return false;
      return true;
    });
    // page_size <= 0 means "everything" (used by CSV export).
    const items = size > 0 ? filtered.slice((page - 1) * size, page * size) : filtered;
    return { items: items.map(withImage), total: filtered.length };
  },

  async getSample(id: string): Promise<Sample> {
    await delay();
    const s = samples.find((x) => x.id === id) ?? pending.get(id);
    if (!s) throw new MockHttpError(404, 'Sample not found.');
    return withImage(s);
  },

  async listFarmers(): Promise<FarmerSummary[]> {
    await delay();
    return farmers.map((f) => summarise(f.id)!);
  },

  async getFarmer(id: string): Promise<FarmerDetail> {
    await delay();
    const summary = summarise(id);
    if (!summary) throw new MockHttpError(404, 'Farmer not found.');
    return {
      ...summary,
      centre_name: centres.find((c) => c.id === summary.centre_id)?.name ?? '—',
      samples: samples.filter((s) => s.farmer_id === id).map(withImage),
    };
  },

  async listCentres(): Promise<Centre[]> {
    await delay();
    return centres;
  },

  async statsSummary(): Promise<StatsSummary> {
    await delay();
    const today = dayKey(new Date().toISOString());
    const todays = samples.filter((s) => dayKey(s.created_at) === today);
    const basis = todays.length ? todays : samples.slice(0, 50);
    const adult = basis.filter((s) => s.verdict === 'adulterated').length;
    const avgWater = basis.reduce((a, s) => a + s.water_pct, 0) / (basis.length || 1);
    const last30 = samples.filter((s) => Date.now() - new Date(s.created_at).getTime() < 30 * 86_400_000);
    return {
      samples_today: todays.length,
      adulterated_pct: round1((adult / (basis.length || 1)) * 100),
      avg_water_pct: round1(avgWater),
      active_centres: centres.filter((c) => c.active).length,
      recent: samples.slice(0, 10).map(withImage),
      water_by_centre: centres.map((c) => {
        const cs = last30.filter((s) => s.centre_id === c.id);
        return {
          centre_id: c.id,
          centre_name: c.name,
          avg_water_pct: round1(cs.reduce((a, s) => a + s.water_pct, 0) / (cs.length || 1)),
        };
      }),
    };
  },

  async statsTrends(days = 30): Promise<TrendPoint[]> {
    await delay();
    const buckets = new Map<string, TrendPoint>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = dayKey(d.toISOString());
      buckets.set(k, { date: k, tested: 0, adulterated: 0 });
    }
    for (const s of samples) {
      const b = buckets.get(dayKey(s.created_at));
      if (!b) continue;
      b.tested++;
      if (s.verdict === 'adulterated') b.adulterated++;
    }
    return [...buckets.values()];
  },

  async statsHotspots(): Promise<Hotspot[]> {
    await delay();
    return centres.map((c) => {
      const cs = samples.filter((s) => s.centre_id === c.id);
      const adult = cs.filter((s) => s.verdict === 'adulterated').length;
      return {
        centre_id: c.id,
        centre_name: c.name,
        district: c.district,
        lat: c.lat,
        lng: c.lng,
        total_samples: cs.length,
        adulterated_pct: round1((adult / (cs.length || 1)) * 100),
        avg_water_pct: round1(cs.reduce((a, s) => a + s.water_pct, 0) / (cs.length || 1)),
      };
    });
  },
};

function summarise(farmerId: string): FarmerSummary | null {
  const f = farmers.find((x) => x.id === farmerId);
  if (!f) return null;
  const fs = samples.filter((s) => s.farmer_id === farmerId); // newest first
  const pure = fs.filter((s) => s.verdict === 'pure').length;
  return {
    ...f,
    total_samples: fs.length,
    pure_pct: round1((pure / (fs.length || 1)) * 100),
    last_test_at: fs[0]?.created_at ?? null,
    trend: fs.slice(0, 12).reverse().map((s) => s.water_pct),
  };
}
