import type {
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

// Predictions waiting for "Save to record".
const pending = new Map<string, Sample>();
let nextId = samples.length + 1;

/**
 * Rough stand-in for the real model: reads the photo's pixels. Brighter, more opaque
 * (whiter) images read as purer milk; dim / translucent ones read as diluted.
 */
async function analyseImage(file: File): Promise<{ water: number; starch: number; confidence: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new MockHttpError(422, 'Could not read this image. Try a clear JPG or PNG photo.'));
      el.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new MockHttpError(500, 'Image analysis is not supported in this browser.');
    ctx.drawImage(img, 0, 0, 64, 64);
    const { data } = ctx.getImageData(0, 0, 64, 64);
    let lum = 0;
    let yellow = 0;
    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      lum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
      yellow += (r + g) / 2 - b;
    }
    const px = data.length / 4;
    const brightness = lum / px / 255; // 0..1
    const yellowness = Math.max(0, yellow / px / 255); // starch tends to tint slightly yellow
    const water = Math.min(35, Math.max(0, (0.85 - brightness) * 40 + (Math.random() - 0.5) * 2));
    const starch = Math.min(3, Math.max(0, yellowness * 8 + (Math.random() - 0.5) * 0.2));
    const confidence = Math.min(0.99, 0.78 + Math.abs(brightness - 0.55) * 0.4 + Math.random() * 0.05);
    return { water: round1(water), starch: round1(starch), confidence: Math.round(confidence * 100) / 100 };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const mock = {
  async login({ email, role }: LoginRequest): Promise<LoginResponse> {
    await delay();
    const local = email.split('@')[0] || 'demo';
    const name = local
      .split(/[._-]/)
      .filter(Boolean)
      .map((p) => p[0].toUpperCase() + p.slice(1))
      .join(' ');
    return {
      token: `mock.${btoa(email)}.${Date.now()}`,
      user: { id: 'u001', name: name || 'Demo User', email, role: role ?? 'cooperative_admin', centre_id: 'c01' },
    };
  },

  async predict({ image, farmer_id, centre_id }: PredictRequest): Promise<PredictResponse> {
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
