
import { ChevronLeft, ChevronRight, Download, Loader2, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, toApiError } from '../api/client';
import { SampleDetail } from '../components/SampleDetail';
import { SamplesTable } from '../components/SamplesTable';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Drawer } from '../components/ui/Drawer';
import { Input, Label, Select } from '../components/ui/Field';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';
import { samplesToCsv, downloadText } from '../csv';
import { useLanguage } from '../context/LanguageContext';
import { useAsync } from '../hooks/useAsync';
import { useDebounce } from '../hooks/useDebounce';
import { VERDICT_LABEL, isoDay } from '../lib';
import type { Sample, SampleQuery, Verdict } from '../types';

const PAGE_SIZE = 15;

export default function Samples() {
  const { t } = useLanguage();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [centreId, setCentreId] = useState('');
  const [verdict, setVerdict] = useState<Verdict | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounce(search, 300);
  const [selected, setSelected] = useState<Sample | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const centres = useAsync(() => api.listCentres(), []);
  const query: SampleQuery = {
    from: from || undefined,
    to: to || undefined,
    centre_id: centreId || undefined,
    verdict: verdict || undefined,
    q: q || undefined,
  };
  const key = JSON.stringify(query);

  useEffect(() => setPage(1), [key]);

  const list = useAsync(() => api.listSamples({ ...query, page, page_size: PAGE_SIZE }), [key, page]);
  const total = list.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = Boolean(from || to || centreId || verdict || search);

  async function exportCsv() {
    setExporting(true);
    setExportError(null);
    try {
      const all = await api.listSamples({ ...query, page: 1, page_size: 0 });
      downloadText(`doodhdrishti-samples-${isoDay(new Date())}.csv`, samplesToCsv(all.items));
    } catch (e) {
      setExportError(toApiError(e).message);
    } finally {
      setExporting(false);
    }
  }

  function clear() {
    setFrom('');
    setTo('');
    setCentreId('');
    setVerdict('');
    setSearch('');
  }

  return (
    <>
      <PageHeader
        title={t('samplesTitle')}
        subtitle={list.data ? `${total.toLocaleString('en-IN')} ${t('samplesMatch')}` : t('allTestedSamples')}
        action={
          <Button variant="outline" onClick={exportCsv} disabled={exporting || total === 0}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} {t('exportCSV')}
          </Button>
        }
      />
      {exportError && <p className="mb-4 text-sm text-adulterated" role="alert">{t('exportFailed')}: {exportError}</p>}

      <Card className="mb-4 p-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr_1fr_auto] lg:items-end">
          <div className="col-span-2 lg:col-span-1">
            <Label htmlFor="q">{t('searchFarmer')}</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input id="q" placeholder={t('nameOrId')} className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="from">{t('from')}</Label>
            <Input id="from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="to">{t('to')}</Label>
            <Input id="to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="centre">{t('centre')}</Label>
            <Select id="centre" value={centreId} onChange={(e) => setCentreId(e.target.value)}>
              <option value="">{t('allCentres')}</option>
              {centres.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="verdict">{t('verdict')}</Label>
            <Select id="verdict" value={verdict} onChange={(e) => setVerdict(e.target.value as Verdict | '')}>
              <option value="">{t('allVerdicts')}</option>
              {(Object.keys(VERDICT_LABEL) as Verdict[]).map((v) => <option key={v} value={v}>{v === 'pure' ? t('pure') : v === 'suspicious' ? t('suspicious') : t('adulterated')}</option>)}
            </Select>
          </div>
          <Button variant="ghost" onClick={clear} disabled={!hasFilters} className="col-span-2 justify-self-start lg:col-span-1">
            <X className="h-4 w-4" /> {t('clear')}
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {list.error ? (
          <ErrorState message={list.error} onRetry={list.reload} />
        ) : list.loading && !list.data ? (
          <div className="space-y-2 p-5">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : list.data && list.data.items.length === 0 ? (
          <EmptyState title={t('noSamples')}>{t('widenDateRange')}</EmptyState>
        ) : (
          <div className={list.loading ? 'opacity-60 transition-opacity' : ''}>
            <SamplesTable rows={list.data?.items ?? []} onRowClick={setSelected} />
          </div>
        )}
        <div className="flex items-center justify-between gap-3 border-t border-lavender px-4 py-3 text-sm sm:px-5">
          <span className="text-slate-500">{t('page')} {page} {t('of')} {pages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1 || list.loading} aria-label={t('previous')}>
              <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">{t('previous')}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= pages || list.loading} aria-label={t('next')}>
              <span className="hidden sm:inline">{t('next')}</span> <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} title={t('sampleDetail')}>
        {selected && <SampleDetail sample={selected} />}
      </Drawer>
    </>
  );
}
