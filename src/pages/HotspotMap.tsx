import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Card, CardHeader } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { ErrorState, Spinner } from '../components/ui/States';
import { useAsync } from '../hooks/useAsync';
import { VERDICT_COLOR, cx, shortCentre } from '../lib';
import type { Hotspot } from '../types';

// Adulteration-rate bands for marker colour. Reuses the status colours with an icon + label in the legend.
const BANDS = [
  { max: 8, label: 'Low (< 8%)', color: VERDICT_COLOR.pure, Icon: CheckCircle2 },
  { max: 15, label: 'Elevated (8–15%)', color: VERDICT_COLOR.suspicious, Icon: AlertTriangle },
  { max: Infinity, label: 'Hotspot (≥ 15%)', color: VERDICT_COLOR.adulterated, Icon: XCircle },
];
const bandFor = (pct: number) => BANDS.find((b) => pct < b.max)!;

const KARNATAKA_CENTER: [number, number] = [14.2, 76.4];

function FlyTo({ target }: { target: Hotspot | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 9, { duration: 0.8 });
  }, [map, target]);
  return null;
}

export default function HotspotMap() {
  const hotspots = useAsync(() => api.statsHotspots(), []);
  const [focus, setFocus] = useState<Hotspot | null>(null);
  const ranked = useMemo(() => [...(hotspots.data ?? [])].sort((a, b) => b.adulterated_pct - a.adulterated_pct), [hotspots.data]);
  const maxSamples = Math.max(1, ...ranked.map((h) => h.total_samples));

  return (
    <>
      <PageHeader title="Hotspot map" subtitle="Collection centres coloured by share of samples flagged adulterated." />
      {hotspots.error ? (
        <Card><ErrorState message={hotspots.error} onRetry={hotspots.reload} /></Card>
      ) : hotspots.loading ? (
        <Card><Spinner label="Loading centres…" /></Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card className="relative isolate overflow-hidden">
            <MapContainer center={KARNATAKA_CENTER} zoom={7} scrollWheelZoom className="h-[420px] w-full sm:h-[560px]">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FlyTo target={focus} />
              {ranked.map((h) => {
                const band = bandFor(h.adulterated_pct);
                return (
                  <CircleMarker
                    key={h.centre_id}
                    center={[h.lat, h.lng]}
                    radius={9 + 9 * Math.sqrt(h.total_samples / maxSamples)}
                    pathOptions={{ color: '#fff', weight: 2, fillColor: band.color, fillOpacity: 0.85 }}
                  >
                    <Popup>
                      <div className="min-w-[200px]">
                        <p className="font-serif text-base font-semibold text-navy">{h.centre_name}</p>
                        <p className="text-xs text-slate-500">{h.district} district</p>
                        <dl className="mt-2 space-y-1 text-sm">
                          <div className="flex justify-between gap-4"><dt className="text-slate-500">Samples</dt><dd className="font-semibold tabular-nums">{h.total_samples.toLocaleString('en-IN')}</dd></div>
                          <div className="flex justify-between gap-4"><dt className="text-slate-500">Adulterated</dt><dd className="font-semibold tabular-nums" style={{ color: band.color }}>{h.adulterated_pct}%</dd></div>
                          <div className="flex justify-between gap-4"><dt className="text-slate-500">Avg water</dt><dd className="font-semibold tabular-nums">{h.avg_water_pct}%</dd></div>
                        </dl>
                        <Link to={`/samples`} className="mt-2 inline-block text-xs font-medium text-purple">View samples →</Link>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
            <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-xl bg-white/95 p-3 text-xs shadow-soft">
              <p className="mb-1.5 font-semibold text-navy">Adulteration rate</p>
              {BANDS.map((b) => (
                <p key={b.label} className="flex items-center gap-2 text-slate-600">
                  <span className="h-3 w-3 rounded-full ring-2 ring-white" style={{ background: b.color }} />
                  {b.label}
                </p>
              ))}
              <p className="mt-1.5 text-slate-400">Size = samples tested</p>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Centres by risk" subtitle="Tap a centre to locate it" />
            <ul className="mt-3 max-h-[480px] divide-y divide-lavender overflow-y-auto">
              {ranked.map((h, i) => {
                const band = bandFor(h.adulterated_pct);
                return (
                  <li key={h.centre_id}>
                    <button
                      onClick={() => setFocus(h)}
                      className={cx('flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-lavender/60', focus?.centre_id === h.centre_id && 'bg-lavender')}
                    >
                      <span className="w-5 text-xs font-semibold text-slate-400">{i + 1}</span>
                      <band.Icon className="h-4 w-4 shrink-0" style={{ color: band.color }} aria-label={band.label} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-navy">{shortCentre(h.centre_name)}</span>
                        <span className="block text-xs text-slate-500">{h.district} · {h.total_samples} samples</span>
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-slate-800">{h.adulterated_pct}%</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      )}
    </>
  );
}
