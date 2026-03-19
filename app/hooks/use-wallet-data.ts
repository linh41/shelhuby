'use client';
// Custom hook that fires parallel API calls and merges results into WalletData
import { useState, useEffect, useCallback, useRef } from 'react';
import { type NetworkId, type WalletData, type WalletProfile } from '@/app/types';
import {
  fetchWalletBalances,
  fetchBlobEvents,
  buildCostHistory,
} from '@/app/lib/api';
import { classifyBlob } from '@/app/lib/classifier';
import { calculateStorageScore } from '@/app/lib/storage-score';

// Bump version when query/parsing logic changes to invalidate stale caches
const SESSION_CACHE_PREFIX = 'shehuby:v2:wallet:';

function getCachedData(key: string): WalletData | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as WalletData) : null;
  } catch {
    return null;
  }
}

function setCachedData(key: string, data: WalletData): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

export interface UseWalletDataResult {
  data: WalletData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useWalletData(
  address: string | null,
  network: NetworkId
): UseWalletDataResult {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Track current fetch to avoid stale updates
  const fetchIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    if (!address?.trim()) {
      setData(null);
      setError(null);
      return;
    }

    const cacheKey = `${SESSION_CACHE_PREFIX}${network}:${address}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    setError(null);

    try {
      // Fire parallel API calls
      const [balances, blobs] = await Promise.all([
        fetchWalletBalances(address, network),
        fetchBlobEvents(address, network),
      ]);

      if (fetchId !== fetchIdRef.current) return; // stale, discard

      // Classify blobs (sync L1/L3/L4)
      const classifiedBlobs = blobs.map((blob) => ({
        ...blob,
        classification: classifyBlob(blob, network),
      }));

      // Compute aggregates
      const totalStorageBytes = classifiedBlobs.reduce((s, b) => s + (b.size ?? 0), 0);
      const totalShelbyUsdSpent = classifiedBlobs.reduce((s, b) => s + (b.storageCost ?? 0), 0);
      const totalAptSpent = classifiedBlobs.reduce((s, b) => s + (b.gasFee ?? 0), 0);
      const timestamps = classifiedBlobs.map((b) => b.uploadTimestamp).filter(Boolean);
      const firstActiveDate = timestamps.length ? Math.min(...timestamps) : null;
      const storageScore = calculateStorageScore(classifiedBlobs);

      const profile: WalletProfile = {
        address,
        network,
        shelbyUsdBalance: balances.shelbyUsdBalance,
        aptBalance: balances.aptBalance,
        totalBlobs: classifiedBlobs.length,
        totalStorageBytes,
        totalShelbyUsdSpent,
        totalAptSpent,
        firstActiveDate,
        storageScore,
      };

      const costHistory = buildCostHistory(classifiedBlobs);

      const walletData: WalletData = {
        profile,
        blobs: classifiedBlobs,
        costHistory,
      };

      setCachedData(cacheKey, walletData);
      setData(walletData);
    } catch (err) {
      if (fetchId !== fetchIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load wallet data');
    } finally {
      if (fetchId === fetchIdRef.current) setLoading(false);
    }
  }, [address, network]);

  // Refetch clears cache for this key before re-fetching
  const refetch = useCallback(() => {
    if (!address?.trim()) return;
    const cacheKey = `${SESSION_CACHE_PREFIX}${network}:${address}`;
    if (typeof sessionStorage !== 'undefined') {
      try { sessionStorage.removeItem(cacheKey); } catch { /* ignore */ }
    }
    fetchData();
  }, [address, network, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}
