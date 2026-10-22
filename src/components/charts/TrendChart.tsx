import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TrendPoint } from '../../types';
import { CHART, axisProps } from './theme';
import { ChartTooltip } from './ChartTooltip';

const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={CHART.grid} vertical={false} />
        <XAxis dataKey="date" tickFormatter={fmt} minTickGap={28} {...axisProps} />
        <YAxis allowDecimals={false} {...axisProps} />
        <Tooltip content={<ChartTooltip labelFormatter={fmt} />} cursor={{ stroke: CHART.axis, strokeDasharray: '3 3' }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: CHART.axis }} />
        <Line type="monotone" name="Samples tested" dataKey="tested" stroke={CHART.primary} strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
        <Line type="monotone" name="Adulterated" dataKey="adulterated" stroke={CHART.adulterated} strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
