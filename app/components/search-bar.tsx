'use client';
// Wallet address search input with validation and loading state
import { useState, KeyboardEvent } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (address: string) => void;
  loading?: boolean;
}

function isValidAddress(addr: string): boolean {
  return addr.startsWith('0x') && /^0x[0-9a-fA-F]+$/.test(addr) && addr.length > 10;
}

export function SearchBar({ onSearch, loading = false }: SearchBarProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  function submit() {
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Please enter a wallet address.');
      return;
    }
    if (!isValidAddress(trimmed)) {
      setError('Invalid address — must start with 0x and contain hex characters.');
      return;
    }
    setError('');
    onSearch(trimmed);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') submit();
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(''); }}
          onKeyDown={handleKeyDown}
          placeholder="Search wallet address (0x...)"
          disabled={loading}
          className="flex-1 rounded-xl px-4 py-3 text-sm outline-none transition-colors disabled:opacity-50"
          style={{
            background: 'rgba(26,26,26,0.06)',
            border: '1.5px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        />
        <button
          onClick={submit}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: 'var(--text-primary)', color: '#fff' }}
        >
          {loading ? (
            <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <Search size={16} />
          )}
          Explore
        </button>
      </div>
      {error && (
        <p className="text-xs px-1" style={{ color: 'var(--danger)' }}>{error}</p>
      )}
    </div>
  );
}
