# Examples

This directory contains working examples demonstrating how to integrate with the Video Watch Analytics API.

## Cloudflare Stream Player Integration

### stream-player-simple.html ⭐ Recommended
A clean, production-ready example showing how to integrate Cloudflare Stream Player with the analytics endpoint.

**Features:**
- Minimal code, easy to understand
- Uses Stream Player's native `player.played` TimeRanges API
- Automatic periodic flushing (every 10 seconds)
- Visual progress bar showing watched segments
- Real-time statistics
- Reliable unload tracking with `navigator.sendBeacon`

**Usage:**
```bash
# Open in browser
open stream-player-simple.html

# Or serve locally
python3 -m http.server 8000
# Then visit http://localhost:8000/stream-player-simple.html
```

### stream-player-integration.html
A more advanced example with additional features and detailed statistics.

**Additional Features:**
- Configurable API endpoint and video ID
- Manual flush button for testing
- Detailed range list display
- More verbose status messages
- Statistics reset functionality

## Generic Video Player Integration

### client.html
Full-featured demo that works with any HTML5 video player.

**Features:**
- Manual video player (works with any video source)
- Custom range tracking logic
- Load histogram functionality
- Interactive controls
- Implementation code display

## Analytics Visualization

### visualize.html
Analytics dashboard for viewing video watch data.

**Features:**
- Chart.js histogram visualization
- Retention analysis chart
- Auto-refresh capability
- Summary statistics
- Works with any tracked video

**Usage:**
```bash
# Open in browser and enter a video ID that has data
open visualize.html
```

## API Testing

### test-api.sh
Bash script for comprehensive API testing.

**Features:**
- 8 different test scenarios
- Tests tracking, histogram retrieval, and error handling
- Outputs formatted JSON responses

**Usage:**
```bash
# Test against local dev server
./test-api.sh http://localhost:8787

# Test against production
./test-api.sh https://videostats.tsmithcreative.workers.dev
```

## Quick Start

### For Cloudflare Stream Users

1. Copy `stream-player-simple.html` to your project
2. Update the Stream iframe `src` to your video
3. Change `ANALYTICS_ENDPOINT` to your Worker URL
4. Deploy and done!

### Key Code Pattern

```javascript
// Initialize Stream Player
const player = Stream(document.getElementById('stream-player'));

// Extract ranges on timeupdate
player.addEventListener('timeupdate', () => {
    const ranges = [];
    for (let i = 0; i < player.played.length; i++) {
        ranges.push({
            startTime: player.played.start(i),
            endTime: player.played.end(i)
        });
    }
    sendToAnalytics(ranges);
});
```

## How TimeRanges Work

The Stream Player (and HTML5 video elements) maintain a `played` property that implements the TimeRanges interface:

- `player.played.length` - Number of separate ranges watched
- `player.played.start(i)` - Start time of range i (in seconds)
- `player.played.end(i)` - End time of range i (in seconds)

**Important:** `player.played` is **cumulative and read-only**. It accumulates all watched ranges throughout the session and cannot be reset. This means you should only send the data **once per session** to avoid duplicate counting.

Ranges are automatically merged when they overlap or are adjacent, so you'll typically see fewer ranges as the viewer watches more of the video.

## Integration Patterns

### Pattern 1: End-of-Session Flush (Recommended) ⭐

Send data only when the session ends:
```javascript
let hasSentData = false;

// Send when video ends
player.addEventListener('ended', () => {
    sendToAnalytics(extractRanges());
    hasSentData = true;
});

// Send when user leaves page
window.addEventListener('beforeunload', () => {
    if (!hasSentData) {
        navigator.sendBeacon(endpoint, JSON.stringify({
            videoId: videoId,
            ranges: extractRanges()
        }));
    }
});
```

**Why this is recommended:**
- `player.played` is cumulative - sending it multiple times causes duplicate counts
- Ensures each viewing session is tracked exactly once
- Uses `sendBeacon` for reliable delivery during page unload

### Pattern 2: Periodic Flush (⚠️ Not Recommended for player.played)
This pattern causes duplicate data with `player.played`:
```javascript
// DON'T DO THIS - causes duplicate counting
setInterval(() => sendToAnalytics(extractRanges()), 10000);
```

### Pattern 3: Manual Range Tracking (Alternative)
If you need periodic updates, track ranges manually instead of using `player.played`:
```javascript
let customRanges = [];
let lastTime = null;

player.addEventListener('timeupdate', () => {
    if (lastTime && player.currentTime > lastTime) {
        customRanges.push({ 
            startTime: lastTime, 
            endTime: player.currentTime 
        });
    }
    lastTime = player.currentTime;
});

// Flush and clear periodically
setInterval(() => {
    if (customRanges.length > 0) {
        sendToAnalytics(customRanges);
        customRanges = []; // Clear after sending
    }
}, 10000);
```

## Browser Compatibility

All examples work in modern browsers that support:
- ES6+ JavaScript
- Fetch API
- TimeRanges API
- (Optional) sendBeacon for unload tracking

## Support

- See [../README.md](../README.md) for full API documentation
- See [../SETUP.md](../SETUP.md) for deployment instructions
- See [../QUICKSTART.md](../QUICKSTART.md) for quick setup guide
