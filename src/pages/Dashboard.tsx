
import { Activity, AlertTriangle, Droplets, FlaskConical, MapPin } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { TrendChart } from '../components/charts/TrendChart';
import { WaterByCentreChart } from '../components/charts/WaterByCentreChart';
import { SamplesTable } from '../components/SamplesTable';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { ErrorState, Skeleton } from '../components/ui/States';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useAsync } from '../hooks/useAsync';

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const summary = useAsync(() => api.statsSummary(), []);
  const trends = useAsync(() => api.statsTrends(30), []);
  const s = summary.data;

  return (
    <>
      <PageHeader
        title={`${t('dashboardGreeting')}, ${user?.name.split(' ')[0] ?? 'there'}`}
        subtitle={t('dashboardSubtitle')}
        action={
          <Link to="/test">
            <Button variant="accent">
              <FlaskConical className="h-4 w-4" /> {t('testSample')}
            </Button>
          </Link>
        }
      />

      {summary.error ? (
        <Card><ErrorState message={summary.error} onRetry={summary.reload} /></Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi loading={summary.loading} icon={<Activity />} label={t('samplesToday')} value={s?.samples_today.toLocaleString('en-IN')} />
          <Kpi loading={summary.loading} icon={<AlertTriangle />} label={t('adulteratedPercent')} value={s && `${s.adulterated_pct}%`} tone={s && s.adulterated_pct >= 15 ? 'bad' : undefined} />
          <Kpi loading={summary.loading} icon={<Droplets />} label={t('averageWater')} value={s && `${s.avg_water_pct}%`} tone={s && s.avg_water_pct >= 5 ? 'warn' : undefined} />
          <Kpi loading={summary.loading} icon={<MapPin />} label={t('activeCentres')} value={s?.active_centres} />
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader title={t('samplesTrend')} subtitle={t('dailyCounts')} />
          <div className="px-2 pb-4 pt-2 sm:px-4">
            {trends.error ? <ErrorState message={trends.error} onRetry={trends.reload} /> : trends.loading || !trends.data ? <Skeleton className="mx-3 h-[280px]" /> : <TrendChart data={trends.data} />}
          </div>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title={t('waterByCentre')} subtitle={t('waterLimit')} />
          <div className="px-2 pb-4 pt-2 sm:px-4">
            {summary.loading || !s ? <Skeleton className="mx-3 h-[280px]" /> : <WaterByCentreChart data={s.water_by_centre} />}
          </div>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <CardHeader
          title={t('recentTests')}
          subtitle={t('latestSamples')}
          action={<Link to="/samples" className="text-sm font-medium text-purple hover:text-navy">{t('viewAll')} →</Link>}
        />
        <div className="mt-3">
          {summary.loading || !s ? (
            <div className="space-y-2 p-5">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-9" />)}</div>
          ) : (
            <SamplesTable rows={s.recent} compact />
          )}
        </div>
      </Card>
    </>
  );
}

function Kpi({ icon, label, value, loading, tone }: {
  icon: ReactNode;
  label: string;
  value?: ReactNode;
  loading: boolean;
  tone?: 'warn' | 'bad';
}) {
  const toneCls = tone === 'bad' ? 'bg-adulterated-bg text-adulterated' : tone === 'warn' ? 'bg-suspicious-bg text-suspicious' : 'bg-lavender text-navy';
  return (
    <Card className="p-4 sm:p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl [&>svg]:h-5 [&>svg]:w-5 ${toneCls}`} aria-hidden>{icon}</div>
      <p className="mt-3 text-xs font-medium text-slate-500 sm:text-sm">{label}</p>
      {loading ? <Skeleton className="mt-1 h-8 w-20" /> : <p className="font-serif text-2xl font-bold text-navy sm:text-3xl">{value ?? '—'}</p>}
    </Card>
  );
}
