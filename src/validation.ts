// Input validation utilities

import { ViewRange, TrackRequest } from './types';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validates a single view range
 */
export function validateRange(range: ViewRange): boolean {
  if (typeof range.startTime !== 'number' || typeof range.endTime !== 'number') {
    return false;
  }
  
  if (range.startTime < 0 || range.endTime < 0) {
    return false;
  }
  
  if (range.startTime >= range.endTime) {
    return false;
  }
  
  if (!Number.isFinite(range.startTime) || !Number.isFinite(range.endTime)) {
    return false;
  }
  
  return true;
}

/**
 * Validates and sanitizes track request payload
 */
export function validateTrackRequest(body: unknown): TrackRequest {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Invalid request body');
  }
  
  const data = body as Record<string, unknown>;
  
  // Validate videoId
  if (!data.videoId || typeof data.videoId !== 'string') {
    throw new ValidationError('videoId is required and must be a string');
  }
  
  if (data.videoId.trim().length === 0) {
    throw new ValidationError('videoId cannot be empty');
  }
  
  // Validate ranges array
  if (!Array.isArray(data.ranges)) {
    throw new ValidationError('ranges must be an array');
  }
  
  if (data.ranges.length === 0) {
    throw new ValidationError('ranges array cannot be empty');
  }
  
  if (data.ranges.length > 1000) {
    throw new ValidationError('Too many ranges (maximum: 1000)');
  }
  
  // Filter valid ranges
  const validRanges = data.ranges.filter(range => {
    if (!range || typeof range !== 'object') return false;
    return validateRange(range as ViewRange);
  });
  
  if (validRanges.length === 0) {
    throw new ValidationError('No valid ranges found');
  }
  
  return {
    videoId: data.videoId.trim(),
    ranges: validRanges as ViewRange[]
  };
}

/**
 * Validates video ID from URL parameter
 */
export function validateVideoId(videoId: string | null): string {
  if (!videoId || typeof videoId !== 'string') {
    throw new ValidationError('videoId is required');
  }
  
  if (videoId.trim().length === 0) {
    throw new ValidationError('videoId cannot be empty');
  }
  
  return videoId.trim();
}
