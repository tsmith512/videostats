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

Ranges are automatically merged when they overlap or are adjacent, so you'll typically see fewer ranges as the viewer watches more of the video.

## Integration Patterns

### Pattern 1: Periodic Flush (Recommended)
Send data every N seconds:
```javascript
setInterval(() => sendToAnalytics(extractRanges()), 10000);
```

### Pattern 2: On Change
Send data only when ranges change:
```javascript
let lastRanges = [];
player.addEventListener('timeupdate', () => {
    const current = extractRanges();
    if (JSON.stringify(current) !== JSON.stringify(lastRanges)) {
        sendToAnalytics(current);
        lastRanges = current;
    }
});
```

### Pattern 3: Batched with Debounce
Collect changes and send after inactivity:
```javascript
let timeoutId;
player.addEventListener('timeupdate', () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => sendToAnalytics(extractRanges()), 2000);
});
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
