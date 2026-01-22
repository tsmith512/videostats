# Deployment History

## Feature: Global Heatmap Visualization - January 21, 2026

**Version ID:** cc3487bc-72bd-4776-90bb-f5cdcc0ad6cd

### New Features
- Added global heatmap showing aggregated viewing data from all sessions
- Second progress bar below personal session progress
- Color-coded segments: darker purple = more views
- Fetches data from `/api/histogram/{videoId}` endpoint
- Auto-refreshes every 30 seconds
- Hover tooltips show time range and view counts
- Updates after submitting new analytics

### Design
- HSL gradient from light to dark purple based on popularity
- Each segment represents a 5-second bucket
- Clear labels distinguish personal vs global data
- Seamlessly integrated with existing purple theme

### Bundle Size
- **Size:** 24.29 KiB (6.24 KiB gzipped)

---

## Fix: Use Actual Video ID for Aggregation - January 21, 2026

**Version ID:** aaa98143-ae50-4225-bc4a-095b52798c57

### Problem Fixed
- Demo was using `'demo-{videoId}-{timestamp}'` as VIDEO_ID
- Timestamp made every page load unique, preventing aggregation
- Analytics couldn't aggregate viewing patterns across sessions

### Solution
- Use actual Stream video ID: `849eebd185f7fd262589c09111911347`
- All sessions for same video now aggregate correctly

### Bundle Size
- **Size:** 20.74 KiB (5.47 KiB gzipped)

---

## Fix: Prevent Duplicate Analytics - January 21, 2026

**Version ID:** 5506e5f0-3828-4806-9b5d-66438f2e3074

### Problem Fixed
- `player.played` is cumulative and read-only
- Periodic flushing was sending the same ranges multiple times
- Each flush incorrectly incremented bucket counts

### Solution
- Send analytics only once per session
- Flush on `ended` event when video finishes
- Flush on `beforeunload` when user leaves page
- Use `hasSentData` flag to prevent duplicates

### Changes
- Updated demo page and simple example
- Removed periodic `setInterval` flush
- Added proper guard conditions

### Bundle Size
- **Size:** 20.71 KiB (5.46 KiB gzipped)

---

## Update: Live Demo Page - January 21, 2026

**Version ID:** 50bc3e8b-f416-48af-9653-ac90043f3231

### Changes
- Added `/demo` route serving embedded demo page
- Demo features Cloudflare Stream Player with video 849eebd185f7fd262589c09111911347
- Real-time analytics tracking with visual progress bar
- Beautiful gradient UI with live statistics
- Activity log showing tracking events
- Automatic 10-second flush interval

### Bundle Size
- **Size:** 20.13 KiB (5.31 KiB gzipped)

**Try it:** https://videostats.tsmithcreative.workers.dev/demo

---

## Update: Session Tracking - January 21, 2026

**Version ID:** aa97c0b0-dacf-4a7f-991d-6d48e935130c

### Changes
- Added automatic session tracking to `videos` table
- Track endpoint now creates/updates video records on each request
- `total_views` increments for each viewing session
- Made `duration` column nullable (will be populated from hosting provider later)
- New migration: `0002_make_duration_nullable.sql`

### Database Updates
- **Migrations Applied:** 
  - 0001_initial_schema.sql ✅
  - 0002_make_duration_nullable.sql ✅

### Bundle Size
- **Size:** 7.86 KiB (2.25 KiB gzipped)

---

## Production Deployment - January 21, 2026

**First Deployment** 🚀

### Details
- **Date:** January 21, 2026
- **Worker URL:** https://videostats.tsmithcreative.workers.dev
- **Version ID:** e207cdf4-6f38-4ad4-936b-448036e57082
- **Bundle Size:** 7.43 KiB (2.15 KiB gzipped)

### Database
- **Name:** videostats-prod-db
- **Database ID:** 879c076d-0ae5-4e8c-92d9-20e69de4304f
- **Migrations Applied:** 0001_initial_schema.sql ✅

### Configuration
- **Node Version:** 22.21.1 (via nvm)
- **Wrangler Version:** 4.47.0
- **Compatibility Date:** 2024-01-01

### Endpoints
- Health Check: `GET /`
- Track Views: `POST /api/track`
- Get Histogram: `GET /api/histogram/:videoId`

### Notes
- Initial production deployment
- D1 database configured and migrations applied
- CORS enabled for cross-origin requests
- All TypeScript types validated successfully
