-- Migration: Make duration column nullable
-- This allows videos to be tracked before duration is known

-- SQLite doesn't support ALTER COLUMN directly, so we need to recreate the table
-- Create new table with nullable duration
CREATE TABLE videos_new (
    video_id TEXT PRIMARY KEY,
    duration INTEGER,              -- Now nullable (removed NOT NULL)
    total_views INTEGER DEFAULT 0,
    created_at INTEGER,
    updated_at INTEGER
);

-- Copy existing data
INSERT INTO videos_new (video_id, duration, total_views, created_at, updated_at)
SELECT video_id, duration, total_views, created_at, updated_at
FROM videos;

-- Drop old table
DROP TABLE videos;

-- Rename new table
ALTER TABLE videos_new RENAME TO videos;

-- Recreate index
CREATE INDEX idx_videos_created ON videos(created_at);
