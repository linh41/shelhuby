'use client';
// Wallet profile card showing balances, blob stats, and storage score
import { useMemo } from 'react';
import { type WalletProfile, type BlobMetadata, type BlobCategory, type NetworkId } from '@/app/types';
import { NETWORKS } from '@/app/lib/networks';
import { truncateAddress, formatBytes, formatDate, formatCurrency } from '@/app/lib/utils';
import { classifyBlob } from '@/app/lib/classifier';
import { Skeleton } from '@/app/components/ui/skeleton';
import { CopyButton } from '@/app/components/ui/copy-button';
import { StorageScoreRing } from '@/app/components/storage-score-ring';
import { HoloBalanceCard } from '@/app/components/shelbyusd-balance-card';

interface ProfileCardProps {
  profile: WalletProfile | null;
  blobs?: BlobMetadata[];
  network?: NetworkId;
  loading?: boolean;
}

// ── Skeleton placeholder ───────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div
      className="rounded-2xl p-8 flex flex-col gap-6"
      style={{ background: 'var(--card-default)', borderRadius: 'var(--card-radius)' }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-24 w-24 rounded-full" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ── Metric card — matches .pen m1-m7 cards ─────────────────────────────────────

function MetricCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      className="flex flex-col gap-1 rounded-lg py-4 px-5"
      style={{
        background: 'rgba(245,240,235,0.03)',
        transition: 'background-color 0.2s ease',
      }}
    >
      <span
        className="text-[11px] uppercase tracking-[1px] font-medium"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {label}
      </span>
      {/* tabular-nums prevents layout shift when numbers update */}
      <span className="tabular-nums text-[28px] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  );
}

// ── Blob distribution bar ──────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<BlobCategory, string> = {
  image:     '#3498DB',
  video:     '#9B59B6',
  audio:     '#E91E63',
  document:  '#2ECC71',
  data:      '#F39C12',
  code:      '#1ABC9C',
  archive:   '#95A5A6',
  'ai-model':'#E74C3C',
  unknown:   '#BDC3C7',
};

const CATEGORY_LABELS: Record<BlobCategory, string> = {
  image: 'Image', video: 'Video', audio: 'Audio', document: 'Document',
  data: 'Data', code: 'Code', archive: 'Archive', 'ai-model': 'AI Model',
  unknown: 'Other',
};

interface DistItem { label: string; pct: number; color: string }

function computeDistribution(blobs: BlobMetadata[], network: NetworkId): DistItem[] {
  if (blobs.length === 0) return [];
  const counts = new Map<BlobCategory, number>();
  for (const blob of blobs) {
    const classification = blob.classification ?? classifyBlob(blob, network);
    const cat = classification.category;
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }
  const total = blobs.length;
  const items: DistItem[] = [];
  for (const [cat, count] of counts) {
    items.push({
      label: CATEGORY_LABELS[cat] ?? 'Other',
      pct: Math.round((count / total) * 100),
      color: CATEGORY_COLORS[cat] ?? '#BDC3C7',
    });
  }
  // Sort descending by percentage
  items.sort((a, b) => b.pct - a.pct);
  return items;
}

function BlobDistributionBar({ items }: { items: DistItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2.5">
      <span
        className="text-[11px] uppercase tracking-[2px] font-medium"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Blob Type Distribution
      </span>
      {/* Segmented bar */}
      <div className="flex rounded-md overflow-hidden h-3">
        {items.map((item) => (
          <div
            key={item.label}
            style={{ width: `${item.pct}%`, background: item.color, flexShrink: 0 }}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
        {items.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: item.color }} />
            {item.label} {item.pct}%
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ProfileCard({ profile, blobs = [], network = 'shelbynet', loading = false }: ProfileCardProps) {
  if (loading) return <ProfileSkeleton />;
  if (!profile) return null;

  const networkName = NETWORKS[profile.network]?.name ?? profile.network;
  const distItems = useMemo(() => computeDistribution(blobs, network), [blobs, network]);

  return (
    <div
      className="rounded-2xl flex flex-col gap-6"
      style={{ background: 'var(--card-default)', borderRadius: 'var(--card-radius)', padding: '32px 48px' }}
    >
      {/* Header row: address + network badge + score ring */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {truncateAddress(profile.address)}
            </span>
            <CopyButton text={profile.address} />
          </div>
          <span
            className="inline-flex items-center gap-2 w-fit rounded-xl px-3.5 py-1.5 text-sm font-medium"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            <span className="h-2 w-2 rounded-full bg-green-400" />
            {networkName}
          </span>
        </div>
        <StorageScoreRing score={profile.storageScore} size={140} />
      </div>

      {/* Metrics grid — 4 columns top, 3 columns bottom */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <HoloBalanceCard label="ShelbyUSD Balance" value={formatCurrency(profile.shelbyUsdBalance, 'SUSD')} logoSrc="/shelby-logo.jpg" logoAlt="ShelbyUSD" />
        <HoloBalanceCard label="APT Balance" value={formatCurrency(profile.aptBalance, 'APT')} logoSrc="/aptos-logo.png" logoAlt="Aptos" glowColor="rgba(76, 175, 80, 0.5)" />
        <MetricCard label="Total Blobs" value={profile.totalBlobs.toLocaleString()} />
        <MetricCard label="Total Storage" value={formatBytes(profile.totalStorageBytes)} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <MetricCard label="ShelbyUSD Spent" value={formatCurrency(profile.totalShelbyUsdSpent, 'SUSD')} />
        <MetricCard label="APT Gas Spent" value={formatCurrency(profile.totalAptSpent, 'APT', 6)} />
        {profile.firstActiveDate && (
          <MetricCard label="First Active" value={formatDate(profile.firstActiveDate)} />
        )}
      </div>

      {/* Blob type distribution */}
      <BlobDistributionBar items={distItems} />
    </div>
  );
}
