
import { ArrowDownUp, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Sparkline } from '../components/charts/Sparkline';
import { Card } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Field';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';
import { useLanguage } from '../context/LanguageContext';
import { useAsync } from '../hooks/useAsync';
import { cx, formatDate, shortCentre } from '../lib';
import type { FarmerSummary } from '../types';

type SortKey = 'name' | 'total_samples' | 'pure_pct' | 'last_test_at';

function PureBadge({ pct }: { pct: number }) {
  const cls = pct >= 80 ? 'bg-pure-bg text-pure' : pct >= 60 ? 'bg-suspicious-bg text-suspicious' : 'bg-adulterated-bg text-adulterated';
  return <span className={cx('inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums', cls)}>{pct.toFixed(0)}%</span>;
}

export default function Farmers() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const farmers = useAsync(() => Promise.all([api.listFarmers(), api.listCentres()]), []);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('pure_pct');

  const centreName = useMemo(() => new Map(farmers.data?.[1].map((c) => [c.id, c.name])), [farmers.data]);
  const rows = useMemo(() => {
    const list = farmers.data?.[0] ?? [];
    const term = search.trim().toLowerCase();
    const filtered = term ? list.filter((f) => f.name.toLowerCase().includes(term) || f.village.toLowerCase().includes(term) || f.id.includes(term)) : list;
    const cmp: Record<SortKey, (a: FarmerSummary, b: FarmerSummary) => number> = {
      name: (a, b) => a.name.localeCompare(b.name),
      total_samples: (a, b) => b.total_samples - a.total_samples,
      pure_pct: (a, b) => a.pure_pct - b.pure_pct,
      last_test_at: (a, b) => (b.last_test_at ?? '').localeCompare(a.last_test_at ?? ''),
    };
    return [...filtered].sort(cmp[sort]);
  }, [farmers.data, search, sort]);

  return (
    <>
      <PageHeader title={t('farmersTitle')} subtitle={t('farmersSubtitle')} />
      <Card className="mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder={t('searchFarmers')} aria-label={t('searchFarmers')} className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-500">
          <ArrowDownUp className="h-4 w-4" aria-hidden />
          <span className="sr-only sm:not-sr-only">{t('sort')}</span>
          <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="sm:w-48">
            <option value="pure_pct">{t('pureLowest')}</option>
            <option value="total_samples">{t('mostSamples')}</option>
            <option value="last_test_at">{t('recentlyTested')}</option>
            <option value="name">{t('nameAZ')}</option>
          </Select>
        </label>
      </Card>

      <Card className="overflow-hidden">
        {farmers.error ? (
          <ErrorState message={farmers.error} onRetry={farmers.reload} />
        ) : farmers.loading ? (
          <div className="space-y-2 p-5">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState title={t('noFarmers')} />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-lavender text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 font-semibold">{t('farmer')}</th>
                    <th className="px-3 py-3 font-semibold">{t('centre')}</th>
                    <th className="px-3 py-3 text-right font-semibold">{t('samples')}</th>
                    <th className="px-3 py-3 text-right font-semibold">{t('pure')}</th>
                    <th className="px-3 py-3 font-semibold">{t('lastTest')}</th>
                    <th className="px-5 py-3 font-semibold">{t('waterTrend')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((f) => (
                    <tr key={f.id} onClick={() => navigate(`/farmers/${f.id}`)} className="cursor-pointer border-b border-lavender/70 last:border-0 hover:bg-lavender/60">
                      <td className="px-5 py-3">
                        <Link to={`/farmers/${f.id}`} className="font-medium text-navy hover:text-purple" onClick={(e) => e.stopPropagation()}>{f.name}</Link>
                        <p className="text-xs text-slate-500">{f.village} · {f.id}</p>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{shortCentre(centreName.get(f.centre_id) ?? '—')}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{f.total_samples}</td>
                      <td className="px-3 py-3 text-right"><PureBadge pct={f.pure_pct} /></td>
                      <td className="px-3 py-3 text-slate-600">{f.last_test_at ? formatDate(f.last_test_at) : '—'}</td>
                      <td className="px-5 py-2"><Sparkline values={f.trend} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-lavender md:hidden">
              {rows.map((f) => (
                <li key={f.id}>
                  <Link to={`/farmers/${f.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-lavender/60">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-navy">{f.name}</p>
                      <p className="truncate text-xs text-slate-500">{f.village} · {f.total_samples} {t('samples')} · {f.last_test_at ? formatDate(f.last_test_at) : '—'}</p>
                    </div>
                    <Sparkline values={f.trend} />
                    <PureBadge pct={f.pure_pct} />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </>
  );
}
