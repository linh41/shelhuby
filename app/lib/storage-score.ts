// Storage score calculator — composite 0-100 score based on blob activity
import { type BlobMetadata } from '@/app/types';
import { getBlobStatus } from '@/app/lib/utils';

// Normalization thresholds (reasonable upper bounds → score of 100)
const THRESHOLDS = {
  blobCount: 100,          // 100+ blobs → full weight
  totalSizeBytes: 10e9,    // 10 GB → full weight
  weeklyUploads: 10,       // 10 uploads/week → full weight
  activeDurationDays: 365, // 1 year of activity → full weight
};

function normalize(value: number, max: number): number {
  return Math.min(value / max, 1) * 100;
}

/**
 * Calculate a 0-100 storage score from blob history.
 *
 * Score = (blob_count × 0.30) + (total_size × 0.25) + (upload_frequency × 0.25) + (active_duration × 0.20)
 */
export function calculateStorageScore(blobs: BlobMetadata[]): number {
  if (!blobs.length) return 0;

  // Count only non-expired blobs for active metrics
  const activeBlobs = blobs.filter((b) => getBlobStatus(b.expiryTimestamp) !== 'expired');

  // Weight 1: Blob count (30%)
  const blobCountScore = normalize(activeBlobs.length, THRESHOLDS.blobCount);

  // Weight 2: Total storage size (25%)
  const totalBytes = blobs.reduce((sum, b) => sum + (b.size ?? 0), 0);
  const sizeScore = normalize(totalBytes, THRESHOLDS.totalSizeBytes);

  // Weight 3: Upload frequency — uploads in last 7 days (25%)
  const sevenDaysAgo = Date.now() / 1000 - 7 * 24 * 60 * 60;
  const recentUploads = blobs.filter((b) => b.uploadTimestamp >= sevenDaysAgo).length;
  const frequencyScore = normalize(recentUploads, THRESHOLDS.weeklyUploads);

  // Weight 4: Active duration — days between first and most recent upload (20%)
  const timestamps = blobs.map((b) => b.uploadTimestamp).filter(Boolean);
  let durationScore = 0;
  if (timestamps.length >= 2) {
    const minTs = Math.min(...timestamps);
    const maxTs = Math.max(...timestamps);
    const durationDays = (maxTs - minTs) / (60 * 60 * 24);
    durationScore = normalize(durationDays, THRESHOLDS.activeDurationDays);
  }

  const score =
    blobCountScore * 0.30 +
    sizeScore * 0.25 +
    frequencyScore * 0.25 +
    durationScore * 0.20;

  return Math.round(Math.min(score, 100));
}
