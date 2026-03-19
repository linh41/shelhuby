// Formatting and utility helpers for Shehuby Dashboard
import { type BlobStatus, type NetworkId } from '@/app/types';
import { NETWORKS } from '@/app/lib/networks';

// ── Address ───────────────────────────────────────────────────────────────────

// Pad Aptos address to full 66-char format (0x + 64 hex digits)
export function padAddress(addr: string): string {
  if (!addr) return addr;
  const hex = addr.startsWith('0x') ? addr.slice(2) : addr;
  return '0x' + hex.padStart(64, '0');
}

export function truncateAddress(addr: string): string {
  if (!addr || addr.length < 12) return addr ?? '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// ── Bytes ─────────────────────────────────────────────────────────────────────

export function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const idx = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, idx);
  return `${val.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
}

// ── Dates ─────────────────────────────────────────────────────────────────────

export function formatDate(timestamp: number): string {
  if (!timestamp) return 'Unknown';
  // Support both seconds and milliseconds
  const ms = timestamp > 1e12 ? timestamp : timestamp * 1000;
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getTimeAgo(timestamp: number): string {
  if (!timestamp) return 'Unknown';
  const ms = timestamp > 1e12 ? timestamp : timestamp * 1000;
  const diffMs = Date.now() - ms;
  const diffSecs = Math.floor(diffMs / 1000);

  if (diffSecs < 60) return `${diffSecs}s ago`;
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} months ago`;
  return `${Math.floor(diffMonths / 12)} years ago`;
}

// ── Currency ──────────────────────────────────────────────────────────────────

export function formatCurrency(amount: number, symbol = ''): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
  return symbol ? `${formatted} ${symbol}` : formatted;
}

// ── Clipboard ─────────────────────────────────────────────────────────────────

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older browsers
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    return true;
  } catch {
    return false;
  }
}

// ── Blob Status ───────────────────────────────────────────────────────────────

const EXPIRING_SOON_THRESHOLD_DAYS = 7;

export function getBlobStatus(expiryTimestamp: number): BlobStatus {
  if (!expiryTimestamp) return 'pending';
  const ms = expiryTimestamp > 1e12 ? expiryTimestamp : expiryTimestamp * 1000;
  const now = Date.now();
  if (ms < now) return 'expired';
  const daysUntilExpiry = (ms - now) / (1000 * 60 * 60 * 24);
  if (daysUntilExpiry <= EXPIRING_SOON_THRESHOLD_DAYS) return 'expiring-soon';
  return 'active';
}

// ── URLs ──────────────────────────────────────────────────────────────────────

export function getBlobUrl(owner: string, blobName: string, network: NetworkId): string {
  const base = NETWORKS[network].shelbyRpc;
  return `${base}/blobs/${owner}/${encodeURIComponent(blobName)}`;
}

export function getExplorerUrl(txHash: string, network: NetworkId): string {
  const base = NETWORKS[network].explorerBase;
  return `${base}/txn/${txHash}`;
}

export function getShareUrl(owner: string, blobName: string, network: NetworkId): string {
  const base = NETWORKS[network].explorerBase;
  return `${base}/blob/${owner}/${encodeURIComponent(blobName)}`;
}
