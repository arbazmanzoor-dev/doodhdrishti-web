import type { Centre, Farmer, Sample, Verdict } from '../types';

/** Small seeded PRNG (mulberry32) so mock data is identical on every reload. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261022);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const round1 = (n: number) => Math.round(n * 10) / 10;

export function verdictFor(water: number, starch: number): Verdict {
  if (water >= 12 || starch >= 1.5) return 'adulterated';
  if (water >= 5 || starch >= 0.6) return 'suspicious';
  return 'pure';
}

// ---------- Centres (Karnataka) ----------
// `risk` biases how diluted milk at this centre tends to be, so the hotspot map has variety.
const CENTRE_SEED: (Omit<Centre, 'active'> & { risk: number })[] = [
  { id: 'c01', name: 'Mandya Milk Union – Maddur', district: 'Mandya', lat: 12.5847, lng: 77.0435, risk: 0.15 },
  { id: 'c02', name: 'Mysuru Dairy – Nanjangud', district: 'Mysuru', lat: 12.1203, lng: 76.6828, risk: 0.1 },
  { id: 'c03', name: 'Hassan Co-op – Arsikere', district: 'Hassan', lat: 13.3139, lng: 76.2569, risk: 0.35 },
  { id: 'c04', name: 'Tumakuru Union – Tiptur', district: 'Tumakuru', lat: 13.2569, lng: 76.4776, risk: 0.45 },
  { id: 'c05', name: 'Kolar Milk Union – Malur', district: 'Kolar', lat: 13.0037, lng: 77.9384, risk: 0.6 },
  { id: 'c06', name: 'Chikkaballapur – Gauribidanur', district: 'Chikkaballapur', lat: 13.6114, lng: 77.5171, risk: 0.3 },
  { id: 'c07', name: 'Ramanagara – Channapatna', district: 'Ramanagara', lat: 12.6518, lng: 77.2089, risk: 0.2 },
  { id: 'c08', name: 'Dharwad Union – Hubballi', district: 'Dharwad', lat: 15.3647, lng: 75.124, risk: 0.5 },
  { id: 'c09', name: 'Belagavi Co-op – Gokak', district: 'Belagavi', lat: 16.1691, lng: 74.8239, risk: 0.7 },
  { id: 'c10', name: 'Shivamogga Union – Bhadravati', district: 'Shivamogga', lat: 13.8483, lng: 75.7051, risk: 0.25 },
  { id: 'c11', name: 'Ballari Co-op – Hosapete', district: 'Ballari', lat: 15.2689, lng: 76.3909, risk: 0.55 },
  { id: 'c12', name: 'Davanagere Union – Harihar', district: 'Davanagere', lat: 14.5132, lng: 75.8072, risk: 0.4 },
];

export const centres: Centre[] = CENTRE_SEED.map(({ risk: _risk, ...c }, i) => ({ ...c, active: i !== 6 }));
const riskOf = new Map(CENTRE_SEED.map((c) => [c.id, c.risk]));

// ---------- Farmers ----------
const FIRST = ['Ramesh', 'Lakshmi', 'Manjunath', 'Shivamma', 'Basavaraj', 'Geetha', 'Nagaraj', 'Savitri', 'Mahesh', 'Kavya', 'Suresh', 'Parvati', 'Venkatesh', 'Anitha', 'Prakash', 'Sharada', 'Ravi', 'Yashoda', 'Mallikarjun', 'Rekha', 'Siddappa', 'Bhagya', 'Chandru', 'Nirmala'];
const LAST = ['Gowda', 'Patil', 'Naik', 'Hegde', 'Reddy', 'Shetty', 'Kulkarni', 'Swamy', 'Murthy', 'Desai'];
const VILLAGES = ['Hosahalli', 'Kodihalli', 'Bidadi', 'Kunigal', 'Halebeedu', 'Belur', 'Sira', 'Kadur', 'Hunsur', 'Sagar', 'Gundlupet', 'Koppa'];

export const farmers: Farmer[] = Array.from({ length: 48 }, (_, i) => {
  const centre = centres[i % centres.length];
  return {
    id: `f${String(i + 1).padStart(3, '0')}`,
    name: `${FIRST[i % FIRST.length]} ${pick(LAST)}`,
    village: pick(VILLAGES),
    centre_id: centre.id,
    phone: `+91 9${Math.floor(100000000 + rand() * 899999999)}`,
  };
});

// Each farmer gets a personal tendency so some are consistently good and a few consistently bad.
const farmerBias = new Map(farmers.map((f) => [f.id, rand()]));

// ---------- Mock sample photos ----------
// An SVG "cuvette" whose milk is whiter and more opaque when purer — echoes the science section.
export function sampleImage(water: number, starch: number): string {
  const opacity = Math.max(0.35, 1 - water / 30);
  const tint = starch > 1 ? '#F4EFD8' : '#FBFBFF';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240">
<defs><radialGradient id="g" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#3a3670"/><stop offset="1" stop-color="#14122e"/></radialGradient>
<linearGradient id="beam" x1="0" x2="1"><stop offset="0" stop-color="#ffb347" stop-opacity="0.9"/><stop offset="1" stop-color="#ffb347" stop-opacity="${(water / 25).toFixed(2)}"/></linearGradient></defs>
<rect width="320" height="240" fill="url(#g)"/>
<rect x="0" y="112" width="320" height="10" fill="url(#beam)"/>
<rect x="120" y="40" width="80" height="170" rx="10" fill="${tint}" fill-opacity="${opacity.toFixed(2)}" stroke="#cfcde8" stroke-width="3"/>
<ellipse cx="160" cy="117" rx="${(30 * opacity).toFixed(0)}" ry="${(18 * opacity).toFixed(0)}" fill="#fff" fill-opacity="0.55"/>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// ---------- Samples (last 45 days) ----------
const DAYS = 45;
const now = new Date();

function makeReading(centreId: string, farmerId: string) {
  const risk = riskOf.get(centreId) ?? 0.3;
  const bias = farmerBias.get(farmerId) ?? 0.5;
  const roll = rand();
  const badness = risk * 0.6 + bias * 0.4; // 0..1
  let water: number;
  if (roll < 1 - badness * 0.6) water = rand() * 4.5; // pure-ish
  else if (roll < 1 - badness * 0.22) water = 5 + rand() * 7; // suspicious band
  else water = 12 + rand() * 18; // diluted
  const starch = rand() < 0.03 + risk * 0.08 ? 0.6 + rand() * 2 : rand() * 0.4;
  return { water: round1(water), starch: round1(starch) };
}

function buildSamples(): Sample[] {
  const out: Sample[] = [];
  let seq = 1;
  for (let d = DAYS - 1; d >= 0; d--) {
    const day = new Date(now);
    day.setDate(now.getDate() - d);
    // Weekday rhythm plus a gentle upward trend in testing volume.
    const count = Math.round(34 + (DAYS - d) * 0.5 + rand() * 14 - (day.getDay() === 0 ? 12 : 0));
    for (let k = 0; k < count; k++) {
      const farmer = pick(farmers);
      const centre = centres.find((c) => c.id === farmer.centre_id)!;
      const ts = new Date(day);
      // Morning (5–9am) and evening (5–8pm) collection windows.
      const hour = rand() < 0.6 ? 5 + rand() * 4 : 17 + rand() * 3;
      ts.setHours(Math.floor(hour), Math.floor(rand() * 60), Math.floor(rand() * 60), 0);
      if (ts > now) ts.setTime(now.getTime() - Math.floor(rand() * 3_600_000));
      const { water, starch } = makeReading(centre.id, farmer.id);
      out.push({
        id: `s${String(seq++).padStart(5, '0')}`,
        farmer_id: farmer.id,
        farmer_name: farmer.name,
        centre_id: centre.id,
        centre_name: centre.name,
        water_pct: water,
        starch_pct: starch,
        verdict: verdictFor(water, starch),
        confidence: Math.round((0.82 + rand() * 0.17) * 100) / 100,
        image_url: null, // generated lazily from readings
        created_at: ts.toISOString(),
      });
    }
  }
  return out.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Mutable in-memory store; saved predictions are prepended here. */
export const samples: Sample[] = buildSamples();
