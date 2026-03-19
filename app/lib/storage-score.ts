// Storage score calculator — composite 0-100 score based on blob activity
import { type BlobMetadata } from '@/app/types';
import { getBlobStatus } from '@/app/lib/utils';

// Normalization thresholds (reasonable upper bounds → score of 100)
const THRESHOLDS = {
  blobCount: 100,          // 100+ blobs → full weight
  totalSizeBytes: 10e9,    // 10 GB → full weight
  weeklyUploads: 10,       // 10 uploads/week → full weight
  activeDurationDays: 365, // 1 year of activity → full weight
  streakDays: 30,          // 30-day streak → full weight
  diverseTypes: 5,         // 5+ distinct file categories → full weight
};

const SECONDS_PER_DAY = 60 * 60 * 24;

// Count consecutive days with uploads ending today (or most recent activity day)
function calculateStreak(timestamps: number[]): number {
  if (!timestamps.length) return 0;

  // Group uploads by day (UTC)
  const activeDays = new Set(
    timestamps.map((ts) => Math.floor(ts / SECONDS_PER_DAY))
  );

  // Start from most recent active day and count backwards
  const sortedDays = Array.from(activeDays).sort((a, b) => b - a);
  let streak = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    if (sortedDays[i] === sortedDays[i - 1] - 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function normalize(value: number, max: number): number {
  return Math.min(value / max, 1) * 100;
}

/**
 * Calculate a 0-100 storage score from blob history.
 *
 * Score = (blob_count × 0.20) + (total_size × 0.20) + (upload_frequency × 0.15) + (active_duration × 0.15) + (daily_streak × 0.15) + (file_diversity × 0.15)
 */
export function calculateStorageScore(blobs: BlobMetadata[]): number {
  if (!blobs.length) return 0;

  // Count only non-expired blobs for active metrics
  const activeBlobs = blobs.filter((b) => getBlobStatus(b.expiryTimestamp) !== 'expired');

  // Weight 1: Blob count (20%)
  const blobCountScore = normalize(activeBlobs.length, THRESHOLDS.blobCount);

  // Weight 2: Total storage size (20%)
  const totalBytes = blobs.reduce((sum, b) => sum + (b.size ?? 0), 0);
  const sizeScore = normalize(totalBytes, THRESHOLDS.totalSizeBytes);

  // Weight 3: Upload frequency — uploads in last 7 days (15%)
  const sevenDaysAgo = Date.now() / 1000 - 7 * SECONDS_PER_DAY;
  const recentUploads = blobs.filter((b) => b.uploadTimestamp >= sevenDaysAgo).length;
  const frequencyScore = normalize(recentUploads, THRESHOLDS.weeklyUploads);

  // Weight 4: Active duration — days between first and most recent upload (15%)
  const timestamps = blobs.map((b) => b.uploadTimestamp).filter(Boolean);
  let durationScore = 0;
  if (timestamps.length >= 2) {
    const minTs = Math.min(...timestamps);
    const maxTs = Math.max(...timestamps);
    const durationDays = (maxTs - minTs) / SECONDS_PER_DAY;
    durationScore = normalize(durationDays, THRESHOLDS.activeDurationDays);
  }

  // Weight 5: Daily activity streak (15%)
  const streakScore = normalize(calculateStreak(timestamps), THRESHOLDS.streakDays);

  // Weight 6: File type diversity — unique blob categories (15%)
  const uniqueCategories = new Set(
    activeBlobs.map((b) => b.classification?.category).filter(Boolean)
  );
  const diversityScore = normalize(uniqueCategories.size, THRESHOLDS.diverseTypes);

  const score =
    blobCountScore * 0.20 +
    sizeScore * 0.20 +
    frequencyScore * 0.15 +
    durationScore * 0.15 +
    streakScore * 0.15 +
    diversityScore * 0.15;

  return Math.round(Math.min(score, 100));
}
