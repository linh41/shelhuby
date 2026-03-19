'use client';
// Dashboard page — wallet analytics, loaded from URL search params
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { Search } from 'lucide-react';
import { type NetworkId, type BlobMetadata } from '@/app/types';
import { useWalletData } from '@/app/hooks/use-wallet-data';
import { ProfileCard } from '@/app/components/profile-card';
import { TimelineContainer } from '@/app/components/blob-timeline/timeline-container';
import { BlobInspector } from '@/app/components/blob-inspector';
import { CostContainer } from '@/app/components/cost-breakdown/cost-container';
import { ExpiryAlerts } from '@/app/components/expiry-alerts';

// Heatmap-shaped skeleton shown while timeline data loads
function TimelineLoadingSkeleton() {
  return (
    <div
      className="rounded-2xl flex flex-col gap-5"
      style={{ background: 'var(--card-default)', borderRadius: 'var(--card-radius)', padding: 32 }}
    >
      {/* Header row */}
      <div className="flex items-center gap-3">
        <div className="h-6 w-32 rounded-lg animate-pulse" style={{ background: 'var(--card-elevated)' }} />
        <div className="h-5 w-14 rounded-lg animate-pulse" style={{ background: 'var(--card-elevated)' }} />
        <div className="flex-1" />
        <div className="h-7 w-28 rounded-lg animate-pulse" style={{ background: 'var(--card-elevated)' }} />
      </div>
      {/* Filter row */}
      <div className="flex gap-2">
        {[60, 52, 52, 52].map((w, i) => (
          <div key={i} className="h-7 rounded-xl animate-pulse" style={{ width: w, background: 'var(--card-elevated)' }} />
        ))}
      </div>
      {/* Heatmap grid — 12 month columns × 7 week rows */}
      <div className="flex gap-1.5 overflow-hidden">
        {Array.from({ length: 12 }).map((_, col) => (
          <div key={col} className="flex flex-col gap-1.5">
            {Array.from({ length: 7 }).map((_, row) => (
              <div
                key={row}
                className="rounded-sm animate-pulse"
                style={{
                  width: 12,
                  height: 12,
                  background: 'var(--card-elevated)',
                  opacity: Math.random() > 0.6 ? 0.6 : 0.25,
                  animationDelay: `${(col * 7 + row) * 20}ms`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialAddress = searchParams.get('address') ?? '';
  const initialNetwork = (searchParams.get('network') ?? 'shelbynet') as NetworkId;

  const [address, setAddress] = useState<string | null>(initialAddress || null);
  const [network, setNetwork] = useState<NetworkId>(initialNetwork);
  const [searchInput, setSearchInput] = useState(initialAddress);
  const [selectedBlob, setSelectedBlob] = useState<BlobMetadata | null>(null);

  const { data, loading, error, refetch } = useWalletData(address, network);

  // Sync URL when address/network change
  useEffect(() => {
    if (address) {
      router.replace(`/dashboard?address=${encodeURIComponent(address)}&network=${network}`, { scroll: false });
    }
  }, [address, network, router]);

  function handleSearch() {
    const trimmed = searchInput.trim();
    if (trimmed && trimmed.startsWith('0x') && trimmed.length > 10) {
      setAddress(trimmed);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSearch();
  }

  function handleNetworkChange(net: NetworkId) {
    setNetwork(net);
  }

  return (
    <main
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'var(--page-bg)', padding: 'var(--bento-gap)', gap: 'var(--bento-gap)' }}
    >
      {/* Decorative blurry pink shapes */}
      <div className="absolute opacity-[0.08]" style={{ width: 600, height: 120, background: 'var(--accent)', transform: 'rotate(30deg)', top: 30, left: -80, filter: 'blur(40px)', borderRadius: 60 }} />
      <div className="absolute opacity-[0.10]" style={{ width: 500, height: 100, background: 'var(--accent)', transform: 'rotate(-28deg)', top: -30, right: -50, filter: 'blur(40px)', borderRadius: 50 }} />
      <div className="absolute opacity-[0.06]" style={{ width: 800, height: 140, background: 'var(--accent)', transform: 'rotate(-32deg)', top: 500, left: -150, filter: 'blur(40px)', borderRadius: 70 }} />
      <div className="absolute opacity-[0.12]" style={{ width: 700, height: 110, background: 'var(--accent)', transform: 'rotate(25deg)', bottom: 100, right: -100, filter: 'blur(40px)', borderRadius: 55 }} />
      <div className="absolute opacity-[0.07]" style={{ width: 550, height: 120, background: 'var(--accent)', transform: 'rotate(30deg)', bottom: -50, left: -50, filter: 'blur(40px)', borderRadius: 60 }} />
      <div className="absolute opacity-[0.09]" style={{ width: 500, height: 100, background: 'var(--accent)', transform: 'rotate(-30deg)', bottom: -50, right: 0, filter: 'blur(40px)', borderRadius: 50 }} />

      {/* Header bar */}
      <header
        className="relative z-10 flex flex-wrap items-center gap-3 rounded-2xl"
        style={{ background: 'var(--card-default)', borderRadius: 'var(--card-radius)', padding: '16px 24px' }}
      >
        <button
          onClick={() => router.push('/')}
          className="text-xl font-medium tracking-tight shrink-0 transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-primary)' }}
        >
          Shehuby
        </button>

        {/* Search bar — full-width on mobile, centered with max-width on md+ */}
        <div className="flex-1 flex justify-center order-last md:order-none w-full md:w-auto">
          <div
            className="flex items-center gap-2 rounded-2xl px-3.5 h-8 w-full md:max-w-[360px]"
            style={{ background: 'var(--card-elevated)', border: '1px solid var(--page-bg)' }}
          >
            <Search size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search wallet address (0x...)"
              className="flex-1 bg-transparent text-[13px] outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {/* Network pill switch — matches .pen pillSwitch */}
        <div
          className="flex rounded-[14px] p-0.5 h-7 shrink-0"
          style={{ background: 'rgba(245,240,235,0.05)' }}
        >
          {(['shelbynet', 'testnet'] as NetworkId[]).map((net) => (
            <button
              key={net}
              onClick={() => handleNetworkChange(net)}
              className="rounded-xl px-3 text-xs font-medium transition-colors h-full"
              style={
                network === net
                  ? { background: 'var(--text-primary)', color: 'var(--text-tertiary)' }
                  : { background: 'transparent', color: 'var(--text-tertiary)' }
              }
            >
              {net === 'shelbynet' ? 'Shelbynet' : 'Testnet'}
            </button>
          ))}
        </div>
      </header>

      {/* Error state */}
      {error && !loading && (
        <div
          className="relative z-10 rounded-xl px-4 py-3 flex items-center justify-between gap-4"
          style={{
            background: 'var(--card-default)',
            border: `1.5px solid var(--danger)`,
            borderRadius: 'var(--card-radius)',
          }}
        >
          <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>
          <button
            onClick={refetch}
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
            style={{ border: '1px solid var(--danger)', color: 'var(--danger)' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state — no search yet */}
      {!address && !loading && !error && (
        <div
          className="relative z-10 flex-1 flex flex-col items-center justify-center gap-5 rounded-2xl py-20"
          style={{ background: 'var(--card-default)', borderRadius: 'var(--card-radius-lg)' }}
        >
          <div
            className="rounded-full p-5"
            style={{ background: 'rgba(255,105,180,0.1)' }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
              <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-base font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Explore storage activity
            </p>
            <p className="text-sm max-w-xs" style={{ color: 'var(--text-secondary)' }}>
              Enter a wallet address above to inspect blobs, costs, and expiry status on Shelby Network.
            </p>
          </div>
        </div>
      )}

      {/* Profile card */}
      {(loading || data) && (
        <div className="relative z-10">
          <ProfileCard profile={data?.profile ?? null} loading={loading} />
        </div>
      )}

      {/* Expiry alerts */}
      {data && !loading && data.blobs.length > 0 && (
        <div className="relative z-10">
          <ExpiryAlerts blobs={data.blobs} onBlobClick={setSelectedBlob} />
        </div>
      )}

      {/* No blob activity message */}
      {data && !loading && data.blobs.length === 0 && (
        <div
          className="relative z-10 flex flex-col items-center justify-center gap-4 rounded-2xl py-16"
          style={{ background: 'var(--card-default)', borderRadius: 'var(--card-radius-lg)' }}
        >
          <div className="rounded-full p-4" style={{ background: 'rgba(255,105,180,0.1)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
              <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-base font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              No blob activity found
            </p>
            <p className="text-sm max-w-xs" style={{ color: 'var(--text-secondary)' }}>
              This wallet has no blob storage transactions on the current network. Try switching networks or searching a different address.
            </p>
          </div>
        </div>
      )}

      {/* Two-column layout: timeline (60%) + cost (40%) */}
      {(loading || (data && data.blobs.length > 0)) && (
        <div
          className="relative z-10 flex flex-col md:flex-row items-start"
          style={{ gap: 'var(--bento-gap)' }}
        >
          <div className="w-full md:w-[60%]">
            {data && !loading ? (
              <TimelineContainer blobs={data.blobs} network={network} onBlobClick={setSelectedBlob} />
            ) : (
              <TimelineLoadingSkeleton />
            )}
          </div>
          <div className="w-full md:w-[40%]">
            <CostContainer
              costHistory={data?.costHistory ?? []}
              totalStorageBytes={data?.profile.totalStorageBytes ?? 0}
              totalBlobs={data?.profile.totalBlobs ?? 0}
              loading={loading}
            />
          </div>
        </div>
      )}

      {/* Blob inspector drawer */}
      <BlobInspector blob={selectedBlob} network={network} onClose={() => setSelectedBlob(null)} />
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--page-bg)' }}>
        <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)' }} />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
