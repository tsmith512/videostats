// Cloudflare Worker for video watch analytics
// Tracks viewing patterns using time-bucketed aggregation

import { Env, TrackRequest, TrackResponse, HistogramResponse, ErrorResponse } from './types';
import { validateTrackRequest, validateVideoId, ValidationError } from './validation';
import { aggregateRangesToBuckets } from './buckets';
import { updateBuckets, getHistogram, trackVideoView } from './database';
import { getDemoPage } from './demo';

/**
 * Main Worker export
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // Route: POST /api/track - Track viewing events
      if (path === '/api/track' && request.method === 'POST') {
        return await handleTrack(request, env, corsHeaders);
      }

      // Route: GET /api/histogram/:videoId - Get histogram data
      const histogramMatch = path.match(/^\/api\/histogram\/([^/]+)$/);
      if (histogramMatch && request.method === 'GET') {
        const videoId = histogramMatch[1];
        return await handleGetHistogram(videoId, env, corsHeaders);
      }

      // Route: GET /demo/:videoId - Live demo page with specific video
      const demoMatch = path.match(/^\/demo(?:\/([^/]+))?$/);
      if (demoMatch && request.method === 'GET') {
        // Use video ID from URL or default to example video
        const videoId = demoMatch[1] || '849eebd185f7fd262589c09111911347';
        const workerUrl = url.origin;
        const html = getDemoPage(videoId, workerUrl);
        
        return new Response(html, {
          headers: { 
            'Content-Type': 'text/html',
            ...corsHeaders 
          }
        });
      }

      // Route: GET / - Health check / Info
      if (path === '/' && request.method === 'GET') {
        return new Response(JSON.stringify({
          service: 'Video Watch Analytics',
          version: '1.0.0',
          endpoints: {
            track: 'POST /api/track',
            histogram: 'GET /api/histogram/:videoId',
            demo: 'GET /demo (default video)',
            demoWithVideo: 'GET /demo/:videoId (custom video)'
          }
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // 404 Not Found
      return jsonError('Not found', 404, corsHeaders);

    } catch (error) {
      console.error('Unhandled error:', error);
      return jsonError('Internal server error', 500, corsHeaders);
    }
  }
};

/**
 * Handle POST /api/track - Track viewing events
 */
async function handleTrack(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // Parse and validate request body
    const body = await request.json();
    const trackRequest: TrackRequest = validateTrackRequest(body);

    // Aggregate ranges into bucket updates
    const bucketUpdates = aggregateRangesToBuckets(trackRequest.ranges);

    // Update database - batch both operations
    const [bucketsUpdated] = await Promise.all([
      updateBuckets(env.DB, trackRequest.videoId, bucketUpdates),
      trackVideoView(env.DB, trackRequest.videoId)
    ]);

    // Log structured data for observability
    console.log(JSON.stringify({
      event: 'track_request',
      videoId: trackRequest.videoId,
      rangeCount: trackRequest.ranges.length,
      bucketsUpdated,
      timestamp: Date.now()
    }));

    const response: TrackResponse = {
      bucketsUpdated
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      return jsonError(error.message, 400, corsHeaders);
    }
    
    console.error('Error tracking views:', error);
    return jsonError('Failed to track views', 500, corsHeaders);
  }
}

/**
 * Handle GET /api/histogram/:videoId - Get histogram data
 */
async function handleGetHistogram(
  videoId: string,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // Validate video ID
    const validatedVideoId = validateVideoId(videoId);

    // Get histogram data
    const buckets = await getHistogram(env.DB, validatedVideoId);

    const response: HistogramResponse = {
      videoId: validatedVideoId,
      buckets
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60', // Cache for 1 minute
        ...corsHeaders 
      }
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      return jsonError(error.message, 400, corsHeaders);
    }
    
    console.error('Error fetching histogram:', error);
    return jsonError('Failed to fetch histogram', 500, corsHeaders);
  }
}

/**
 * Helper to create JSON error responses
 */
function jsonError(
  message: string,
  status: number,
  corsHeaders: Record<string, string>
): Response {
  const errorResponse: ErrorResponse = { error: message };
  
  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}
