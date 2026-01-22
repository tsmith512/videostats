// Bucket calculation and aggregation logic

import { ViewRange } from './types';

export const BUCKET_SIZE = 5; // seconds

/**
 * Calculate which buckets are affected by a viewing range
 */
export function calculateAffectedBuckets(startTime: number, endTime: number): number[] {
  const firstBucket = Math.floor(startTime / BUCKET_SIZE) * BUCKET_SIZE;
  const lastBucket = Math.floor(endTime / BUCKET_SIZE) * BUCKET_SIZE;
  
  const buckets: number[] = [];
  for (let bucket = firstBucket; bucket <= lastBucket; bucket += BUCKET_SIZE) {
    buckets.push(bucket);
  }
  
  return buckets;
}

/**
 * Process multiple ranges and return deduplicated bucket updates
 * Returns a Map of bucket -> increment count
 */
export function aggregateRangesToBuckets(ranges: ViewRange[]): Map<number, number> {
  const bucketUpdates = new Map<number, number>();
  
  for (const range of ranges) {
    const affectedBuckets = calculateAffectedBuckets(range.startTime, range.endTime);
    
    for (const bucket of affectedBuckets) {
      const currentCount = bucketUpdates.get(bucket) || 0;
      bucketUpdates.set(bucket, currentCount + 1);
    }
  }
  
  return bucketUpdates;
}

/**
 * Format bucket timestamp for display (e.g., "0:05", "1:30")
 */
export function formatBucketTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
