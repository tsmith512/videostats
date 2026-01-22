# Project Context for AI Assistants

This file contains essential context for resuming work on the Video Watch Analytics project.

## Project Overview

**Name:** Video Watch Analytics  
**Purpose:** Track and aggregate video viewing patterns using Cloudflare Workers, D1 Database, and time-bucketed histograms  
**Tech Stack:** TypeScript, Cloudflare Workers, D1 (SQLite), Cloudflare Stream Player  
**Live Demo:** https://videostats.tsmithcreative.workers.dev/demo

## Architecture

### Core Concept
- **Time-bucketed aggregation** - Viewing data is stored in 5-second buckets
- **Session tracking** - Each API call increments `total_views` counter
- **Cumulative ranges** - Uses Stream Player's `player.played` TimeRanges API

### Database Schema

```sql
-- Main analytics table
CREATE TABLE video_watch_buckets (
    video_id TEXT NOT NULL,
    bucket_start INTEGER NOT NULL,  -- Multiples of 5 (0, 5, 10, 15...)
    view_count INTEGER NOT NULL DEFAULT 0,
    last_updated INTEGER,
    PRIMARY KEY (video_id, bucket_start)
);

-- Video metadata table
CREATE TABLE videos (
    video_id TEXT PRIMARY KEY,
    duration INTEGER,               -- Nullable until known
    total_views INTEGER DEFAULT 0,  -- Session counter
    created_at INTEGER,
    updated_at INTEGER
);
```

**Database:** Cloudflare D1 (SQLite)  
**Name:** videostats-prod-db  
**ID:** 879c076d-0ae5-4e8c-92d9-20e69de4304f

## API Endpoints

### 1. Track Views
```
POST /api/track
Content-Type: application/json

{
  "videoId": "video-123",
  "ranges": [
    {"startTime": 0, "endTime": 15.5},
    {"startTime": 45, "endTime": 60.2}
  ]
}

Response: {"bucketsUpdated": 12}
```

**Important:** `player.played` is cumulative and read-only. Send data ONCE per session:
- On `ended` event when video finishes
- On `beforeunload` when user leaves page
- Use `hasSentData` flag to prevent duplicates

### 2. Get Histogram
```
GET /api/histogram/:videoId

Response: {
  "videoId": "video-123",
  "buckets": [
    {"bucketStart": 0, "viewCount": 1250},
    {"bucketStart": 5, "viewCount": 1100}
  ]
}
```

**Note:** Database returns snake_case but API uses SQL aliases to convert to camelCase.

### 3. Live Demo
```
GET /demo                    # Default video (Tulsa Halloween 2025)
GET /demo/:videoId           # Custom Stream video
```

## Key Implementation Details

### Bucket Calculation
```javascript
const bucketSize = 5;
const firstBucket = Math.floor(startTime / 5) * 5;  // e.g., 7.2 → 5
const lastBucket = Math.floor(endTime / 5) * 5;     // e.g., 18.9 → 15
// Increment buckets: 5, 10, 15
```

### Stream Player Integration Pattern
```javascript
// CORRECT: Send once per session
let hasSentData = false;

player.addEventListener('ended', () => {
    sendToAnalytics();
    hasSentData = true;
});

window.addEventListener('beforeunload', () => {
    if (!hasSentData) {
        navigator.sendBeacon(endpoint, JSON.stringify({videoId, ranges}));
    }
});

// WRONG: Don't do periodic flush with player.played
// setInterval(() => sendToAnalytics(), 10000); // ❌ Causes duplicate data
```

### Initialization Pattern
```javascript
// Multi-pronged approach for reliable initialization
function initialize() {
    if (initialized) return;
    if (player.duration && !isNaN(player.duration) && player.duration > 0) {
        initialized = true;
        // Load histogram, etc.
    }
}

// Try multiple triggers
player.addEventListener('timeupdate', () => initialize());
player.addEventListener('loadedmetadata', () => initialize());
setTimeout(() => initialize(), 100);
```

### Histogram Visualization
```javascript
// Color segments by popularity
const intensity = viewCount / maxViews;
const hue = 260; // Purple
const saturation = 70;
const lightness = 85 - (intensity * 50); // Darker = more views
segment.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
```

## Project Structure

```
videostats/
├── src/
│   ├── index.ts          # Main Worker with routes
│   ├── types.ts          # TypeScript interfaces
│   ├── validation.ts     # Input validation
│   ├── buckets.ts        # Bucket calculation logic
│   ├── database.ts       # D1 operations
│   └── demo.ts           # Demo page HTML template
├── migrations/
│   ├── 0001_initial_schema.sql
│   └── 0002_make_duration_nullable.sql
├── examples/
│   ├── stream-player-simple.html
│   ├── stream-player-integration.html
│   ├── client.html
│   ├── visualize.html
│   └── test-api.sh
├── wrangler.toml         # Cloudflare config
├── package.json
├── tsconfig.json
└── .nvmrc               # Node 22

```

## Common Commands

```bash
# Setup
npm install
source ~/.nvm/nvm.sh && nvm use  # Use Node 22

# Development
npm run dev                      # Local dev server
npm run type-check              # TypeScript validation

# Database
npx wrangler d1 migrations apply videostats-prod-db --remote
npx wrangler d1 execute videostats-prod-db --remote --command "SELECT * FROM videos"

# Deploy
npm run deploy

# Testing
./examples/test-api.sh https://videostats.tsmithcreative.workers.dev
```

## Important Gotchas

### 1. ❌ Snake_case vs camelCase
**Problem:** D1 returns `bucket_start` but code expects `bucketStart`  
**Solution:** Use SQL aliases: `SELECT bucket_start as bucketStart`

### 2. ❌ Duplicate Data Submission
**Problem:** Sending `player.played` multiple times counts same ranges repeatedly  
**Solution:** Only send once per session (ended + beforeunload)

### 3. ❌ Video ID Salting
**Problem:** Adding timestamp to video ID prevents aggregation  
**Solution:** Use actual Stream video ID without modification

### 4. ❌ Initialization Timing
**Problem:** `loadedmetadata` event fires before listener is registered  
**Solution:** Multi-pronged initialization (timeupdate, loadedmetadata, timeout)

### 5. ✅ Preload Metadata
**Tip:** Add `?preload=auto` to Stream iframe for faster initialization

## Demo Videos

- **Tulsa Halloween 2025** (default): `849eebd185f7fd262589c09111911347`
- **Push Start Maserati**: `43c6d266d966358dd90bd0430749216f`
- **Rock Climbing**: `3c3cbd48f0527fa4f1ed425c2abcf91f`
- **Re:Invent Trip Report**: `30b87aa298d574589d2d4a3b784ace80`

## Deployment History

**Current Version:** Latest deployed version  
**Worker URL:** https://videostats.tsmithcreative.workers.dev  
**Database:** videostats-prod-db (879c076d-0ae5-4e8c-92d9-20e69de4304f)

See `DEPLOYMENT.md` for full deployment history.

## Git Workflow

```bash
# Check status
git status

# Commit changes
git add .
git commit -m "Description of changes"

# View history
git log --oneline -10
```

## Key Files to Reference

- **README.md** - Full project documentation
- **SETUP.md** - Deployment and setup guide
- **QUICKSTART.md** - Quick start guide
- **DEPLOYMENT.md** - Deployment history
- **examples/README.md** - Integration patterns and examples

## TypeScript Types Reference

```typescript
interface ViewRange {
  startTime: number;
  endTime: number;
}

interface TrackRequest {
  videoId: string;
  ranges: ViewRange[];
}

interface HistogramBucket {
  bucketStart: number;
  viewCount: number;
}

interface HistogramResponse {
  videoId: string;
  buckets: HistogramBucket[];
}
```

## Testing Checklist

When making changes, verify:
- [ ] TypeScript compiles: `npm run type-check`
- [ ] Track endpoint works: POST with ranges
- [ ] Histogram endpoint returns data: GET by video ID
- [ ] Demo page loads with default video
- [ ] Demo page works with custom video ID
- [ ] Heatmap displays with color gradients
- [ ] Session progress bar updates in real-time
- [ ] No duplicate data submission
- [ ] SQL returns camelCase (not snake_case)

## Future Enhancements (Ideas)

- User-level tracking (user_id/session_id)
- Real-time WebSocket updates
- Data retention/archival
- Multiple bucket sizes (1s, 10s, 30s)
- Drop-off rate calculation
- A/B testing support
- Video duration auto-fetch from Stream API

## Useful Links

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)
- [Stream Player API Docs](https://developers.cloudflare.com/stream/viewing-videos/using-the-stream-player/using-the-player-api/)
- [TimeRanges API](https://developer.mozilla.org/en-US/docs/Web/API/TimeRanges)

## Contact

**Product Manager:** User requesting this system  
**Project Repository:** /home/tsmith/repos/videostats  
**License:** MIT
