'use client';
// Custom SVG donut chart — Shelby dark brown + pink theme
import { formatCurrency } from '@/app/lib/utils';

interface DonutChartProps {
  shelbyUsdTotal: number;
  aptTotal: number;
}

// Pink for ShelbyUSD, dark pink for APT — matches .pen donut
const SHELBY_COLOR = '#FF69B4';
const APT_COLOR    = '#E85DA0';
const RADIUS       = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DonutChart({ shelbyUsdTotal, aptTotal }: DonutChartProps) {
  const total = shelbyUsdTotal + aptTotal;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No cost data</p>
      </div>
    );
  }

  const shelbyFrac = shelbyUsdTotal / total;
  const aptFrac    = aptTotal / total;
  const shelbyDash = shelbyFrac * CIRCUMFERENCE;
  const aptDash    = aptFrac * CIRCUMFERENCE;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 180 180" width={180} height={180} aria-label="Cost breakdown donut chart">
        {/* Track */}
        <circle
          cx={90} cy={90} r={RADIUS}
          fill="none"
          stroke="rgba(245,240,235,0.08)"
          strokeWidth={20}
        />
        {/* ShelbyUSD segment */}
        <circle
          cx={90} cy={90} r={RADIUS}
          fill="none"
          stroke={SHELBY_COLOR}
          strokeWidth={20}
          strokeDasharray={`${shelbyDash} ${CIRCUMFERENCE - shelbyDash}`}
          strokeDashoffset={CIRCUMFERENCE / 4}
          strokeLinecap="butt"
        />
        {/* APT segment */}
        <circle
          cx={90} cy={90} r={RADIUS}
          fill="none"
          stroke={APT_COLOR}
          strokeWidth={20}
          strokeDasharray={`${aptDash} ${CIRCUMFERENCE - aptDash}`}
          strokeDashoffset={CIRCUMFERENCE / 4 - shelbyDash}
          strokeLinecap="butt"
        />
        {/* Center total */}
        <text x={90} y={85} textAnchor="middle" fontSize={22} fontWeight="700" fill="var(--text-primary)">
          {formatCurrency(total)}
        </text>
        <text x={90} y={102} textAnchor="middle" fontSize={10} fontWeight="500" fill="var(--text-tertiary)" letterSpacing="1.5">
          TOTAL COST
        </text>
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: SHELBY_COLOR }} />
          <span style={{ color: 'var(--text-secondary)' }}>ShelbyUSD · {formatCurrency(shelbyUsdTotal)}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: APT_COLOR }} />
          <span style={{ color: 'var(--text-secondary)' }}>APT Gas · {formatCurrency(aptTotal, 'APT')}</span>
        </span>
      </div>
    </div>
  );
}
