// utils/masterclass.ts
import { Timestamp } from "firebase/firestore";
import { Masterclass, MasterclassVideo, FilterType } from "@/types/masterclass";

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
 * Example: "2025-11-08T10:00:00Z" → "Nov 8, 2025"
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

/**
 * Alias for formatMasterclassDate for backward compatibility
 */
export const formatDate = formatMasterclassDate;

/**
 * Parses raw Firestore document data into a strongly typed Masterclass object.
 * ✅ UPDATED: Now handles videos array and new structure
 */
export const parseMasterclassData = (
  docId: string,
  data: Record<string, any>
): Masterclass | null => {
  if (!data?.title || !data?.speaker_name) return null;

  // Normalize creation date
  const createdAt =
    data.created_at instanceof Timestamp
      ? data.created_at.toDate().toISOString()
      : typeof data.created_at === "string"
      ? data.created_at
      : new Date().toISOString();

  // Normalize scheduled date for upcoming classes
  const scheduledDate =
    data.scheduled_date instanceof Timestamp
      ? data.scheduled_date.toDate().toISOString()
      : typeof data.scheduled_date === "string"
      ? data.scheduled_date
      : "";

  // ✅ Parse videos array
  const videos: MasterclassVideo[] = Array.isArray(data.videos)
    ? data.videos.map((v: any, index: number) => ({
        id: v.id || `video_${index}_${Date.now()}`,
        title: v.title || "Untitled Video",
        youtube_url: v.youtube_url || "",
        duration: v.duration || "",
        order: typeof v.order === "number" ? v.order : index,
        type: v.type === "paid" ? "paid" : "free",
        price: Number(v.price) || 0,
        description: v.description || "",
      }))
    : [];

  // ✅ Get starting price from videos or fallback to old price field
  const startingPrice = data.starting_price !== undefined
    ? Number(data.starting_price)
    : data.price !== undefined
    ? Number(data.price)
    : 0;

  // Ensure joined_users is an array of strings
  const joinedUsers = Array.isArray(data.joined_users)
    ? data.joined_users.filter((uid) => typeof uid === "string")
    : [];

  // Determine type if not explicitly set
  const type =
    ["free", "paid", "featured", "upcoming"].includes(data.type)
      ? data.type
      : startingPrice === 0
      ? "free"
      : "paid";

  return {
    id: docId,
    title: String(data.title),
    speaker_name: String(data.speaker_name),
    speaker_designation: String(data.speaker_designation ?? "N/A"),
    thumbnail_url: String(data.thumbnail_url ?? ""),
    description: String(data.description ?? ""),
    type: type as "free" | "paid" | "featured" | "upcoming",
    scheduled_date: scheduledDate,
    created_at: createdAt,
    videos,
    joined_users: joinedUsers,
    starting_price: startingPrice,
    total_duration: String(data.total_duration ?? ""),
  };
};

/**
 * Filters masterclasses based on search query, type, and enrollment status.
 */
export const filterMasterclasses = (
  masterclasses: Masterclass[],
  searchQuery: string,
  filterType: FilterType,
  userId?: string
): Masterclass[] => {
  let filtered = [...masterclasses];

  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter((mc) =>
      [mc.title, mc.speaker_name, mc.speaker_designation, mc.description].some((field) =>
        field?.toLowerCase().includes(query)
      )
    );
  }

  // Apply type filter
  switch (filterType) {
    case "free":
      filtered = filtered.filter((mc) => mc.type === "free" || mc.starting_price === 0);
      break;
    case "paid":
      filtered = filtered.filter((mc) => mc.type === "paid" || mc.starting_price > 0);
      break;
    case "featured":
      filtered = filtered.filter((mc) => mc.type === "featured");
      break;
    case "upcoming":
      filtered = filtered.filter((mc) => mc.type === "upcoming");
      break;
    case "enrolled":
      filtered = userId
        ? filtered.filter((mc) => mc.joined_users.includes(userId))
        : [];
      break;
  }

  // Sort: upcoming first (by scheduled date), then by created date
  filtered.sort((a, b) => {
    // Both upcoming - sort by scheduled date
    if (a.type === "upcoming" && b.type === "upcoming") {
      const dateA = a.scheduled_date ? new Date(a.scheduled_date).getTime() : 0;
      const dateB = b.scheduled_date ? new Date(b.scheduled_date).getTime() : 0;
      return dateA - dateB; // Earlier dates first
    }
    
    // One is upcoming - upcoming comes first
    if (a.type === "upcoming" && b.type !== "upcoming") return -1;
    if (a.type !== "upcoming" && b.type === "upcoming") return 1;
    
    // Neither upcoming - sort by created date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return filtered;
};

/**
 * Checks if a masterclass is accessible to the user
 */
export function isMasterclassAccessible(
  masterclass: Masterclass,
  userId?: string
): boolean {
  // Upcoming classes require registration but aren't accessible yet
  if (masterclass.type === "upcoming") {
    return false;
  }

  // If user has enrolled, they have access
  if (userId && masterclass.joined_users?.includes(userId)) {
    return true;
  }

  // Check if there are any free videos
  const hasFreeVideos = masterclass.videos?.some(v => v.type === "free");
  return hasFreeVideos || masterclass.starting_price === 0;
}

/**
 * Gets the appropriate action text for a masterclass card
 */
export function getMasterclassActionText(
  masterclass: Masterclass,
  userId?: string
): string {
  const isEnrolled = userId && masterclass.joined_users?.includes(userId);
  const isUpcoming = masterclass.type === "upcoming";

  if (isUpcoming && isEnrolled) return "Registered";
  if (isUpcoming) return "Register for Free";
  if (isEnrolled) return "Continue Learning";
  return "View Details";
}

/**
 * ✅ NEW: Calculate total duration from videos
 */
export function calculateTotalDuration(videos: MasterclassVideo[]): string {
  if (!videos || videos.length === 0) return "0 min";

  let totalMinutes = 0;

  videos.forEach((video) => {
    if (video.duration) {
      // Parse duration like "45 min", "1 hour 30 min", "2 hours"
      const hourMatch = video.duration.match(/(\d+)\s*(?:hour|hr|h)/i);
      const minMatch = video.duration.match(/(\d+)\s*(?:min|minute|m)/i);

      if (hourMatch) {
        totalMinutes += parseInt(hourMatch[1]) * 60;
      }
      if (minMatch) {
        totalMinutes += parseInt(minMatch[1]);
      }
    }
  });

  if (totalMinutes === 0) return "Duration not set";

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hours === 0) {
    return `${mins} min`;
  } else if (mins === 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  } else {
    return `${hours} hour${hours > 1 ? "s" : ""} ${mins} min`;
  }
}

/**
 * ✅ NEW: Get minimum price from videos
 */
export function getStartingPrice(videos: MasterclassVideo[]): number {
  if (!videos || videos.length === 0) return 0;

  const paidVideos = videos.filter((v) => v.type === "paid");
  if (paidVideos.length === 0) return 0;

  return Math.min(...paidVideos.map((v) => v.price));
}

/**
 * ✅ NEW: Check if user has access to a specific video
 */
export function hasVideoAccess(
  video: MasterclassVideo,
  userId?: string,
  masterclassJoinedUsers?: string[],
  userPurchasedVideos?: string[]
): boolean {
  if (!userId) return video.type === "free";
  
  // User has full masterclass access
  if (masterclassJoinedUsers?.includes(userId)) return true;
  
  // User purchased individual video
  if (userPurchasedVideos?.includes(video.id)) return true;
  
  // Free video
  return video.type === "free";
}

/**
 * ✅ NEW: Get video statistics for a masterclass
 */
export function getVideoStats(videos: MasterclassVideo[]) {
  const total = videos.length;
  const free = videos.filter((v) => v.type === "free").length;
  const paid = videos.filter((v) => v.type === "paid").length;
  const totalPrice = videos
    .filter((v) => v.type === "paid")
    .reduce((sum, v) => sum + v.price, 0);

  return {
    total,
    free,
    paid,
    totalPrice,
    averagePrice: paid > 0 ? Math.round(totalPrice / paid) : 0,
  };
}