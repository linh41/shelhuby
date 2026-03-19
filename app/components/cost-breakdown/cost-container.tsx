'use client';
// Layout container composing donut chart, area chart, and cost summary
import { type CostDataPoint } from '@/app/types';
import { DonutChart } from '@/app/components/cost-breakdown/donut-chart';
import { AreaChart } from '@/app/components/cost-breakdown/area-chart';
import { CostSummary } from '@/app/components/cost-breakdown/cost-summary';
import { Skeleton } from '@/app/components/ui/skeleton';

interface CostContainerProps {
  costHistory: CostDataPoint[];
  totalStorageBytes: number;
  totalBlobs: number;
  loading?: boolean;
}

export function CostContainer({
  costHistory,
  totalStorageBytes,
  totalBlobs,
  loading = false,
}: CostContainerProps) {
  if (loading) {
    return (
      <div
        className="rounded-2xl p-8 flex flex-col gap-6"
        style={{ background: 'var(--card-default)', borderRadius: 'var(--card-radius)' }}
      >
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-[10px]" />
          ))}
        </div>
      </div>
    );
  }

  const shelbyUsdTotal = costHistory.reduce((s, d) => s + d.shelbyUsd, 0);
  const aptTotal       = costHistory.reduce((s, d) => s + d.apt, 0);

  return (
    <div
      className="rounded-2xl flex flex-col gap-6"
      style={{ background: 'var(--card-default)', borderRadius: 'var(--card-radius)', padding: 32 }}
    >
      {/* Section title */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          Cost Breakdown
        </h2>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Last 60 days
        </span>
      </div>

      {/* Donut — cost split */}
      <DonutChart shelbyUsdTotal={shelbyUsdTotal} aptTotal={aptTotal} />

      <div style={{ height: 1, background: '#5A4838' }} />

      {/* Area chart — spending trend */}
      <div>
        <p className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          Spending Trend
        </p>
        <AreaChart data={costHistory} />
      </div>

      <div style={{ height: 1, background: '#5A4838' }} />

      {/* Summary metrics */}
      <div>
        <p className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          Summary
        </p>
        <CostSummary
          costHistory={costHistory}
          totalStorageBytes={totalStorageBytes}
          totalTransactions={totalBlobs}
        />
      </div>
    </div>
  );
}
