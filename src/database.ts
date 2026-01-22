// Database operations for D1

import { HistogramBucket } from './types';

/**
 * Update bucket view counts in the database
 * Uses batch operations for efficiency
 */
export async function updateBuckets(
  db: D1Database,
  videoId: string,
  bucketUpdates: Map<number, number>
): Promise<number> {
  if (bucketUpdates.size === 0) {
    return 0;
  }
  
  const statements: D1PreparedStatement[] = [];
  
  for (const [bucket, incrementBy] of bucketUpdates.entries()) {
    statements.push(
      db.prepare(`
        INSERT INTO video_watch_buckets (video_id, bucket_start, view_count, last_updated)
        VALUES (?, ?, ?, unixepoch())
        ON CONFLICT(video_id, bucket_start) 
        DO UPDATE SET 
          view_count = view_count + ?,
          last_updated = unixepoch()
      `).bind(videoId, bucket, incrementBy, incrementBy)
    );
  }
  
  // D1 batch limit is 1000 statements
  if (statements.length > 1000) {
    throw new Error('Too many bucket updates (maximum: 1000)');
  }
  
  await db.batch(statements);
  
  return statements.length;
}

/**
 * Get histogram data for a video
 */
export async function getHistogram(
  db: D1Database,
  videoId: string
): Promise<HistogramBucket[]> {
  const result = await db.prepare(`
    SELECT bucket_start, view_count
    FROM video_watch_buckets
    WHERE video_id = ?
    ORDER BY bucket_start ASC
  `).bind(videoId).all<HistogramBucket>();
  
  return result.results || [];
}

/**
 * Get total view count for a video across all buckets
 */
export async function getTotalViews(
  db: D1Database,
  videoId: string
): Promise<number> {
  const result = await db.prepare(`
    SELECT SUM(view_count) as total
    FROM video_watch_buckets
    WHERE video_id = ?
  `).bind(videoId).first<{ total: number | null }>();
  
  return result?.total || 0;
}

/**
 * Create or update video metadata
 */
export async function upsertVideoMetadata(
  db: D1Database,
  videoId: string,
  duration: number
): Promise<void> {
  await db.prepare(`
    INSERT INTO videos (video_id, duration, total_views, created_at, updated_at)
    VALUES (?, ?, 0, unixepoch(), unixepoch())
    ON CONFLICT(video_id) 
    DO UPDATE SET 
      duration = ?,
      updated_at = unixepoch()
  `).bind(videoId, duration, duration).run();
}

/**
 * Delete all data for a video (for testing/cleanup)
 */
export async function deleteVideoData(
  db: D1Database,
  videoId: string
): Promise<void> {
  await db.batch([
    db.prepare('DELETE FROM video_watch_buckets WHERE video_id = ?').bind(videoId),
    db.prepare('DELETE FROM videos WHERE video_id = ?').bind(videoId)
  ]);
}
