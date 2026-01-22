// Type definitions for video watch analytics

export interface Env {
  DB: D1Database;
}

export interface ViewRange {
  startTime: number;
  endTime: number;
}

export interface TrackRequest {
  videoId: string;
  ranges: ViewRange[];
}

export interface TrackResponse {
  bucketsUpdated: number;
}

export interface HistogramBucket {
  bucketStart: number;
  viewCount: number;
}

export interface HistogramResponse {
  videoId: string;
  buckets: HistogramBucket[];
}

export interface ErrorResponse {
  error: string;
  details?: string;
}

export interface VideoMetadata {
  videoId: string;
  duration: number;
  totalViews: number;
  createdAt?: number;
  updatedAt?: number;
}
