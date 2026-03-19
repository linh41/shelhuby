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
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-2">
      <div className="flex gap-4">
        <input
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(''); }}
          onKeyDown={handleKeyDown}
          placeholder="Search wallet address (0x...)"
          disabled={loading}
          className="flex-1 rounded-2xl px-7 py-5 text-lg outline-none transition-colors disabled:opacity-50"
          style={{
            background: 'rgba(26,26,26,0.06)',
            border: '1.5px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        />
        <button
          onClick={submit}
          disabled={loading}
          className="flex items-center gap-3 rounded-2xl px-8 py-5 text-lg font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: 'var(--text-primary)', color: '#fff' }}
        >
          {loading ? (
            <span className="inline-block h-6 w-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <Search size={24} />
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
