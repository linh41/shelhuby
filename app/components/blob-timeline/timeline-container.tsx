'use client';
// Main orchestrator: mode tabs, filters, heatmap/list rendering, date drill-down
import { useMemo, useState } from 'react';
import { type BlobMetadata, type NetworkId } from '@/app/types';
import { getBlobStatus } from '@/app/lib/utils';
import { TimelineFilters, type DateRange, type SortBy } from './timeline-filters';
import { CalendarHeatmap } from './calendar-heatmap';
import { BlobList } from './blob-list';

type ViewMode = 'heatmap' | 'list';

interface TimelineContainerProps {
  blobs: BlobMetadata[];
  network: NetworkId;
  onBlobClick: (blob: BlobMetadata) => void;
}

function daysAgoMs(days: number): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d.getTime();
}

function applyDateRange(blobs: BlobMetadata[], range: DateRange): BlobMetadata[] {
  if (range === 'all') return blobs;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const cutoff = daysAgoMs(days);
  return blobs.filter((b) => {
    const ms = b.uploadTimestamp > 1e12 ? b.uploadTimestamp : b.uploadTimestamp * 1000;
    return ms >= cutoff;
  });
}

function applySort(blobs: BlobMetadata[], sort: SortBy): BlobMetadata[] {
  const copy = [...blobs];
  switch (sort) {
    case 'newest':  return copy.sort((a, b) => b.uploadTimestamp - a.uploadTimestamp);
    case 'oldest':  return copy.sort((a, b) => a.uploadTimestamp - b.uploadTimestamp);
    case 'largest': return copy.sort((a, b) => b.size - a.size);
    case 'expiring': {
      const statusOrder = { 'expiring-soon': 0, active: 1, pending: 2, expired: 3 };
      return copy.sort((a, b) => {
        const sa = statusOrder[getBlobStatus(a.expiryTimestamp)];
        const sb = statusOrder[getBlobStatus(b.expiryTimestamp)];
        if (sa !== sb) return sa - sb;
        return a.expiryTimestamp - b.expiryTimestamp;
      });
    }
    default: return copy;
  }
}

function applyDayFilter(blobs: BlobMetadata[], dateKey: string): BlobMetadata[] {
  return blobs.filter((b) => {
    const ms = b.uploadTimestamp > 1e12 ? b.uploadTimestamp : b.uploadTimestamp * 1000;
    return new Date(ms).toISOString().slice(0, 10) === dateKey;
  });
}

export function TimelineContainer({ blobs, network, onBlobClick }: TimelineContainerProps) {
  const [mode, setMode]               = useState<ViewMode>('heatmap');
  const [dateRange, setDateRange]     = useState<DateRange>('all');
  const [sortBy, setSortBy]           = useState<SortBy>('newest');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const filteredBlobs = useMemo(() => {
    const ranged = applyDateRange(blobs, dateRange);
    return applySort(ranged, sortBy);
  }, [blobs, dateRange, sortBy]);

  const listBlobs = useMemo(
    () => (selectedDay ? applyDayFilter(filteredBlobs, selectedDay) : filteredBlobs),
    [filteredBlobs, selectedDay]
  );

  function handleDateSelect(dateKey: string | null) {
    setSelectedDay(dateKey);
    if (dateKey) setMode('list');
  }

  return (
    <div
      className="rounded-2xl flex flex-col gap-6"
      style={{ background: 'var(--card-default)', borderRadius: 'var(--card-radius)', padding: 32 }}
    >
      {/* Header row: title + blob count badge + mode toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Blob Timeline
        </h2>
        <span
          className="rounded-[10px] px-2.5 py-1 text-xs font-medium"
          style={{ background: 'var(--card-elevated)', color: 'var(--text-secondary)' }}
        >
          {blobs.length} blobs
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Mode toggle — matches .pen toggle */}
        <div
          className="flex items-center gap-0.5 rounded-lg p-0.5"
          style={{ background: 'var(--card-elevated)' }}
        >
          {(['heatmap', 'list'] as ViewMode[]).map((m) => (
            <button
              key={m}
              type="button"
              className="px-3.5 py-1.5 text-[13px] font-medium rounded-md transition-colors"
              style={
                mode === m
                  ? { background: 'var(--card-default)', color: 'var(--text-primary)' }
                  : { background: 'transparent', color: 'var(--text-tertiary)' }
              }
              onClick={() => setMode(m)}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <TimelineFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Day filter chip */}
      {selectedDay && (
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Filtered to:</span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{
              background: 'rgba(255,105,180,0.1)',
              color: 'var(--accent)',
              border: '1px solid rgba(255,105,180,0.25)',
            }}
          >
            {selectedDay}
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="ml-0.5 hover:opacity-70 transition-opacity"
              aria-label="Clear day filter"
            >
              &times;
            </button>
          </span>
        </div>
      )}

      {/* Active view */}
      {mode === 'heatmap' ? (
        <CalendarHeatmap blobs={filteredBlobs} onDateSelect={handleDateSelect} />
      ) : (
        <BlobList blobs={listBlobs} network={network} onBlobClick={onBlobClick} />
      )}
    </div>
  );
}
