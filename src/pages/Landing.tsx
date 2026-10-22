import { ArrowRight, Building2, Camera, Droplet, Flashlight, Gauge, HeartHandshake, Menu, Sprout, Users, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { useAuth } from '../context/AuthContext';

const STEPS = [
  { icon: Droplet, title: 'Place sample', body: 'Pour a few millilitres of milk into the transparent DoodhDrishti cuvette clipped onto the phone.' },
  { icon: Flashlight, title: 'Shine & capture', body: 'The phone torch shines through the milk while the camera captures how the light scatters.' },
  { icon: Gauge, title: 'Instant result', body: 'On-device analysis estimates water and starch content and gives a verdict in seconds.' },
];

const IMPACT = [
  { icon: Sprout, title: 'Farmers', body: 'Honest farmers get fair, transparent pricing backed by an objective test — not guesswork at the counter.' },
  { icon: HeartHandshake, title: 'Consumers', body: 'Families can trust that the milk reaching their children is what it claims to be.' },
  { icon: Building2, title: 'Dairies & FSSAI', body: 'Cooperatives and food safety officers see hotspots early and act on data, not complaints.' },
];

const TEAM = [
  { name: 'Arbaz Manzoor', role: 'Team Nexora' },
  { name: 'Arush Tripathi', role: 'Team Nexora' },
  { name: 'Raj Awasthi', role: 'Team Nexora' },
  { name: 'Priya Debnath', role: 'Team Nexora' },
];

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('');
}

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const [menu, setMenu] = useState(false);
  const dashHref = isAuthenticated ? '/dashboard' : '/login';

  return (
    <div className="min-h-screen bg-lavender">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-navy/10 bg-lavender/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-navy/80 md:flex">
            <a href="#how" className="hover:text-navy">How it works</a>
            <a href="#science" className="hover:text-navy">Science</a>
            <a href="#impact" className="hover:text-navy">Impact</a>
            <a href="#team" className="hover:text-navy">Team</a>
            <Link to={dashHref} className="rounded-xl bg-navy px-4 py-2 text-white shadow-soft hover:bg-navy-700">
              Open Dashboard
            </Link>
          </nav>
          <button className="rounded-lg p-2 text-navy md:hidden" onClick={() => setMenu((m) => !m)} aria-label="Toggle menu" aria-expanded={menu}>
            {menu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {menu && (
          <nav className="flex flex-col gap-1 border-t border-navy/10 px-4 pb-4 pt-2 text-sm font-medium text-navy md:hidden">
            {['how', 'science', 'impact', 'team'].map((id) => (
              <a key={id} href={`#${id}`} onClick={() => setMenu(false)} className="rounded-lg px-2 py-2 capitalize hover:bg-white">
                {id === 'how' ? 'How it works' : id}
              </a>
            ))}
            <Link to={dashHref} className="mt-2 rounded-xl bg-navy px-4 py-2.5 text-center text-white">
              Open Dashboard
            </Link>
          </nav>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-purple/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-saffron/15 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-saffron-dark shadow-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-saffron" /> Smartphone milk adulteration detector
            </p>
            <p className="mt-6 font-serif text-xl italic text-purple sm:text-2xl">Is the milk you drank this morning really pure?</p>
            <h1 className="mt-3 font-serif text-5xl font-bold tracking-tight text-navy sm:text-6xl lg:text-7xl">
              Doodh<span className="text-saffron">Drishti</span>
            </h1>
            <p className="mt-4 text-lg text-slate-600">Seeing purity in every drop.</p>
            <p className="mt-4 max-w-md text-slate-600">
              A low-cost clip-on and a phone camera are all a collection centre needs to catch watered-down or starch-laced milk —
              before it reaches the chilling tank.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={dashHref}
                className="inline-flex items-center gap-2 rounded-xl bg-navy px-6 py-3 font-medium text-white shadow-soft transition hover:bg-navy-700"
              >
                Open Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-2 rounded-xl border border-navy/20 bg-white px-6 py-3 font-medium text-navy transition hover:bg-lavender-dark"
              >
                How it works
              </a>
            </div>
          </div>
          <HeroIllustration />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionTitle eyebrow="How it works" title="Three steps. Under ten seconds." />
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative rounded-2xl bg-lavender p-6 shadow-soft">
                <span className="absolute right-5 top-4 font-serif text-5xl font-bold text-purple/25">{i + 1}</span>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-white">
                  <s.icon className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-navy">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="absolute -right-5 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-saffron md:block" aria-hidden />
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Science */}
      <section id="science" className="scroll-mt-20 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 md:grid-cols-2">
          <div>
            <SectionTitle eyebrow="The science" title="Pure milk scatters light. Diluted milk lets it through." align="left" />
            <p className="mt-5 leading-relaxed text-slate-600">
              Milk is an emulsion of fat globules and casein micelles. These tiny particles scatter light in every direction, which
              is why pure milk looks opaque and bright white.
            </p>
            <p className="mt-3 leading-relaxed text-slate-600">
              Add water and the particles thin out — more of the torch beam passes straight through and the glow inside the cuvette
              dims. Starch, a common thickener used to hide dilution, shifts the colour and texture of the scattered light. The
              camera measures both, and the model turns them into water % and starch %.
            </p>
            <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
              <li className="rounded-xl bg-white p-3 shadow-soft"><b className="block text-pure">Pure</b>water &lt; 5%</li>
              <li className="rounded-xl bg-white p-3 shadow-soft"><b className="block text-suspicious">Suspicious</b>5 – 12% water</li>
              <li className="rounded-xl bg-white p-3 shadow-soft"><b className="block text-adulterated">Adulterated</b>≥ 12% or starch</li>
            </ul>
          </div>
          <ScatterIllustration />
        </div>
      </section>

      {/* Impact */}
      <section id="impact" className="scroll-mt-20 bg-navy py-20 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionTitle eyebrow="Impact" title="Built for everyone in the milk chain" light />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {IMPACT.map((c) => (
              <div key={c.title} className="rounded-2xl bg-white/10 p-6 ring-1 ring-white/10 transition hover:bg-white/15">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-saffron text-white">
                  <c.icon className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="mt-5 text-xl font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/75">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="team" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionTitle eyebrow="Team Nexora" title="The people behind DoodhDrishti" />
          <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            {TEAM.map((m, i) => (
              <div key={m.name} className="rounded-2xl bg-white p-6 text-center shadow-soft">
                <div
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full font-serif text-xl font-bold text-white"
                  style={{ background: ['#2F2B6E', '#7F79B6', '#E88A1A', '#25225A'][i] }}
                  aria-hidden
                >
                  {initials(m.name)}
                </div>
                <p className="mt-4 font-semibold text-navy">{m.name}</p>
                <p className="text-xs text-slate-500">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:px-6">
          <Logo />
          <p className="flex items-center gap-1.5">
            <Users className="h-4 w-4" aria-hidden /> Made by Team Nexora · © {new Date().getFullYear()}
          </p>
          <div className="flex gap-5">
            <a href="#how" className="hover:text-navy">How it works</a>
            <Link to={dashHref} className="hover:text-navy">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionTitle({ eyebrow, title, light, align = 'center' }: { eyebrow: string; title: string; light?: boolean; align?: 'center' | 'left' }) {
  return (
    <div className={align === 'center' ? 'text-center' : ''}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-saffron">{eyebrow}</p>
      <h2 className={`mt-2 font-serif text-3xl font-bold sm:text-4xl ${light ? 'text-white' : 'text-navy'}`}>{title}</h2>
    </div>
  );
}

function HeroIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="rounded-[2.5rem] bg-navy p-3 shadow-lift">
        <div className="overflow-hidden rounded-[2rem] bg-white">
          <div className="flex items-center justify-between bg-lavender px-5 py-3 text-xs font-semibold text-navy">
            <span>DoodhDrishti</span>
            <Camera className="h-4 w-4" aria-hidden />
          </div>
          <div className="p-5">
            <svg viewBox="0 0 240 150" className="w-full rounded-xl bg-navy-900" aria-hidden>
              <defs>
                <linearGradient id="hbeam" x1="0" x2="1">
                  <stop offset="0" stopColor="#FFB347" />
                  <stop offset="1" stopColor="#FFB347" stopOpacity="0.15" />
                </linearGradient>
                <radialGradient id="hglow">
                  <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect x="0" y="70" width="240" height="10" fill="url(#hbeam)" />
              <rect x="90" y="22" width="60" height="110" rx="8" fill="#FBFBFF" fillOpacity="0.92" stroke="#A9A4D4" strokeWidth="2" />
              <circle cx="120" cy="75" r="34" fill="url(#hglow)" />
            </svg>
            <div className="mt-4 flex items-center justify-between">
              <span className="rounded-full bg-pure-bg px-3 py-1 text-sm font-semibold text-pure">Pure</span>
              <span className="text-xs text-slate-500">94% confidence</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl bg-lavender p-3">
                <p className="text-xs text-slate-500">Water</p>
                <p className="font-serif text-2xl font-bold text-navy">1.8%</p>
              </div>
              <div className="rounded-xl bg-lavender p-3">
                <p className="text-xs text-slate-500">Starch</p>
                <p className="font-serif text-2xl font-bold text-navy">0.1%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -left-8 top-24 hidden rounded-2xl bg-white px-4 py-3 shadow-lift sm:block">
        <p className="text-xs text-slate-500">Time to result</p>
        <p className="font-serif text-xl font-bold text-navy">under 10 seconds</p>
      </div>
    </div>
  );
}

function ScatterIllustration() {
  // Dots inside each cuvette represent fat/casein particles; rays show scattering vs transmission.
  const dots = (n: number, seed: number) =>
    Array.from({ length: n }, (_, i) => {
      const x = 18 + ((i * 37 + seed * 13) % 64);
      const y = 22 + ((i * 53 + seed * 7) % 136);
      return <circle key={i} cx={x} cy={y} r="2.2" fill="#7F79B6" />;
    });
  return (
    <div className="grid grid-cols-2 gap-4 rounded-2xl bg-white p-6 shadow-soft">
      {[
        { label: 'Pure milk', sub: 'Light scatters — bright, opaque glow', n: 48, through: 0.15, glow: 0.9 },
        { label: 'Diluted milk', sub: 'Light passes through — dim glow', n: 14, through: 0.85, glow: 0.3 },
      ].map((c, idx) => (
        <figure key={c.label} className="text-center">
          <svg viewBox="0 0 160 190" className="w-full rounded-xl bg-navy-900" aria-label={c.sub}>
            <rect x="0" y="86" width="44" height="8" fill="#FFB347" />
            <rect x="116" y="86" width="44" height="8" fill="#FFB347" fillOpacity={c.through} />
            <rect x="44" y="12" width="72" height="166" rx="8" fill="#fff" fillOpacity={0.15 + c.glow * 0.7} stroke="#A9A4D4" strokeWidth="2" />
            <g transform="translate(36,0)">{dots(c.n, idx + 1)}</g>
            {c.glow > 0.5 &&
              [-50, -25, 25, 50, 140, 165, 195, 220].map((a) => {
                const r = (a * Math.PI) / 180;
                return (
                  <line key={a} x1="80" y1="90" x2={80 + Math.cos(r) * 60} y2={90 + Math.sin(r) * 60} stroke="#FFB347" strokeOpacity="0.6" strokeWidth="2" />
                );
              })}
          </svg>
          <figcaption className="mt-3">
            <p className="font-semibold text-navy">{c.label}</p>
            <p className="text-xs text-slate-500">{c.sub}</p>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
