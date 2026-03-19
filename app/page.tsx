'use client';
// Landing page — hero layout with search navigating to /dashboard
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { type NetworkId } from '@/app/types';
import { NetworkSwitcher } from '@/app/components/network-switcher';

const DEMO_ADDRESS = '0x1a8b4c2d9e3f7a1b5c8d2e6f9a3b7c1d4e8f2a9b';

function isValidAddress(addr: string): boolean {
  return addr.startsWith('0x') && /^0x[0-9a-fA-F]+$/.test(addr) && addr.length > 10;
}

export default function LandingPage() {
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState<NetworkId>('shelbynet');
  const [error, setError] = useState('');

  function handleExplore() {
    const trimmed = address.trim();
    if (!trimmed) {
      setError('Please enter a wallet address.');
      return;
    }
    if (!isValidAddress(trimmed)) {
      setError('Invalid address — must start with 0x and contain hex characters.');
      return;
    }
    setError('');
    router.push(`/dashboard?address=${encodeURIComponent(trimmed)}&network=${network}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleExplore();
  }

  function handleDemoWallet() {
    setAddress(DEMO_ADDRESS);
    setError('');
    router.push(`/dashboard?address=${encodeURIComponent(DEMO_ADDRESS)}&network=${network}`);
  }

  return (
    <main
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'var(--page-bg)', padding: 'var(--bento-gap)' }}
    >
      {/* Decorative diagonal stripes */}
      <div
        className="absolute rounded-lg opacity-[0.12]"
        style={{ width: 400, height: 80, background: 'var(--accent)', transform: 'rotate(30deg)', top: 50, left: -80 }}
      />
      <div
        className="absolute rounded-lg opacity-[0.10]"
        style={{ width: 500, height: 90, background: 'var(--accent)', transform: 'rotate(-28deg)', bottom: 50, right: -100 }}
      />
      <div
        className="absolute rounded-lg opacity-[0.08]"
        style={{ width: 350, height: 70, background: 'var(--accent)', transform: 'rotate(32deg)', top: -30, right: -50 }}
      />
      <div
        className="absolute rounded-lg opacity-[0.14]"
        style={{ width: 300, height: 60, background: 'var(--accent)', transform: 'rotate(-30deg)', bottom: 100, left: -50 }}
      />

      {/* Header */}
      <header
        className="relative z-10 flex items-center justify-between rounded-2xl px-6 py-3 mb-1.5"
        style={{ background: 'var(--card-default)', borderRadius: 'var(--card-radius)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl font-medium tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Shehuby
          </span>
          <span className="text-sm hidden sm:block" style={{ color: 'var(--text-tertiary)' }}>
            Shelby Protocol Explorer
          </span>
        </div>
        <NetworkSwitcher network={network} onChange={setNetwork} />
      </header>

      {/* Hero */}
      <div
        className="relative z-10 flex-1 flex flex-col md:flex-row rounded-2xl overflow-hidden"
        style={{ background: 'var(--card-default)', borderRadius: 'var(--card-radius-lg)', minHeight: 560 }}
      >
        {/* Left: 60% */}
        <div className="flex-[3] flex flex-col justify-center px-10 py-14 gap-6 md:gap-8" style={{ padding: '56px 48px' }}>
          {/* Label */}
          <span
            className="text-xs font-medium uppercase tracking-[2px]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Storage Explorer
          </span>

          {/* Heading */}
          <h1
            className="text-4xl md:text-[68px] font-normal leading-[1.02] tracking-tight"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.5px' }}
          >
            Explore On-Chain<br />Storage Analytics
          </h1>

          {/* Subtitle */}
          <p
            className="text-base max-w-md leading-relaxed"
            style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}
          >
            Visualize wallet storage activity, track blob usage across the Shelby Protocol network,
            and dive deep into on-chain data.
          </p>

          {/* Search bar — matches .pen: elevated bg, pink button */}
          <div className="flex flex-col gap-2 max-w-lg">
            <div
              className="flex items-center gap-1 rounded-xl p-1"
              style={{ background: 'var(--card-elevated)' }}
            >
              <input
                type="text"
                value={address}
                onChange={(e) => { setAddress(e.target.value); setError(''); }}
                onKeyDown={handleKeyDown}
                placeholder="Search wallet address (0x...)"
                className="flex-1 bg-transparent rounded-lg px-4 py-3 text-[15px] outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
              <button
                onClick={handleExplore}
                className="flex items-center gap-2 rounded-[10px] px-6 py-3 text-sm font-bold transition-opacity hover:opacity-90"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                Explore
              </button>
            </div>
            {error && (
              <p className="text-xs px-1" style={{ color: 'var(--danger)' }}>{error}</p>
            )}
          </div>

          {/* Demo wallet link */}
          <div>
            <button
              onClick={handleDemoWallet}
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--accent-line)' }}
            >
              Try demo wallet →  <span className="font-mono">{DEMO_ADDRESS.slice(0, 6)}...{DEMO_ADDRESS.slice(-4)}</span>
            </button>
          </div>
        </div>

        {/* Right: 40% — mesh gradient panel with decorative cards */}
        <div
          className="hidden md:flex flex-[2] items-center justify-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #2D1E14 0%, #3D2B20 25%, #5A2040 50%, #FF69B4 75%, #2D1E14 100%)',
          }}
        >
          {/* Back card 1 — pink */}
          <div
            className="absolute rounded-2xl"
            style={{
              width: 280, height: 370,
              background: 'var(--accent)',
              transform: 'rotate(12deg)',
              top: '18%', left: '15%',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            }}
          />
          {/* Back card 2 — deep pink */}
          <div
            className="absolute rounded-2xl"
            style={{
              width: 280, height: 370,
              background: 'var(--accent-deep)',
              transform: 'rotate(-7deg)',
              top: '20%', left: '18%',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            }}
          />
          {/* Main floating card */}
          <div
            className="absolute z-10 rounded-2xl flex flex-col overflow-hidden"
            style={{
              width: 280, height: 370,
              background: 'var(--card-elevated)',
              transform: 'rotate(2deg)',
              top: '22%', left: '22%',
              boxShadow: '0 14px 36px rgba(0,0,0,0.08)',
            }}
          >
            {/* Avatar placeholder */}
            <div
              className="w-full flex-1"
              style={{
                background: 'linear-gradient(180deg, #FF69B440 0%, var(--card-elevated) 100%)',
                minHeight: 200,
              }}
            />
            {/* Name bar */}
            <div className="flex flex-col items-center justify-center gap-1 px-3 py-5">
              <span className="text-[22px] font-bold" style={{ color: 'var(--text-primary)' }}>LinhLinh</span>
              <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>from @linh41 with love</span>
            </div>
          </div>

          {/* Decorative dots */}
          <div className="absolute rounded-full opacity-35" style={{ width: 14, height: 14, background: 'var(--accent)', top: '19%', left: '10%' }} />
          <div className="absolute rounded-full opacity-45" style={{ width: 10, height: 10, background: 'var(--accent-line)', top: '35%', right: '5%' }} />
          <div className="absolute rounded-full opacity-35" style={{ width: 18, height: 18, background: 'var(--accent-dark)', bottom: '10%', right: '8%' }} />
        </div>
      </div>
    </main>
  );
}
