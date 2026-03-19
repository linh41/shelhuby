'use client';
// Collapsible expiry alerts banner — shows blobs expiring in 24h / 7d / 30d
import { useState } from 'react';
import { X, TriangleAlert, Timer } from 'lucide-react';
import { type BlobMetadata } from '@/app/types';
import { formatBytes } from '@/app/lib/utils';

interface ExpiryAlertsProps {
  blobs: BlobMetadata[];
  onBlobClick: (blob: BlobMetadata) => void;
}

type AlertLevel = 'critical' | 'warning' | 'info';

interface AlertItem {
  blob: BlobMetadata;
  level: AlertLevel;
  msUntilExpiry: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getExpiryMs(expiryTimestamp: number): number {
  if (!expiryTimestamp) return Infinity;
  const ms = expiryTimestamp > 1e12 ? expiryTimestamp : expiryTimestamp * 1000;
  return ms - Date.now();
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Expired';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 24) return `${hours}h remaining`;
  const days = Math.floor(hours / 24);
  return `${days}d remaining`;
}

function classifyBlobs(blobs: BlobMetadata[]): AlertItem[] {
  const DAY = 24 * 60 * 60 * 1000;
  const items: AlertItem[] = [];

  for (const blob of blobs) {
    const msLeft = getExpiryMs(blob.expiryTimestamp);
    if (msLeft <= 0 || msLeft === Infinity) continue;

    let level: AlertLevel;
    if (msLeft <= DAY) level = 'critical';
    else if (msLeft <= 7 * DAY) level = 'warning';
    else if (msLeft <= 30 * DAY) level = 'info';
    else continue;

    items.push({ blob, level, msUntilExpiry: msLeft });
  }

  const order: Record<AlertLevel, number> = { critical: 0, warning: 1, info: 2 };
  return items.sort((a, b) =>
    order[a.level] !== order[b.level]
      ? order[a.level] - order[b.level]
      : a.msUntilExpiry - b.msUntilExpiry
  );
}

// ── Level styling — matches .pen alert1/alert2/alert3 ─────────────────────────

const LEVEL_STYLES: Record<AlertLevel, { bg: string; border: string; icon: string }> = {
  critical: {
    bg: 'rgba(255,105,180,0.09)',
    border: 'rgba(255,105,180,0.21)',
    icon: '#E74C3C',
  },
  warning: {
    bg: 'rgba(255,142,198,0.08)',
    border: 'rgba(255,142,198,0.19)',
    icon: '#F39C12',
  },
  info: {
    bg: 'rgba(255,142,198,0.08)',
    border: 'rgba(255,142,198,0.19)',
    icon: '#F39C12',
  },
};

// ── Alert row ──────────────────────────────────────────────────────────────────

function AlertRow({ item, onClick }: { item: AlertItem; onClick: () => void }) {
  const styles = LEVEL_STYLES[item.level];
  const Icon = item.level === 'critical' ? TriangleAlert : Timer;

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-2.5 rounded-lg px-4 py-2.5 transition-colors hover:opacity-80"
      style={{
        background: styles.bg,
        border: `1px solid ${styles.border}`,
      }}
    >
      <Icon size={16} className="shrink-0" style={{ color: styles.icon }} />
      <span className="text-[13px] truncate flex-1" style={{ color: 'var(--text-primary)' }}>
        {item.blob.name || item.blob.merkleRoot.slice(0, 12) + '…'}
        <span style={{ color: 'var(--text-tertiary)' }}> — {formatBytes(item.blob.size)}</span>
      </span>
      {item.level === 'critical' && (
        <span
          className="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-bold"
          style={{ background: 'var(--danger)', color: '#fff' }}
        >
          {formatCountdown(item.msUntilExpiry)}
        </span>
      )}
      {item.level !== 'critical' && (
        <span className="shrink-0 text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
          {formatCountdown(item.msUntilExpiry)}
        </span>
      )}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ExpiryAlerts({ blobs, onBlobClick }: ExpiryAlertsProps) {
  const [dismissed, setDismissed] = useState(false);
  const alerts = classifyBlobs(blobs);

  if (alerts.length === 0 || dismissed) return null;

  const criticalCount = alerts.filter((a) => a.level === 'critical').length;
  const warningCount  = alerts.filter((a) => a.level === 'warning').length;

  return (
    <div
      className="rounded-2xl flex flex-col gap-3"
      style={{
        background: 'var(--card-default)',
        borderRadius: 'var(--card-radius)',
        padding: '24px 48px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-[15px] font-medium" style={{ color: 'var(--text-primary)' }}>
            Expiry Alerts
          </span>
          {criticalCount > 0 && (
            <span
              className="rounded-[10px] px-2 py-0.5 text-xs font-semibold"
              style={{ background: 'var(--danger)', color: '#fff' }}
            >
              {criticalCount} Critical
            </span>
          )}
          {warningCount > 0 && (
            <span
              className="rounded-[10px] px-2 py-0.5 text-xs font-semibold"
              style={{ background: 'var(--warning)', color: '#fff' }}
            >
              {warningCount} Warning
            </span>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-lg p-1 transition-colors hover:opacity-60"
          style={{ color: 'var(--text-tertiary)' }}
          aria-label="Dismiss alerts"
        >
          <X size={18} />
        </button>
      </div>

      {/* Alert rows */}
      <div className="flex flex-col gap-2">
        {alerts.map((item) => (
          <AlertRow
            key={item.blob.merkleRoot}
            item={item}
            onClick={() => onBlobClick(item.blob)}
          />
        ))}
      </div>
    </div>
  );
}
