import type { Sample } from '../types';
import { formatDateTime, shortCentre } from '../lib';
import { VerdictBadge } from './ui/VerdictBadge';

interface Props {
  rows: Sample[];
  onRowClick?: (s: Sample) => void;
  compact?: boolean;
  hideFarmer?: boolean;
}

/** Table on ≥ sm screens, stacked cards on phones so nothing scrolls sideways at 375px. */
export function SamplesTable({ rows, onRowClick, compact, hideFarmer }: Props) {
  const clickable = Boolean(onRowClick);
  return (
    <>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-lavender text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3 font-semibold">Date</th>
              {!hideFarmer && <th className="px-3 py-3 font-semibold">Farmer</th>}
              <th className="px-3 py-3 font-semibold">Centre</th>
              <th className="px-3 py-3 text-right font-semibold">Water %</th>
              <th className="px-3 py-3 text-right font-semibold">Starch %</th>
              <th className="px-3 py-3 font-semibold">Verdict</th>
              {!compact && <th className="px-5 py-3 text-right font-semibold">Confidence</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr
                key={s.id}
                onClick={() => onRowClick?.(s)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onRowClick?.(s)}
                tabIndex={clickable ? 0 : undefined}
                className={`border-b border-lavender/70 last:border-0 ${clickable ? 'cursor-pointer hover:bg-lavender/60 focus:bg-lavender/60 focus:outline-none' : ''}`}
              >
                <td className="whitespace-nowrap px-5 py-3 text-slate-600">{formatDateTime(s.created_at)}</td>
                {!hideFarmer && <td className="whitespace-nowrap px-3 py-3 font-medium text-navy">{s.farmer_name}</td>}
                <td className="whitespace-nowrap px-3 py-3 text-slate-600">{shortCentre(s.centre_name)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{s.water_pct.toFixed(1)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{s.starch_pct.toFixed(1)}</td>
                <td className="px-3 py-3"><VerdictBadge verdict={s.verdict} /></td>
                {!compact && <td className="px-5 py-3 text-right tabular-nums text-slate-600">{Math.round(s.confidence * 100)}%</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-lavender sm:hidden">
        {rows.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              disabled={!clickable}
              onClick={() => onRowClick?.(s)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left enabled:hover:bg-lavender/60"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-navy">{hideFarmer ? shortCentre(s.centre_name) : s.farmer_name}</p>
                <p className="truncate text-xs text-slate-500">
                  {formatDateTime(s.created_at)}{hideFarmer ? '' : ` · ${shortCentre(s.centre_name)}`}
                </p>
                <p className="text-xs tabular-nums text-slate-600">Water {s.water_pct.toFixed(1)}% · Starch {s.starch_pct.toFixed(1)}%</p>
              </div>
              <VerdictBadge verdict={s.verdict} />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
