'use client';
// Slide-in drawer showing full blob metadata + quick actions — Shelby dark brown style
import { useEffect } from 'react';
import { X, ExternalLink, Download, Compass } from 'lucide-react';
import { type BlobMetadata, type NetworkId } from '@/app/types';
import {
  truncateAddress,
  formatBytes,
  formatDate,
  formatCurrency,
  getBlobStatus,
  getBlobUrl,
  getExplorerUrl,
  getShareUrl,
} from '@/app/lib/utils';
import { CopyButton } from '@/app/components/ui/copy-button';
import { BlobTypeBadge } from '@/app/components/blob-timeline/blob-type-badge';

interface BlobInspectorProps {
  blob: BlobMetadata | null;
  network: NetworkId;
  onClose: () => void;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active:          { bg: '#1A382822', text: '#2ECC71', label: 'Active' },
  'expiring-soon': { bg: '#3D2D1A22', text: '#F39C12', label: 'Expiring' },
  expired:         { bg: '#3D1A1A22', text: '#E74C3C', label: 'Expired' },
  pending:         { bg: 'rgba(245,240,235,0.05)', text: 'var(--text-tertiary)', label: 'Pending' },
};

function getDaysRemaining(expiryTimestamp: number): string {
  if (!expiryTimestamp) return 'N/A';
  const ms = expiryTimestamp > 1e12 ? expiryTimestamp : expiryTimestamp * 1000;
  const diff = ms - Date.now();
  if (diff <= 0) return 'Expired';
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return `${days}d left`;
}

function MetaRow({ label, value, valueColor }: { label: string; value: React.ReactNode; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      <span className="text-[13px]" style={{ color: valueColor ?? 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function RefBlock({ label, value, isLink }: { label: string; value: string; isLink?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="text-[10px] uppercase tracking-[1px] font-medium"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {label}
      </span>
      <div className="flex items-center gap-1">
        <span
          className="text-[13px] truncate"
          style={{ color: isLink ? 'var(--accent)' : 'var(--text-primary)' }}
        >
          {truncateAddress(value)}
        </span>
        <CopyButton text={value} />
      </div>
    </div>
  );
}

export function BlobInspector({ blob, network, onClose }: BlobInspectorProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!blob) return null;

  const status = getBlobStatus(blob.expiryTimestamp);
  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  const blobUrl = getBlobUrl(blob.owner, blob.name, network);
  const explorerUrl = getExplorerUrl(blob.txHash, network);
  const shareUrl = getShareUrl(blob.owner, blob.name, network);
  const category = blob.classification?.category ?? 'unknown';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(45,30,20,0.7)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        className="fixed right-0 top-0 h-full z-50 flex flex-col overflow-hidden"
        style={{
          width: 'min(448px, 100vw)',
          background: 'var(--card-default)',
          borderRadius: 'var(--card-radius-lg) 0 0 var(--card-radius-lg)',
          animation: 'slideInRight 280ms ease forwards',
        }}
      >
        {/* Accent bar at top */}
        <div style={{
          height: 4,
          background: 'linear-gradient(90deg, var(--accent), var(--accent-deep), transparent)',
        }} />

        {/* Content area with padding matching .pen */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-6 p-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Blob Inspector
            </span>
            <button
              onClick={onClose}
              className="shrink-0 rounded-lg flex items-center justify-center transition-colors hover:opacity-60"
              style={{
                width: 32, height: 32,
                background: 'var(--card-elevated)',
                border: '1px solid rgba(255,105,180,0.15)',
                color: 'var(--text-secondary)',
              }}
              aria-label="Close inspector"
            >
              <X size={16} />
            </button>
          </div>

          {/* Blob name + badges */}
          <div className="flex flex-col gap-2">
            <span
              className="text-lg font-bold truncate"
              style={{ color: 'var(--text-primary)' }}
              title={blob.name}
            >
              {blob.name || 'Unnamed Blob'}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-xs px-2.5 py-1 rounded-md font-medium"
                style={{ background: statusStyle.bg, color: statusStyle.text }}
              >
                {statusStyle.label}
              </span>
              <BlobTypeBadge category={category} />
            </div>
          </div>

          {/* Preview placeholder */}
          <div
            className="rounded-xl flex items-center justify-center"
            style={{
              height: 220,
              background: 'var(--card-elevated)',
              border: '1px solid rgba(255,105,180,0.19)',
              borderRadius: 12,
            }}
          >
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Preview</span>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: '#5A4838' }} />

          {/* Metadata section */}
          <div className="flex flex-col">
            <span className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Metadata</span>
            <MetaRow label="Size" value={formatBytes(blob.size)} />
            <MetaRow label="Upload Date" value={formatDate(blob.uploadTimestamp)} />
            <MetaRow
              label="Expiry Date"
              value={`${formatDate(blob.expiryTimestamp)} · ${getDaysRemaining(blob.expiryTimestamp)}`}
              valueColor="var(--warning)"
            />
            <MetaRow label="Encoding" value={blob.encoding || 'N/A'} />
            <MetaRow label="Storage Cost" value={formatCurrency(blob.storageCost, 'SUSD')} />
            <MetaRow label="Gas Fee" value={formatCurrency(blob.gasFee, 'APT')} />
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: '#5A4838' }} />

          {/* References section */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>References</span>
            <RefBlock label="Blob Commitment" value={blob.merkleRoot} />
            <RefBlock label="Owner" value={blob.owner} />
            <RefBlock label="TX Hash" value={blob.txHash} isLink />
            <RefBlock label="Blob URL" value={blobUrl} isLink />
            <RefBlock label="Share Link" value={shareUrl} isLink />
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: '#5A4838' }} />

          {/* Action buttons — matches .pen: pink Open Blob, elevated others */}
          <div className="flex flex-col gap-2.5">
            <a
              href={blobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-[10px] py-3 text-[13px] font-bold transition-opacity hover:opacity-80"
              style={{ background: 'var(--accent)', color: '#fff', height: 42 }}
            >
              <ExternalLink size={14} />
              Open Blob
            </a>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-[10px] py-3 text-[13px] font-medium transition-colors hover:opacity-70"
              style={{
                background: 'var(--card-elevated)',
                border: '1px solid #5A4838',
                color: 'var(--text-primary)',
                height: 42,
              }}
            >
              <Compass size={14} style={{ color: 'var(--text-secondary)' }} />
              TX Explorer
            </a>
            <a
              href={blobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-[10px] py-3 text-[13px] font-medium transition-colors hover:opacity-70"
              style={{
                background: 'var(--card-elevated)',
                border: '1px solid #5A4838',
                color: 'var(--text-primary)',
                height: 42,
              }}
            >
              <Download size={14} style={{ color: 'var(--text-secondary)' }} />
              Download
            </a>
          </div>
        </div>

        {/* Decorative stripes (absolute) */}
        <div
          className="absolute rounded-2xl opacity-[0.08] pointer-events-none"
          style={{ width: 220, height: 500, background: 'var(--accent)', transform: 'rotate(30deg)', top: -80, right: -40 }}
        />
        <div
          className="absolute rounded-2xl opacity-[0.06] pointer-events-none"
          style={{ width: 200, height: 450, background: 'var(--accent)', transform: 'rotate(-28deg)', bottom: -60, left: -60 }}
        />
      </aside>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
