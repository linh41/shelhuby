'use client';
// Copy-to-clipboard button that shows a checkmark for 2s after copying
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard } from '@/app/lib/utils';

interface CopyButtonProps {
  text: string;
  className?: string;
}

export function CopyButton({ text, className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
      className={`inline-flex items-center justify-center rounded p-1 transition-colors ${className}`}
      style={{ color: 'var(--text-tertiary)' }}
    >
      {copied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
    </button>
  );
}
