-- Migration: Initial schema for video watch analytics
-- Creates tables for time-bucketed view tracking

-- Main table for aggregated view counts per bucket
CREATE TABLE video_watch_buckets (
    video_id TEXT NOT NULL,
    bucket_start INTEGER NOT NULL,  -- Time in seconds (0, 5, 10, 15...)
    view_count INTEGER NOT NULL DEFAULT 0,
    last_updated INTEGER,           -- Unix timestamp for cache invalidation
    PRIMARY KEY (video_id, bucket_start)
);

-- Index for efficient video lookup
CREATE INDEX idx_video_id ON video_watch_buckets(video_id);

-- Optional: Video metadata table
CREATE TABLE videos (
    video_id TEXT PRIMARY KEY,
    duration INTEGER NOT NULL,      -- Total duration in seconds
    total_views INTEGER DEFAULT 0,
    created_at INTEGER,
    updated_at INTEGER
);

-- Index for timestamp-based queries
CREATE INDEX idx_videos_created ON videos(created_at);
