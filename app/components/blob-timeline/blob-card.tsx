'use client';
// Individual blob entry card with left-colored border, status, and type badge
import { type BlobMetadata } from '@/app/types';
import { formatBytes, getTimeAgo, getBlobStatus } from '@/app/lib/utils';
import { classifyBlob } from '@/app/lib/classifier';
import { BlobTypeBadge, getCategoryColor } from './blob-type-badge';

interface BlobCardProps {
  blob: BlobMetadata;
  network: 'testnet' | 'shelbynet';
  onClick: (blob: BlobMetadata) => void;
}

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  active:          { label: 'Active',        color: 'var(--success)' },
  'expiring-soon': { label: 'Expiring Soon', color: 'var(--warning)' },
  expired:         { label: 'Expired',       color: 'var(--danger)'  },
  pending:         { label: 'Pending',       color: 'var(--text-tertiary)' },
};

function truncateName(name: string, max = 32): string {
  if (name.length <= max) return name;
  const ext = name.includes('.') ? `.${name.split('.').pop()}` : '';
  return `${name.slice(0, max - ext.length - 1)}…${ext}`;
}

export function BlobCard({ blob, network, onClick }: BlobCardProps) {
  const classification = blob.classification ?? classifyBlob(blob, network);
  const status         = getBlobStatus(blob.expiryTimestamp);
  const statusStyle    = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  const borderColor    = getCategoryColor(classification.category);

  return (
    <button
      type="button"
      onClick={() => onClick(blob)}
      className="w-full text-left px-0 py-3.5 flex items-center gap-3 transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      style={{
        background: 'transparent',
        borderBottom: '1px solid #5A4838',
        borderRadius: 0,
      }}
    >
      {/* Color dot for blob type */}
      <span
        className="h-2.5 w-2.5 rounded-full shrink-0"
        style={{ background: borderColor }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }} title={blob.name}>
          {truncateName(blob.name)}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          {classification.category.charAt(0).toUpperCase() + classification.category.slice(1)} · {formatBytes(blob.size)} · {getTimeAgo(blob.uploadTimestamp)}
        </p>
      </div>
      <span className="text-xs font-medium shrink-0" style={{ color: statusStyle.color }}>
        {statusStyle.label}
      </span>
    </button>
  );
}
