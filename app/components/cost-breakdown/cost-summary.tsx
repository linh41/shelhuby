'use client';
// Grid of cost metric cards — Shelby dark brown + pink theme
import { type CostDataPoint } from '@/app/types';
import { formatCurrency, formatBytes } from '@/app/lib/utils';

interface CostSummaryProps {
  costHistory: CostDataPoint[];
  totalStorageBytes: number;
  totalTransactions: number;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex flex-col gap-1 rounded-[10px] px-4 py-3"
      style={{ background: 'var(--card-elevated)' }}
    >
      <span
        className="text-[10px] uppercase tracking-[1px] font-medium"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {label}
      </span>
      <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  );
}

export function CostSummary({ costHistory, totalStorageBytes, totalTransactions }: CostSummaryProps) {
  if (!costHistory || costHistory.length === 0) {
    return (
      <p className="text-xs text-center py-4" style={{ color: 'var(--text-tertiary)' }}>
        No cost summary available
      </p>
    );
  }

  const totalShelby = costHistory.reduce((s, d) => s + d.shelbyUsd, 0);
  const totalApt    = costHistory.reduce((s, d) => s + d.apt, 0);
  const totalCost   = totalShelby + totalApt;

  const activeDays = costHistory.filter(d => d.shelbyUsd > 0 || d.apt > 0).length || 1;
  const avgDaily   = totalCost / activeDays;

  const last7      = costHistory.slice(-7);
  const last7Total = last7.reduce((s, d) => s + d.shelbyUsd + d.apt, 0);
  const projected  = (last7Total / (last7.length || 1)) * 30;

  const totalGB    = totalStorageBytes / (1024 ** 3);
  const costPerGb  = totalGB > 0 ? totalShelby / totalGB : 0;
  const avgGas     = totalApt / (totalTransactions || 1);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        <MetricCard label="Avg Daily" value={formatCurrency(avgDaily)} />
        <MetricCard label="Projected/Mo" value={formatCurrency(projected)} />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <MetricCard label="Cost / GB" value={formatCurrency(costPerGb)} />
        <MetricCard label="Avg Gas/TX" value={formatCurrency(avgGas, 'APT')} />
      </div>
    </div>
  );
}
