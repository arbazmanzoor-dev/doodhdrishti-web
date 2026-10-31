import { Link } from 'react-router-dom';
import { formatDateTime } from '../lib';
import { MILK_TYPE_LABELS, type Sample } from '../types';
import { ConfidenceBar } from './ui/ConfidenceBar';
import { VerdictBadge } from './ui/VerdictBadge';

export function SampleDetail({ sample }: { sample: Sample }) {
  const rows: [string, React.ReactNode][] = [
    ['Sample ID', sample.id],
    ['Tested', formatDateTime(sample.created_at)],
    ['Farmer', <Link key="f" to={`/farmers/${sample.farmer_id}`} className="font-medium text-purple hover:text-navy">{sample.farmer_name}</Link>],
    ['Centre', sample.centre_name],
    ...(sample.milk_type ? ([['Milk type', MILK_TYPE_LABELS[sample.milk_type]]] as [string, React.ReactNode][]) : []),
    ['Water', `${sample.water_pct.toFixed(1)}%`],
    ['Starch', `${sample.starch_pct.toFixed(1)}%`],
  ];
  return (
    <div className="space-y-5">
      {sample.image_url ? (
        <img src={sample.image_url} alt={`Photo of sample ${sample.id}`} className="aspect-[4/3] w-full rounded-2xl bg-navy-900 object-cover" />
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-lavender text-sm text-slate-500">No photo</div>
      )}
      <VerdictBadge verdict={sample.verdict} size="lg" />
      <dl className="divide-y divide-lavender rounded-2xl border border-lavender">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
            <dt className="text-slate-500">{k}</dt>
            <dd className="text-right text-navy">{v}</dd>
          </div>
        ))}
      </dl>
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Model confidence</p>
        <ConfidenceBar value={sample.confidence} />
      </div>
    </div>
  );
}
