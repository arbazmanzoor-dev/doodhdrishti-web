import type { TooltipProps } from 'recharts';

type Row = { color?: string; name?: string | number; value?: number | string };

/** Shared tooltip card: text in ink colours, a coloured swatch carries series identity. */
export function ChartTooltip({ active, payload, label, unit = '', labelFormatter }: TooltipProps<number, string> & { unit?: string; labelFormatter?: (l: string) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-navy/10 bg-white px-3 py-2 text-xs shadow-lift">
      <p className="mb-1 font-semibold text-navy">{labelFormatter ? labelFormatter(String(label)) : label}</p>
      {(payload as Row[]).map((p) => (
        <p key={String(p.name)} className="flex items-center gap-2 text-slate-600">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold tabular-nums text-slate-800">{p.value}{unit}</span>
        </p>
      ))}
    </div>
  );
}
