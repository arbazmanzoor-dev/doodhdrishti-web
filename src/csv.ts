import type { Sample } from './types';

const esc = (v: unknown) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function samplesToCsv(rows: Sample[]) {
  const header = ['sample_id', 'date', 'farmer_id', 'farmer', 'centre_id', 'centre', 'water_pct', 'starch_pct', 'verdict', 'confidence'];
  const lines = rows.map((s) =>
    [s.id, s.created_at, s.farmer_id, s.farmer_name, s.centre_id, s.centre_name, s.water_pct, s.starch_pct, s.verdict, s.confidence].map(esc).join(','),
  );
  return [header.join(','), ...lines].join('\n');
}

export function downloadText(filename: string, text: string, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
