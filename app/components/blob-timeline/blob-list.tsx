'use client';
// Grouped blob list with day separators, pagination, and empty state
import { useMemo, useState } from 'react';
import { type BlobMetadata } from '@/app/types';
import { formatDate } from '@/app/lib/utils';
import { BlobCard } from './blob-card';

const PAGE_SIZE = 50;

interface BlobListProps {
  blobs: BlobMetadata[];
  network: 'testnet' | 'shelbynet';
  onBlobClick: (blob: BlobMetadata) => void;
}

interface DayGroup {
  dateKey: string;
  label: string;
  blobs: BlobMetadata[];
}

function groupByDay(blobs: BlobMetadata[]): DayGroup[] {
  const map = new Map<string, BlobMetadata[]>();
  for (const blob of blobs) {
    const ms = blob.uploadTimestamp > 1e12 ? blob.uploadTimestamp : blob.uploadTimestamp * 1000;
    const key = new Date(ms).toISOString().slice(0, 10);
    const list = map.get(key) ?? [];
    list.push(blob);
    map.set(key, list);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, dayBlobs]) => ({
      dateKey,
      label: formatDate(new Date(dateKey).getTime() + 43200000),
      blobs: dayBlobs,
    }));
}

export function BlobList({ blobs, network, onBlobClick }: BlobListProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const groups = useMemo(() => groupByDay(blobs), [blobs]);

  const visibleGroups = useMemo(() => {
    let remaining = visibleCount;
    const result: DayGroup[] = [];
    for (const group of groups) {
      if (remaining <= 0) break;
      result.push({ ...group, blobs: group.blobs.slice(0, remaining) });
      remaining -= group.blobs.length;
    }
    return result;
  }, [groups, visibleCount]);

  const totalBlobs = blobs.length;
  const hasMore = visibleCount < totalBlobs;

  if (totalBlobs === 0) {
    return (
      <div
        className="py-12 text-center text-sm rounded-xl"
        style={{
          color: 'var(--text-tertiary)',
          background: 'rgba(245,240,235,0.03)',
          border: '1px solid #5A4838',
        }}
      >
        No blobs match the current filters
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {visibleGroups.map((group) => (
        <div key={group.dateKey}>
          {/* Day separator */}
          <div className="flex items-center gap-2 mb-1 pt-3 pb-2">
            <span className="text-xs font-medium tracking-[0.5px]" style={{ color: 'var(--text-tertiary)' }}>
              {group.label}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {group.blobs.map((blob) => (
              <BlobCard key={blob.merkleRoot} blob={blob} network={network} onClick={onBlobClick} />
            ))}
          </div>
        </div>
      ))}

      {hasMore && (
        <button
          type="button"
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          className="w-full rounded-xl py-2.5 text-sm font-medium transition-colors hover:opacity-70"
          style={{
            border: '1px solid #5A4838',
            color: 'var(--text-secondary)',
            background: 'transparent',
          }}
        >
          Load more ({totalBlobs - visibleCount} remaining)
        </button>
      )}
    </div>
  );
}
