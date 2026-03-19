'use client';
// Custom GitHub-style contribution heatmap — no external deps
import { useMemo, useState, useRef, useEffect } from 'react';
import { type BlobMetadata } from '@/app/types';
import { formatBytes } from '@/app/lib/utils';

interface CalendarHeatmapProps {
  blobs: BlobMetadata[];
  onDateSelect: (date: string | null) => void;
}

interface DayData {
  count: number;
  totalSize: number;
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// 5-level pink scale — dark brown base, pink gradient matching .pen heatmap legend
function getCellColor(count: number): string {
  if (count === 0) return '#4A3828';
  if (count === 1) return '#5A2040';
  if (count <= 3) return '#8B3A5E';
  if (count <= 5) return '#CC5189';
  if (count <= 9) return '#E85DA0';
  return '#FF69B4';
}

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const SQUARE_SIZE = 12;
const GAP = 2;

export function CalendarHeatmap({ blobs, onDateSelect }: CalendarHeatmapProps) {
  const [tooltip, setTooltip] = useState<{
    dateKey: string;
    data: DayData;
    x: number;
    y: number;
  } | null>(null);

  const dayMap = useMemo<Map<string, DayData>>(() => {
    const map = new Map<string, DayData>();
    for (const blob of blobs) {
      if (!blob.uploadTimestamp || blob.uploadTimestamp <= 0) continue;
      const ms = blob.uploadTimestamp > 1e12 ? blob.uploadTimestamp : blob.uploadTimestamp * 1000;
      const d = new Date(ms);
      if (isNaN(d.getTime())) continue;
      const key = toDateKey(d);
      const existing = map.get(key) ?? { count: 0, totalSize: 0 };
      map.set(key, { count: existing.count + 1, totalSize: existing.totalSize + blob.size });
    }
    return map;
  }, [blobs]);

  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const weeksArr: Array<Array<{ dateKey: string; date: Date } | null>> = [];
    const labels: Array<{ label: string; weekIdx: number }> = [];
    const current = new Date(startDate);
    let lastMonth = -1;

    for (let w = 0; w < 53; w++) {
      const week: Array<{ dateKey: string; date: Date } | null> = [];
      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(current);
        if (cellDate > today) {
          week.push(null);
        } else {
          week.push({ dateKey: toDateKey(cellDate), date: new Date(cellDate) });
          const m = cellDate.getMonth();
          if (m !== lastMonth && d === 0) {
            labels.push({
              label: cellDate.toLocaleString('default', { month: 'short' }),
              weekIdx: w,
            });
            lastMonth = m;
          }
        }
        current.setDate(current.getDate() + 1);
      }
      weeksArr.push(week);
    }
    return { weeks: weeksArr, monthLabels: labels };
  }, []);

  const cellStride = SQUARE_SIZE + GAP;
  const gridWidth = weeks.length * cellStride;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to right so recent activity is visible
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [dayMap]);

  return (
    <div className="overflow-x-auto" ref={scrollRef}>
      <div style={{ minWidth: gridWidth + 32, position: 'relative' }}>
        {/* Month labels */}
        <div style={{ marginLeft: 28, position: 'relative', height: 18 }}>
          {monthLabels.map(({ label, weekIdx }) => (
            <span
              key={`${label}-${weekIdx}`}
              className="absolute text-xs"
              style={{ left: weekIdx * cellStride, color: 'var(--text-tertiary)', fontSize: 10 }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Day labels + grid */}
        <div className="flex gap-0">
          <div style={{ width: 28, display: 'grid', gridTemplateRows: `repeat(7, ${SQUARE_SIZE}px)`, gap: GAP }}>
            {DAY_LABELS.map((lbl, i) => (
              <span
                key={i}
                className="flex items-center justify-end pr-1"
                style={{ color: 'var(--text-tertiary)', fontSize: 9, height: SQUARE_SIZE }}
              >
                {lbl}
              </span>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${weeks.length}, ${SQUARE_SIZE}px)`,
              gridTemplateRows: `repeat(7, ${SQUARE_SIZE}px)`,
              gap: GAP,
              gridAutoFlow: 'column',
            }}
            onMouseLeave={() => setTooltip(null)}
          >
            {weeks.map((week, wi) =>
              week.map((cell, di) => {
                if (!cell) {
                  return <div key={`${wi}-${di}`} style={{ width: SQUARE_SIZE, height: SQUARE_SIZE }} />;
                }
                const data = dayMap.get(cell.dateKey) ?? { count: 0, totalSize: 0 };
                return (
                  <div
                    key={cell.dateKey}
                    role="button"
                    tabIndex={0}
                    aria-label={`${cell.dateKey}: ${data.count} blobs`}
                    onClick={() => onDateSelect(data.count > 0 ? cell.dateKey : null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onDateSelect(data.count > 0 ? cell.dateKey : null);
                    }}
                    onMouseEnter={(e) => {
                      if (data.count > 0) {
                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                        setTooltip({ dateKey: cell.dateKey, data, x: rect.left, y: rect.top });
                      }
                    }}
                    style={{
                      width: SQUARE_SIZE,
                      height: SQUARE_SIZE,
                      borderRadius: 2,
                      cursor: data.count > 0 ? 'pointer' : 'default',
                      backgroundColor: getCellColor(data.count),
                      transition: 'opacity 0.1s',
                    }}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="fixed z-50 pointer-events-none rounded-xl px-3 py-2 text-xs shadow-lg"
            style={{
              background: 'var(--card-elevated)',
              border: '1px solid #5A4838',
              color: 'var(--text-primary)',
              top: tooltip.y - 60,
              left: tooltip.x - 20,
              whiteSpace: 'nowrap',
            }}
          >
            <p className="font-semibold">{tooltip.dateKey}</p>
            <p style={{ color: 'var(--text-tertiary)' }}>
              {tooltip.data.count} blob{tooltip.data.count !== 1 ? 's' : ''} &middot;{' '}
              {formatBytes(tooltip.data.totalSize)}
            </p>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-2 justify-end">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Less</span>
          {[0, 1, 3, 5, 8, 12].map((count) => (
            <div
              key={count}
              style={{
                width: SQUARE_SIZE,
                height: SQUARE_SIZE,
                borderRadius: 2,
                backgroundColor: getCellColor(count),
              }}
            />
          ))}
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>More</span>
        </div>
      </div>
    </div>
  );
}
