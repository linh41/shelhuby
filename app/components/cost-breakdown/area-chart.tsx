'use client';
// Custom SVG area chart for cost history — Shelby dark brown + pink theme
import { type CostDataPoint } from '@/app/types';
import { formatCurrency } from '@/app/lib/utils';

interface AreaChartProps {
  data: CostDataPoint[];
}

// Pink theme colors matching .pen chartBox
const ACCENT    = '#FF69B4';
const APT_COLOR = '#E85DA0';
const W = 400;
const H = 120;
const PAD = { top: 12, right: 12, bottom: 28, left: 44 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

function buildPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  return points.reduce((d, p, i) => d + (i === 0 ? `M${p.x},${p.y}` : ` L${p.x},${p.y}`), '');
}

function buildArea(points: { x: number; y: number }[], baseY: number): string {
  if (points.length === 0) return '';
  const line = buildPath(points);
  return `${line} L${points[points.length - 1].x},${baseY} L${points[0].x},${baseY} Z`;
}

export function AreaChart({ data }: AreaChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No cost data available</p>
      </div>
    );
  }

  const maxVal = Math.max(...data.map(d => Math.max(d.shelbyUsd, d.apt)), 0.001);
  const baseY  = PAD.top + INNER_H;

  const toX = (i: number) => PAD.left + (data.length === 1 ? INNER_W / 2 : (i / (data.length - 1)) * INNER_W);
  const toY = (v: number) => PAD.top + INNER_H - (v / maxVal) * INNER_H;

  const shelbyPoints = data.map((d, i) => ({ x: toX(i), y: toY(d.shelbyUsd) }));
  const aptPoints    = data.map((d, i) => ({ x: toX(i), y: toY(d.apt) }));

  const xLabels = [0, Math.floor((data.length - 1) / 2), data.length - 1]
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .map(i => ({ x: toX(i), label: data[i].date.slice(5) }));

  const yLabels = [
    { y: baseY,   label: '0' },
    { y: PAD.top, label: formatCurrency(maxVal) },
  ];

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card-elevated)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} aria-label="Cost history area chart">
        <defs>
          <linearGradient id="shelbyGradDark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={ACCENT}    stopOpacity="0.15" />
            <stop offset="100%" stopColor={ACCENT}    stopOpacity="0.01" />
          </linearGradient>
          <linearGradient id="aptGradDark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={APT_COLOR} stopOpacity="0.35" />
            <stop offset="100%" stopColor={APT_COLOR} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Baseline */}
        <line
          x1={PAD.left} y1={baseY}
          x2={PAD.left + INNER_W} y2={baseY}
          stroke="#5A4838" strokeWidth={1}
        />

        {/* Y-axis labels */}
        {yLabels.map(({ y, label }) => (
          <text key={label} x={PAD.left - 4} y={y + 3} textAnchor="end" fontSize={8} fill="var(--text-tertiary)">
            {label}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabels.map(({ x, label }) => (
          <text key={label} x={x} y={H - 6} textAnchor="middle" fontSize={8} fill="var(--text-tertiary)">
            {label}
          </text>
        ))}

        {/* APT area (behind) */}
        <path d={buildArea(aptPoints, baseY)} fill="url(#aptGradDark)" />
        <path d={buildPath(aptPoints)} fill="none" stroke={APT_COLOR} strokeWidth={1.5} />

        {/* ShelbyUSD area (front) */}
        <path d={buildArea(shelbyPoints, baseY)} fill="url(#shelbyGradDark)" />
        <path d={buildPath(shelbyPoints)} fill="none" stroke={ACCENT} strokeWidth={2} />
      </svg>
    </div>
  );
}
