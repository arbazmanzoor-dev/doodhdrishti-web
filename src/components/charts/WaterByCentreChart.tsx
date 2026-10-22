import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { shortCentre } from '../../lib';
import type { StatsSummary } from '../../types';
import { CHART, axisProps } from './theme';
import { ChartTooltip } from './ChartTooltip';

export function WaterByCentreChart({ data }: { data: StatsSummary['water_by_centre'] }) {
  const rows = [...data]
    .sort((a, b) => b.avg_water_pct - a.avg_water_pct)
    .map((d) => ({ name: shortCentre(d.centre_name), 'Avg water': d.avg_water_pct }));
  return (
    <ResponsiveContainer width="100%" height={Math.max(260, rows.length * 30)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }} barCategoryGap={6}>
        <CartesianGrid stroke={CHART.grid} horizontal={false} />
        <XAxis type="number" unit="%" {...axisProps} />
        <YAxis type="category" dataKey="name" width={96} {...axisProps} />
        <Tooltip content={<ChartTooltip unit="%" />} cursor={{ fill: '#ECEBF7' }} />
        <ReferenceLine x={5} stroke={CHART.threshold} strokeDasharray="4 4" label={{ value: '5% limit', position: 'top', fill: CHART.axis, fontSize: 11 }} />
        <Bar dataKey="Avg water" fill={CHART.primary} radius={[0, 4, 4, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
