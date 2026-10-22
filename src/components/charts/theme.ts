// Chart palette — validated with the dataviz palette checker (light surface).
export const CHART = {
  primary: '#5B54B0', // "tested" / single-series marks (brand violet, chroma-boosted)
  adulterated: '#DC2626',
  grid: '#E6E5F2',
  axis: '#64748B',
  threshold: '#D97706',
};

export const axisProps = {
  stroke: CHART.axis,
  tick: { fill: CHART.axis, fontSize: 12 },
  tickLine: false,
  axisLine: false,
} as const;
