import { ArrowLeft, MapPin, Phone } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client';
import { ChartTooltip } from '../components/charts/ChartTooltip';
import { CHART, axisProps } from '../components/charts/theme';
import { SampleDetail } from '../components/SampleDetail';
import { SamplesTable } from '../components/SamplesTable';
import { Card, CardHeader } from '../components/ui/Card';
import { Drawer } from '../components/ui/Drawer';
import { EmptyState, ErrorState, Spinner } from '../components/ui/States';
import { useAsync } from '../hooks/useAsync';
import { formatDate } from '../lib';
import type { Sample } from '../types';

const HISTORY_PAGE = 20;

export default function FarmerDetail() {
  const { id = '' } = useParams();
  const farmer = useAsync(() => api.getFarmer(id), [id]);
  const [selected, setSelected] = useState<Sample | null>(null);
  const [shown, setShown] = useState(HISTORY_PAGE);
  const f = farmer.data;

  const chartData = useMemo(
    () =>
      (f?.samples ?? [])
        .slice()
        .reverse()
        .map((s) => ({
          label: new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          'Water %': s.water_pct,
          'Starch %': s.starch_pct,
        })),
    [f],
  );

  if (farmer.loading) return <Spinner />;
  if (farmer.error || !f) return <Card><ErrorState message={farmer.error ?? 'Farmer not found.'} onRetry={farmer.reload} /></Card>;

  const counts = { pure: 0, suspicious: 0, adulterated: 0 };
  f.samples.forEach((s) => counts[s.verdict]++);

  return (
    <>
      <Link to="/farmers" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-purple hover:text-navy">
        <ArrowLeft className="h-4 w-4" /> All farmers
      </Link>

      <Card className="mb-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold text-navy sm:text-3xl">{f.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {f.village} · {f.centre_name}</span>
              {f.phone && <span className="inline-flex items-center gap-1"><Phone className="h-4 w-4" /> {f.phone}</span>}
            </p>
          </div>
          <span className="rounded-full bg-lavender px-3 py-1 text-xs font-semibold text-navy">{f.id}</span>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Stat label="Total samples" value={f.total_samples} />
          <Stat label="% pure" value={`${f.pure_pct.toFixed(0)}%`} />
          <Stat label="Suspicious" value={counts.suspicious} tone="text-suspicious" />
          <Stat label="Adulterated" value={counts.adulterated} tone="text-adulterated" />
          <Stat label="Last test" value={f.last_test_at ? formatDate(f.last_test_at) : '—'} small />
        </dl>
      </Card>

      <Card className="mb-6">
        <CardHeader title="Quality history" subtitle="Water and starch per test, oldest → newest. Dashed line is the 5% water limit." />
        <div className="px-2 pb-4 pt-2 sm:px-4">
          {chartData.length === 0 ? (
            <EmptyState title="No tests yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="label" minTickGap={28} {...axisProps} />
                <YAxis unit="%" {...axisProps} />
                <Tooltip content={<ChartTooltip unit="%" />} cursor={{ stroke: CHART.axis, strokeDasharray: '3 3' }} />
                <ReferenceLine y={5} stroke={CHART.threshold} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="Water %" stroke={CHART.primary} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
                <Line type="monotone" dataKey="Starch %" stroke={CHART.adulterated} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
          <div className="mt-2 flex justify-center gap-5 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: CHART.primary }} /> Water %</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: CHART.adulterated }} /> Starch %</span>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="All tests" subtitle={`${f.samples.length} samples`} />
        <div className="mt-3">
          <SamplesTable rows={f.samples.slice(0, shown)} onRowClick={setSelected} hideFarmer />
        </div>
        {shown < f.samples.length && (
          <div className="border-t border-lavender p-3 text-center">
            <button className="text-sm font-medium text-purple hover:text-navy" onClick={() => setShown((n) => n + HISTORY_PAGE)}>
              Show more ({f.samples.length - shown} remaining)
            </button>
          </div>
        )}
      </Card>

      <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} title="Sample detail">
        {selected && <SampleDetail sample={selected} />}
      </Drawer>
    </>
  );
}

function Stat({ label, value, tone = 'text-navy', small }: { label: string; value: React.ReactNode; tone?: string; small?: boolean }) {
  return (
    <div className="rounded-2xl bg-lavender p-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={`font-serif font-bold ${small ? 'text-base' : 'text-2xl'} ${tone}`}>{value}</dd>
    </div>
  );
}
