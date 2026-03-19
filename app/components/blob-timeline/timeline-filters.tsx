'use client';
// Horizontal filter bar: date range pill buttons + dropdowns — Shelby dark brown style
import { ChevronDown } from 'lucide-react';

export type DateRange = '7d' | '30d' | '90d' | 'all';
export type SortBy = 'newest' | 'oldest' | 'largest' | 'expiring';

interface TimelineFiltersProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  sortBy: SortBy;
  onSortChange: (sort: SortBy) => void;
}

const DATE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: '7d',  value: '7d'  },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
  { label: 'All', value: 'all' },
];

const SORT_OPTIONS: { label: string; value: SortBy }[] = [
  { label: 'Newest first',     value: 'newest'   },
  { label: 'Oldest first',     value: 'oldest'   },
  { label: 'Largest first',    value: 'largest'  },
  { label: 'Expiring soonest', value: 'expiring' },
];

export function TimelineFilters({
  dateRange,
  onDateRangeChange,
  sortBy,
  onSortChange,
}: TimelineFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Date range pills — no border, elevated bg active */}
      <div className="flex items-center gap-1">
        {DATE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onDateRangeChange(opt.value)}
            className="rounded-md px-3 py-1 text-[13px] font-medium transition-colors"
            style={
              dateRange === opt.value
                ? { background: 'var(--text-primary)', color: 'var(--page-bg)' }
                : { background: 'transparent', color: 'var(--text-tertiary)' }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Blob type dropdown */}
      <div
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] cursor-pointer"
        style={{ border: '1px solid #5A4838', color: 'var(--text-secondary)' }}
      >
        <span>Blob type</span>
        <ChevronDown size={14} style={{ color: 'var(--text-tertiary)' }} />
      </div>

      {/* Sort dropdown */}
      <div className="relative">
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortBy)}
          className="appearance-none rounded-md px-3 py-1.5 pr-7 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] cursor-pointer"
          style={{
            background: 'transparent',
            border: '1px solid #5A4838',
            color: 'var(--text-secondary)',
          }}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} style={{ background: 'var(--card-default)', color: 'var(--text-primary)' }}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-tertiary)' }}
        />
      </div>
    </div>
  );
}
