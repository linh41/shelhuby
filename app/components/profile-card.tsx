'use client';
// Wallet profile card showing balances, blob stats, and storage score
import { type WalletProfile } from '@/app/types';
import { NETWORKS } from '@/app/lib/networks';
import { truncateAddress, formatBytes, formatDate, formatCurrency } from '@/app/lib/utils';
import { Skeleton } from '@/app/components/ui/skeleton';
import { CopyButton } from '@/app/components/ui/copy-button';
import { StorageScoreRing } from '@/app/components/storage-score-ring';

interface ProfileCardProps {
  profile: WalletProfile | null;
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
      className="flex flex-col gap-1 rounded-lg px-4 py-4"
      style={{ background: 'rgba(245,240,235,0.03)' }}
    >
      <span
        className="text-[11px] uppercase tracking-[1px] font-medium"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {label}
      </span>
      <span className="text-[28px] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  );
}

// ── Blob distribution bar ──────────────────────────────────────────────────────

const DIST_ITEMS = [
  { label: 'Image',    pct: 45, color: '#3498DB' },
  { label: 'Document', pct: 25, color: '#2ECC71' },
  { label: 'Data',     pct: 15, color: '#F39C12' },
  { label: 'Video',    pct: 10, color: '#9B59B6' },
  { label: 'Other',    pct: 5,  color: '#BDC3C7' },
];

function BlobDistributionBar() {
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
        {DIST_ITEMS.map((item) => (
          <div
            key={item.label}
            style={{ width: `${item.pct}%`, background: item.color, flexShrink: 0 }}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
        {DIST_ITEMS.map((item) => (
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

export function ProfileCard({ profile, loading = false }: ProfileCardProps) {
  if (loading) return <ProfileSkeleton />;
  if (!profile) return null;

  const networkName = NETWORKS[profile.network]?.name ?? profile.network;

  return (
    <div
      className="rounded-2xl flex flex-col gap-6"
      style={{ background: 'var(--card-default)', borderRadius: 'var(--card-radius)', padding: '32px 48px' }}
    >
      {/* Header row: address + network badge + score ring */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-base font-normal" style={{ color: 'var(--text-primary)' }}>
              {truncateAddress(profile.address)}
            </span>
            <CopyButton text={profile.address} />
          </div>
          <span
            className="inline-flex items-center gap-1.5 w-fit rounded-xl px-2.5 py-1 text-xs font-medium"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            {networkName}
          </span>
        </div>
        <StorageScoreRing score={profile.storageScore} size={88} />
      </div>

      {/* Metrics grid — 4 columns top, 3 columns bottom */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <MetricCard label="ShelbyUSD Balance" value={formatCurrency(profile.shelbyUsdBalance, 'SUSD')} />
        <MetricCard label="APT Balance" value={formatCurrency(profile.aptBalance, 'APT')} />
        <MetricCard label="Total Blobs" value={profile.totalBlobs.toLocaleString()} />
        <MetricCard label="Total Storage" value={formatBytes(profile.totalStorageBytes)} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <MetricCard label="ShelbyUSD Spent" value={formatCurrency(profile.totalShelbyUsdSpent, 'SUSD')} />
        <MetricCard label="APT Gas Spent" value={formatCurrency(profile.totalAptSpent, 'APT')} />
        {profile.firstActiveDate && (
          <MetricCard label="First Active" value={formatDate(profile.firstActiveDate)} />
        )}
      </div>

      {/* Blob type distribution */}
      <BlobDistributionBar />
    </div>
  );
}
