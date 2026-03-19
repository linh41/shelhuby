'use client';
// Toggle between Testnet and Shelbynet networks
import { type NetworkId } from '@/app/types';

interface NetworkSwitcherProps {
  network: NetworkId;
  onChange: (network: NetworkId) => void;
}

const OPTIONS: { id: NetworkId; label: string }[] = [
  { id: 'shelbynet', label: 'Shelbynet' },
  { id: 'testnet', label: 'Testnet' },
];

export function NetworkSwitcher({ network, onChange }: NetworkSwitcherProps) {
  return (
    <div
      className="flex gap-1 rounded-lg p-0.5"
      style={{ background: 'var(--card-elevated)' }}
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className="rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors"
          style={
            network === opt.id
              ? { background: 'var(--card-default)', color: 'var(--text-primary)' }
              : { background: 'transparent', color: 'var(--text-tertiary)' }
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
