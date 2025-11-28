

import {
  MasterclassContent,
} from "@/types/masterclass";

/**
 * Extracts a YouTube video ID from various YouTube URL formats.
 */
export const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  return match ? match[1] : null;
};

/**
 * Formats a date string into a human-readable format.
 */
export const formatMasterclassDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid Date";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// alias
export const formatDate = formatMasterclassDate;

/**
 * Calculate total duration from videos
 */
export function calculateTotalDuration(content: MasterclassContent[]): string {
  if (!content || content.length === 0) return "0 min";

  let totalMinutes = 0;

  content.forEach((item) => {
    if (item.duration) {
      const hourMatch = item.duration.match(/(\d+)\s*(hour|hr|h)/i);
      const minMatch = item.duration.match(/(\d+)\s*(min|minute|m)/i);

      if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
      if (minMatch) totalMinutes += parseInt(minMatch[1]);
    }
  });

  if (totalMinutes === 0) return "Duration not set";

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  return `${hours} hour${hours > 1 ? "s" : ""} ${mins} min`;
}
