import { CheckCircle2, ImagePlus, Loader2, RotateCcw, Save, ScanLine, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, toApiError } from '../api/client';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfidenceBar } from '../components/ui/ConfidenceBar';
import { Label, Select } from '../components/ui/Field';
import { PageHeader } from '../components/ui/PageHeader';
import { ErrorState } from '../components/ui/States';
import { VerdictBadge } from '../components/ui/VerdictBadge';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { cx, formatDateTime } from '../lib';
import type { PredictResponse } from '../types';

const MAX_BYTES = 10 * 1024 * 1024;

const VERDICT_COPY = {
  pure: 'This sample is within normal limits. Safe to accept.',
  suspicious: 'Readings are borderline. Consider re-testing before accepting.',
  adulterated: 'Significant adulteration detected. Do not mix with the bulk tank.',
};

export default function TestSample() {
  const { user } = useAuth();
  const lists = useAsync(() => Promise.all([api.listCentres(), api.listFarmers()]), []);
  const [centres, farmers] = lists.data ?? [[], []];

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [centreId, setCentreId] = useState('');
  const [farmerId, setFarmerId] = useState('');
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  // Default to the operator's own centre once centres load.
  useEffect(() => {
    if (!centreId && centres.length) setCentreId(user?.centre_id && centres.some((c) => c.id === user.centre_id) ? user.centre_id : centres[0].id);
  }, [centres, centreId, user]);

  const centreFarmers = useMemo(() => farmers.filter((f) => f.centre_id === centreId), [farmers, centreId]);
  useEffect(() => {
    if (!centreFarmers.some((f) => f.id === farmerId)) setFarmerId(centreFarmers[0]?.id ?? '');
  }, [centreFarmers, farmerId]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function choose(f: File | undefined) {
    setFileError(null);
    if (!f) return;
    if (!f.type.startsWith('image/')) return setFileError('That file is not an image. Use a JPG or PNG photo.');
    if (f.size > MAX_BYTES) return setFileError('Image is larger than 10 MB.');
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
    setSaveState('idle');
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    choose(e.dataTransfer.files[0]);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file || !farmerId || !centreId) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setSaveState('idle');
    try {
      setResult(await api.predict({ image: file, farmer_id: farmerId, centre_id: centreId }));
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!result) return;
    setSaveState('saving');
    try {
      await api.confirmSample(result.sample_id);
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setSaveState('idle');
    if (inputRef.current) inputRef.current.value = '';
  }

  if (lists.error) return <Card><ErrorState message={lists.error} onRetry={lists.reload} /></Card>;

  return (
    <>
      <PageHeader title="Test a sample" subtitle="Upload a photo taken through the DoodhDrishti cuvette with the torch on." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <form onSubmit={onSubmit} className="space-y-5">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cx(
                'relative flex min-h-[220px] flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-colors',
                dragging ? 'border-saffron bg-saffron-light' : 'border-purple/40 bg-lavender/60',
              )}
            >
              {preview ? (
                <>
                  <img src={preview} alt="Selected milk sample" className="max-h-72 w-full object-contain" />
                  <button type="button" onClick={reset} className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-navy shadow-soft hover:bg-white" aria-label="Remove photo">
                    <X className="h-4 w-4" />
                  </button>
                  {busy && (
                    <div className="absolute inset-0 flex items-center justify-center bg-navy/40">
                      <ScanLine className="h-12 w-12 animate-pulse text-white" />
                    </div>
                  )}
                </>
              ) : (
                <button type="button" onClick={() => inputRef.current?.click()} className="flex flex-col items-center gap-2 p-6 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-navy shadow-soft">
                    <ImagePlus className="h-7 w-7" />
                  </span>
                  <span className="font-medium text-navy">Drag & drop a milk photo</span>
                  <span className="text-sm text-slate-500">or click to browse · JPG/PNG up to 10 MB</span>
                </button>
              )}
              <input ref={inputRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => choose(e.target.files?.[0])} />
            </div>
            {fileError && <p className="text-sm text-adulterated" role="alert">{fileError}</p>}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="centre">Collection centre</Label>
                <Select id="centre" value={centreId} onChange={(e) => setCentreId(e.target.value)} disabled={lists.loading}>
                  {centres.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="farmer">Farmer</Label>
                <Select id="farmer" value={farmerId} onChange={(e) => setFarmerId(e.target.value)} disabled={lists.loading || !centreFarmers.length}>
                  {centreFarmers.length === 0 && <option value="">No farmers at this centre</option>}
                  {centreFarmers.map((f) => <option key={f.id} value={f.id}>{f.name} · {f.village}</option>)}
                </Select>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={!file || !farmerId || busy}>
              {busy ? <><Loader2 className="h-5 w-5 animate-spin" /> Analysing sample…</> : <><ScanLine className="h-5 w-5" /> Analyse sample</>}
            </Button>
          </form>
        </Card>

        <Card className="p-5 sm:p-6" aria-live="polite">
          {busy ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-purple" />
              <p className="font-medium text-navy">Reading light scattering…</p>
              <p className="text-sm text-slate-500">This usually takes a couple of seconds.</p>
            </div>
          ) : error ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <ErrorState message={error} onRetry={file ? () => onSubmit({ preventDefault() {} } as FormEvent) : undefined} />
            </div>
          ) : result ? (
            <ResultCard result={result} saveState={saveState} onSave={save} onReset={reset} />
          ) : (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-2 text-center">
              <ScanLine className="h-10 w-10 text-purple-light" />
              <p className="font-medium text-navy">No result yet</p>
              <p className="max-w-xs text-sm text-slate-500">Add a photo, pick the farmer, and press Analyse. The verdict appears here.</p>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function ResultCard({ result, saveState, onSave, onReset }: { result: PredictResponse; saveState: 'idle' | 'saving' | 'saved' | 'error'; onSave: () => void; onReset: () => void }) {
  const ring = { pure: 'ring-pure/30', suspicious: 'ring-suspicious/30', adulterated: 'ring-adulterated/30' }[result.verdict];
  return (
    <div className="space-y-5">
      <div className={cx('rounded-2xl p-5 ring-2', ring)}>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verdict</p>
        <div className="mt-2"><VerdictBadge verdict={result.verdict} size="lg" /></div>
        <p className="mt-3 text-sm text-slate-600">{VERDICT_COPY[result.verdict]}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Water" value={result.water_pct} warn={5} bad={12} />
        <Metric label="Starch" value={result.starch_pct} warn={0.6} bad={1.5} />
      </div>
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Model confidence</p>
        <ConfidenceBar value={result.confidence} />
      </div>
      <p className="text-xs text-slate-500">Sample {result.sample_id} · {formatDateTime(result.created_at)}</p>
      <div className="flex flex-wrap gap-3">
        {saveState === 'saved' ? (
          <p className="inline-flex items-center gap-2 rounded-xl bg-pure-bg px-4 py-2.5 text-sm font-medium text-pure">
            <CheckCircle2 className="h-4 w-4" /> Saved to record · <Link to="/samples" className="underline">view samples</Link>
          </p>
        ) : (
          <Button onClick={onSave} disabled={saveState === 'saving'}>
            {saveState === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save to record
          </Button>
        )}
        <Button variant="outline" onClick={onReset}><RotateCcw className="h-4 w-4" /> Test another</Button>
      </div>
      {saveState === 'error' && <p className="text-sm text-adulterated" role="alert">Could not save. Please try again.</p>}
    </div>
  );
}

function Metric({ label, value, warn, bad }: { label: string; value: number; warn: number; bad: number }) {
  const tone = value >= bad ? 'text-adulterated' : value >= warn ? 'text-suspicious' : 'text-pure';
  return (
    <div className="rounded-2xl bg-lavender p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={cx('font-serif text-3xl font-bold tabular-nums', tone)}>{value.toFixed(1)}%</p>
    </div>
  );
}
