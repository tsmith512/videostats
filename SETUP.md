# Setup Guide

This guide will help you set up and deploy the Video Watch Analytics Worker to Cloudflare.

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Cloudflare account (free tier works)
- Wrangler CLI (installed as dev dependency)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Login to Cloudflare

```bash
npx wrangler login
```

This will open a browser window to authenticate with your Cloudflare account.

## Step 3: Create D1 Database

Create a new D1 database named `videostats-db`:

```bash
npx wrangler d1 create videostats-db
```

The output will look like:

```
✅ Successfully created DB 'videostats-db'

[[d1_databases]]
binding = "DB"
database_name = "videostats-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

## Step 4: Update wrangler.toml

Copy the `database_id` from the output above and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "videostats-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # Replace with your actual ID
```

## Step 5: Run Database Migrations

Apply the database schema to your D1 database:

```bash
npx wrangler d1 migrations apply videostats-db
```

You should see:

```
Migrations to be applied:
┌─────┬───────────────────────────┐
│ id  │ name                      │
├─────┼───────────────────────────┤
│ 1   │ 0001_initial_schema.sql   │
└─────┴───────────────────────────┘
✔ About to apply 1 migration(s)
Your database may not be available to serve requests during the migration, continue? … yes
🌀 Applying 0001_initial_schema.sql
✅ Successfully applied 0001_initial_schema.sql
```

## Step 6: Test Locally (Optional)

Run the Worker locally with a local D1 database:

```bash
npm run dev
```

The Worker will be available at `http://localhost:8787`

Test the health check endpoint:

```bash
curl http://localhost:8787/
```

## Step 7: Deploy to Cloudflare

Deploy your Worker to Cloudflare's edge network:

```bash
npm run deploy
```

You should see output like:

```
Total Upload: XX.XX KiB / gzip: XX.XX KiB
Uploaded videostats (X.XX sec)
Published videostats (X.XX sec)
  https://videostats.your-subdomain.workers.dev
Current Deployment ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## Step 8: Test the Deployed Worker

Your Worker is now live! Test it:

```bash
# Health check
curl https://videostats.your-subdomain.workers.dev/

# Track some views
curl -X POST https://videostats.your-subdomain.workers.dev/api/track \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "test-video-123",
    "ranges": [
      {"startTime": 0, "endTime": 15.5},
      {"startTime": 45, "endTime": 60.2}
    ]
  }'

# Get histogram
curl https://videostats.your-subdomain.workers.dev/api/histogram/test-video-123
```

## Database Management

### View Database Contents

```bash
# List all tables
npx wrangler d1 execute videostats-db --command "SELECT name FROM sqlite_master WHERE type='table'"

# Query bucket data
npx wrangler d1 execute videostats-db --command "SELECT * FROM video_watch_buckets LIMIT 10"

# Count total buckets
npx wrangler d1 execute videostats-db --command "SELECT COUNT(*) as total FROM video_watch_buckets"
```

### Reset Database (Development Only)

To clear all data and reapply migrations:

```bash
# Warning: This deletes all data!
npx wrangler d1 execute videostats-db --command "DROP TABLE IF EXISTS video_watch_buckets; DROP TABLE IF EXISTS videos;"
npx wrangler d1 migrations apply videostats-db
```

## Development Workflow

### Type Checking

```bash
npm run type-check
```

### Local Development

```bash
npm run dev
```

The Worker will reload automatically when you save changes.

### Deploy Updates

```bash
npm run deploy
```

## Troubleshooting

### "database_id not found" error

Make sure you've updated the `database_id` in `wrangler.toml` with the actual ID from Step 3.

### "Binding not found" error

Ensure the binding name in `wrangler.toml` matches what's used in the code (`DB`).

### Type errors

Run `npm run type-check` to see detailed TypeScript errors.

### Migration already applied

If you need to reapply a migration, either:
1. Create a new migration file with a higher number
2. Drop the tables and reapply (development only)

## Next Steps

- Integrate with your video player (see README.md)
- Set up monitoring and alerts
- Configure custom domain
- Add authentication if needed
- Set up analytics dashboards

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [D1 Database Documentation](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
