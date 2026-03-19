'use client';
// Reusable pulsing skeleton placeholder for loading states

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{ background: 'rgba(245,240,235,0.08)' }}
    />
  );
}
