# Video Watch Analytics System

A Cloudflare Worker-based solution for tracking and aggregating video viewing patterns using time-bucketed histograms.

## Overview

This system tracks which parts of videos users are watching by collecting viewing ranges (start/end timestamps) and aggregating them into 5-second buckets. This enables efficient generation of cumulative frequency histograms showing viewing patterns across your video platform.

## Architecture

### Data Model

**Time-bucketed aggregation approach:**
- Each viewing event is aggregated into 5-second buckets
- Bucket start times: 0, 5, 10, 15, 20... seconds
- Each bucket represents the interval `[bucket_start, bucket_start + 5)`
- Pre-aggregated counts enable fast histogram queries

### Database Schema

```sql
-- Main table for aggregated view counts per bucket
CREATE TABLE video_watch_buckets (
    video_id TEXT NOT NULL,
    bucket_start INTEGER NOT NULL,  -- Time in seconds (0, 5, 10, 15...)
    view_count INTEGER NOT NULL DEFAULT 0,
    last_updated INTEGER,           -- Unix timestamp
    PRIMARY KEY (video_id, bucket_start)
);

CREATE INDEX idx_video_id ON video_watch_buckets(video_id);

-- Video metadata table
CREATE TABLE videos (
    video_id TEXT PRIMARY KEY,
    duration INTEGER,               -- Total duration in seconds (nullable until known)
    total_views INTEGER DEFAULT 0,  -- Counts viewing sessions
    created_at INTEGER,
    updated_at INTEGER
);
```

### Storage Technology

**Cloudflare D1 Database (SQLite)**
- Serverless SQL database at the edge
- Optimized for read-heavy workloads
- Built-in replication and global distribution

## API Design

### Live Demo

**Endpoint:** `GET /demo`

Visit the live demo to see the analytics system in action with an embedded Cloudflare Stream video. The demo automatically tracks viewing patterns and displays real-time statistics.

**Features:**
- Embedded Cloudflare Stream Player
- Real-time progress visualization
- Live statistics (segments, coverage, uploads, buckets)
- Activity log showing tracking events
- Beautiful gradient UI

### Track Video Views

**Endpoint:** `POST /api/track`

**Request Payload:**
```json
{
  "videoId": "abc123",
  "ranges": [
    { "startTime": 0.0, "endTime": 15.3 },
    { "startTime": 45.7, "endTime": 52.1 },
    { "startTime": 120.5, "endTime": 135.8 }
  ]
}
```

**Response:**
```json
{
  "bucketsUpdated": 12
}
```

**Features:**
- Supports multiple viewing ranges in a single request
- Handles seeking and scrubbing behavior
- Deduplicates overlapping bucket updates
- Validates input ranges (non-negative, valid ordering)
- Automatically tracks viewing sessions in the `videos` table
- Increments `total_views` counter for each track request

### Get Video Histogram

**Endpoint:** `GET /api/histogram/:videoId`

**Response:**
```json
{
  "videoId": "abc123",
  "buckets": [
    { "bucketStart": 0, "viewCount": 1250 },
    { "bucketStart": 5, "viewCount": 1100 },
    { "bucketStart": 10, "viewCount": 950 }
  ]
}
```

## Use Cases

### 1. User Seeking Through Video
When a user watches the intro then jumps to the middle:
```json
{
  "videoId": "vid_001",
  "ranges": [
    { "startTime": 0, "endTime": 8 },
    { "startTime": 45, "endTime": 60 }
  ]
}
```

### 2. User Scrubbing (Preview Seeking)
Multiple small ranges from thumbnail previews:
```json
{
  "videoId": "vid_001",
  "ranges": [
    { "startTime": 10.1, "endTime": 10.8 },
    { "startTime": 15.2, "endTime": 16.1 },
    { "startTime": 22.5, "endTime": 23.0 }
  ]
}
```

### 3. Overlapping Ranges
When ranges overlap the same buckets, counts are aggregated:
```json
{
  "videoId": "vid_001",
  "ranges": [
    { "startTime": 5, "endTime": 12 },
    { "startTime": 8, "endTime": 15 }
  ]
}
```
Result: Bucket 10 gets +2 (touched by both ranges)

## Processing Logic

### Bucket Calculation Algorithm

For each viewing range (startTime, endTime):

1. Calculate first affected bucket: `Math.floor(startTime / 5) * 5`
2. Calculate last affected bucket: `Math.floor(endTime / 5) * 5`
3. Increment all buckets in range `[firstBucket, lastBucket]` by step of 5

**Example:** Range 7.2s to 18.9s
- First bucket: `Math.floor(7.2 / 5) * 5 = 5`
- Last bucket: `Math.floor(18.9 / 5) * 5 = 15`
- Affected buckets: 5, 10, 15

### Deduplication

When multiple ranges affect the same bucket in a single request:
- Use a Map to track increment count per bucket
- Apply all increments in a single batch operation
- Reduces database round-trips and ensures consistency

## Client-Side Integration

### Video Player Integration

```javascript
class ViewTracker {
    constructor(videoId, flushInterval = 10000) {
        this.videoId = videoId;
        this.ranges = [];
        this.flushInterval = flushInterval;
        this.startFlushTimer();
    }
    
    addRange(startTime, endTime) {
        this.ranges.push({ startTime, endTime });
    }
    
    async flush() {
        if (this.ranges.length === 0) return;
        
        await fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                videoId: this.videoId,
                ranges: this.ranges
            })
        });
        
        this.ranges = [];
    }
    
    startFlushTimer() {
        setInterval(() => this.flush(), this.flushInterval);
    }
}

// Usage
const tracker = new ViewTracker('video_123');

// Track playback
player.on('timeupdate', (currentTime) => {
    if (this.lastTime && currentTime > this.lastTime) {
        tracker.addRange(this.lastTime, currentTime);
    }
    this.lastTime = currentTime;
});

// Flush on page unload
window.addEventListener('beforeunload', () => tracker.flush());
```

### Cloudflare Stream Player Integration

If you're using Cloudflare Stream, you can leverage the built-in `played` TimeRanges API:

```javascript
// Initialize Stream Player
const player = Stream(document.getElementById('stream-player'));

// Extract ranges from player
function extractRanges() {
    const ranges = [];
    for (let i = 0; i < player.played.length; i++) {
        ranges.push({
            startTime: player.played.start(i),
            endTime: player.played.end(i)
        });
    }
    return ranges;
}

// Send to analytics every 10 seconds
setInterval(async () => {
    const ranges = extractRanges();
    if (ranges.length > 0) {
        await fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoId: 'video_123', ranges })
        });
    }
}, 10000);
```

See `examples/stream-player-simple.html` for a complete working demo with Cloudflare Stream.

## Performance Characteristics

### Write Performance
- Batch operations: Up to 1000 statements per D1 batch
- Multiple ranges processed atomically
- Deduplication reduces redundant writes

### Read Performance
- Simple indexed query: `WHERE video_id = ? ORDER BY bucket_start`
- Pre-aggregated data = no runtime computation
- Cacheable results (CDN/edge caching)

### Storage Efficiency
- Storage per video: `(video_duration_seconds / 5) * row_size`
- Example: 10-minute video = 120 buckets ≈ 5-10 KB
- Independent of total view count

## Deployment

### Prerequisites
- Node.js 18+
- Cloudflare account
- Wrangler CLI installed

### Setup

1. Install dependencies:
```bash
npm install
```

2. Create D1 database:
```bash
npx wrangler d1 create videostats-db
```

3. Update `wrangler.toml` with your database ID

4. Run migrations:
```bash
npx wrangler d1 migrations apply videostats-db
```

5. Deploy:
```bash
npm run deploy
```

### Development

```bash
# Run locally with D1 local database
npm run dev

# Type checking
npm run type-check
```

## Examples

The `examples/` directory contains working demonstrations:

### Interactive Demos
- **`client.html`** - Full-featured demo with manual video player, range tracking, and visualization
- **`stream-player-simple.html`** - Cloudflare Stream Player integration (simple, production-ready)
- **`stream-player-integration.html`** - Advanced Stream Player demo with detailed statistics
- **`visualize.html`** - Analytics dashboard with Chart.js histograms and retention charts

### Testing
- **`test-api.sh`** - Command-line API testing script with 8 test cases

To use the Stream Player examples, simply open them in a browser. They connect to the deployed Worker at `https://videostats.tsmithcreative.workers.dev` and demonstrate real-time analytics tracking.

## Future Enhancements

- **User-level tracking**: Add user_id/session_id for retention analysis
- **Real-time analytics**: WebSocket updates for live histogram updates
- **Data retention**: Automatic archival of old data
- **Multi-bucket sizes**: Support different granularities (1s, 10s, 30s)
- **Heatmap visualization**: Frontend component for rendering histograms
- **A/B testing**: Track different video versions
- **Engagement metrics**: Calculate drop-off rates, rewatch patterns

## License

MIT
