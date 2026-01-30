// utils/typeGuards.ts

/**
 * Type Guard Utilities for Masterclass Content
 * 
 * These functions help TypeScript narrow down union types safely.
 * Use these whenever you need to check which specific content type you're working with.
 */

import { 
  MasterclassContent, 
  YoutubeContent, 
  ZoomContent, 
  TestContent 
} from '@/types/masterclass';

/**
 * Check if content is a YouTube video
 * @param content - Any MasterclassContent item
 * @returns true if content is YoutubeContent
 * 
 * @example
 * if (isYoutubeContent(content)) {
 *   // Now TypeScript knows content.youtube_url exists
 *   console.log(content.youtube_url);
 * }
 */
export const isYoutubeContent = (content: MasterclassContent): content is YoutubeContent => {
  return content.source === 'youtube';
};

/**
 * Check if content is a Zoom session
 * @param content - Any MasterclassContent item
 * @returns true if content is ZoomContent
 * 
 * @example
 * if (isZoomContent(content)) {
 *   // Now TypeScript knows content.zoom_link exists
 *   console.log(content.zoom_link);
 * }
 */
export const isZoomContent = (content: MasterclassContent): content is ZoomContent => {
  return content.source === 'zoom';
};

/**
 * Check if content is a test/assessment
 * @param content - Any MasterclassContent item
 * @returns true if content is TestContent
 * 
 * @example
 * if (isTestContent(content)) {
 *   // Now TypeScript knows content.questions exists
 *   console.log(content.questions.length);
 * }
 */
export const isTestContent = (content: MasterclassContent): content is TestContent => {
  return content.source === 'test';
};

/**
 * Check if content has a scheduled date
 * @param content - Any MasterclassContent item
 * @returns true if content has scheduled_date property
 * 
 * @example
 * if (hasScheduledDate(content)) {
 *   // Safe to access scheduled_date
 *   console.log(content.scheduled_date);
 * }
 */
export const hasScheduledDate = (
  content: MasterclassContent
): content is YoutubeContent | ZoomContent => {
  return isYoutubeContent(content) || isZoomContent(content);
};

/**
 * Get the display type of content
 * @param content - Any MasterclassContent item
 * @returns Human-readable content type
 * 
 * @example
 * const type = getContentType(content); // "YouTube Video" | "Live Zoom Session" | "Assessment Test"
 */
export const getContentType = (content: MasterclassContent): string => {
  switch (content.source) {
    case 'youtube':
      return 'YouTube Video';
    case 'zoom':
      return 'Live Zoom Session';
    case 'test':
      return 'Assessment Test';
    default:
      return 'Unknown';
  }
};

/**
 * Get the icon name for content type (for use with lucide-react)
 * @param content - Any MasterclassContent item
 * @returns Icon name string
 * 
 * @example
 * import { Play, Video, ClipboardCheck } from 'lucide-react';
 * const iconName = getContentIcon(content);
 */
export const getContentIcon = (content: MasterclassContent): string => {
  switch (content.source) {
    case 'youtube':
      return 'Play';
    case 'zoom':
      return 'Video';
    case 'test':
      return 'ClipboardCheck';
    default:
      return 'HelpCircle';
  }
};

/**
 * Check if content is currently live (for Zoom sessions)
 * @param content - Any MasterclassContent item
 * @returns true if content is a live Zoom session happening now
 * 
 * @example
 * if (isLiveNow(content)) {
 *   // Show "JOIN NOW" button
 * }
 */
export const isLiveNow = (content: MasterclassContent): boolean => {
  if (!isZoomContent(content) || !content.scheduled_date) {
    return false;
  }

  const now = new Date();
  const startTime = new Date(content.scheduled_date);
  const endTime = content.zoom_end_time 
    ? new Date(content.zoom_end_time) 
    : new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours

  return now >= startTime && now <= endTime;
};

/**
 * Check if content is upcoming (scheduled for future)
 * @param content - Any MasterclassContent item
 * @returns true if content has a future scheduled date
 * 
 * @example
 * if (isUpcoming(content)) {
 *   // Show countdown or "Coming Soon" badge
 * }
 */
export const isUpcoming = (content: MasterclassContent): boolean => {
  if (!hasScheduledDate(content) || !content.scheduled_date) {
    return false;
  }

  const scheduledTime = new Date(content.scheduled_date);
  return scheduledTime > new Date();
};

/**
 * Get formatted scheduled date for content
 * @param content - Any MasterclassContent item
 * @returns Formatted date string or null
 * 
 * @example
 * const dateStr = getFormattedScheduledDate(content);
 * // "January 29, 2026 at 2:00 PM" or null
 */
export const getFormattedScheduledDate = (content: MasterclassContent): string | null => {
  if (!hasScheduledDate(content) || !content.scheduled_date) {
    return null;
  }

  const date = new Date(content.scheduled_date);
  return date.toLocaleString('en-US', { 
    dateStyle: 'medium', 
    timeStyle: 'short' 
  });
};

/**
 * Get content duration in minutes
 * @param content - Any MasterclassContent item
 * @returns Duration in minutes or null
 * 
 * @example
 * const minutes = getContentDuration(content);
 * // 45 (for "45 min") or null
 */
export const getContentDuration = (content: MasterclassContent): number | null => {
  if (!content.duration) {
    return null;
  }

  // Parse duration string like "45 min", "1 hour", "90 minutes"
  const match = content.duration.match(/(\d+)\s*(min|hour|hr)/i);
  if (!match) {
    return null;
  }

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  if (unit.startsWith('hour') || unit === 'hr') {
    return value * 60;
  }

  return value;
};

/**
 * Safe access to content-specific properties
 * Returns undefined if property doesn't exist on this content type
 * 
 * @example
 * const videoUrl = getContentProperty(content, 'youtube_url');
 * const zoomLink = getContentProperty(content, 'zoom_link');
 */
export const getContentProperty = <K extends keyof MasterclassContent>(
  content: MasterclassContent,
  key: K
): MasterclassContent[K] | undefined => {
  return content[key];
};