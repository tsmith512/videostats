# Quick Start Guide

Get your Video Watch Analytics system up and running in 5 minutes.

## Prerequisites

- Node.js 18+
- Cloudflare account (free tier works)

## Installation

```bash
# 1. Install dependencies
npm install

# 2. Login to Cloudflare
npx wrangler login

# 3. Create D1 database
npx wrangler d1 create videostats-db

# 4. Update wrangler.toml with the database_id from step 3

# 5. Run migrations
npx wrangler d1 migrations apply videostats-db

# 6. Deploy
npm run deploy
```

## Test Locally

```bash
# Start local dev server
npm run dev

# In another terminal, track some views
curl -X POST http://localhost:8787/api/track \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "test-123",
    "ranges": [{"startTime": 0, "endTime": 15}]
  }'

# Get histogram
curl http://localhost:8787/api/histogram/test-123

# Or visit the live demo in your browser
open http://localhost:8787/demo
```

## Test with Browser

1. Start the dev server: `npm run dev`
2. Open `examples/client.html` in your browser
3. Watch the video - tracking happens automatically
4. Click "Load Histogram" to see the data

## Visual Analytics

1. Open `examples/visualize.html` in your browser
2. Enter your video ID
3. Click "Load Data" to see charts and statistics

## API Endpoints

### Live Demo
```bash
GET /demo
```
Visit in browser to see a working example with embedded video player.

### Track Views
```bash
POST /api/track
Content-Type: application/json

{
  "videoId": "video-123",
  "ranges": [
    {"startTime": 0, "endTime": 15.5},
    {"startTime": 45, "endTime": 60}
  ]
}
```

### Get Histogram
```bash
GET /api/histogram/:videoId
```

## Project Structure

```
videostats/
├── src/
│   ├── index.ts          # Main Worker entry point
│   ├── types.ts          # TypeScript type definitions
│   ├── validation.ts     # Input validation
│   ├── buckets.ts        # Bucket calculation logic
│   └── database.ts       # D1 database operations
├── migrations/
│   └── 0001_initial_schema.sql
├── examples/
│   ├── client.html       # Interactive tracking demo
│   ├── visualize.html    # Analytics visualization
│   └── test-api.sh       # API testing script
├── wrangler.toml         # Cloudflare Worker config
├── tsconfig.json         # TypeScript config
└── package.json
```

## Next Steps

- Read [SETUP.md](SETUP.md) for detailed deployment instructions
- Read [README.md](README.md) for full documentation
- Integrate with your video player using the client code in `examples/`

## Common Issues

**"database_id not found"**
- Update the `database_id` in `wrangler.toml` with your actual database ID

**Type errors**
- Run `npm run type-check` to see detailed errors

**Local dev not working**
- Make sure you've run migrations: `npx wrangler d1 migrations apply videostats-db`

## Support

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)

## License

MIT
