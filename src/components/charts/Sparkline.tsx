import { Line, LineChart, YAxis } from 'recharts';
import { CHART } from './theme';

/** Water % over recent tests. Lower is better, so the axis is fixed 0–30 for comparability. */
export function Sparkline({ values }: { values: number[] }) {
  const data = values.map((v, i) => ({ i, v }));
  const last = values[values.length - 1] ?? 0;
  const colour = last >= 12 ? CHART.adulterated : last >= 5 ? CHART.threshold : '#16A34A';
  return (
    <div className="h-8 w-24" aria-label={`Recent water readings, latest ${last}%`} role="img">
      <LineChart width={96} height={32} data={data} margin={{ top: 3, right: 3, bottom: 3, left: 3 }}>
          <YAxis hide domain={[0, 30]} />
          <Line type="monotone" dataKey="v" stroke={CHART.primary} strokeWidth={1.5} dot={false} isAnimationActive={false} />
          <Line dataKey={(d: { i: number; v: number }) => (d.i === data.length - 1 ? d.v : null)} stroke="none" dot={{ r: 3, fill: colour, stroke: '#fff', strokeWidth: 1 }} isAnimationActive={false} />
      </LineChart>
    </div>
  );
}
