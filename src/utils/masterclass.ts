// utils/masterclass.ts
import { Timestamp } from "firebase/firestore";
import { Masterclass, FilterType } from "@/types/masterclass";

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

  // Normalize price
  const price =
    typeof data.price === "number"
      ? data.price
      : Number(data.price) || 0;

  // Ensure joined_users is an array of strings
  const joinedUsers = Array.isArray(data.joined_users)
    ? data.joined_users.filter((uid) => typeof uid === "string")
    : [];

  // Determine type if not explicitly set
  const type =
    ["free", "paid", "featured", "upcoming"].includes(data.type)
      ? data.type
      : price === 0
      ? "free"
      : "paid";

  return {
    id: docId,
    title: String(data.title),
    speaker_name: String(data.speaker_name),
    speaker_designation: String(data.speaker_designation ?? "N/A"),
    youtube_url: String(data.youtube_url ?? ""),
    created_at: createdAt,
    joined_users: joinedUsers,
    price,
    type: type as "free" | "paid" | "featured" | "upcoming",
    description: String(data.description ?? ""),
    duration: String(data.duration ?? "N/A"),
    thumbnail_url: String(data.thumbnail_url ?? ""),
    scheduled_date: scheduledDate,
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
      [mc.title, mc.speaker_name, mc.speaker_designation].some((field) =>
        field?.toLowerCase().includes(query)
      )
    );
  }

  // Apply type filter
  switch (filterType) {
    case "free":
      filtered = filtered.filter((mc) => mc.type === "free" || mc.price === 0);
      break;
    case "paid":
      filtered = filtered.filter((mc) => mc.type === "paid" || mc.price > 0);
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

  // Free classes are always accessible
  if (masterclass.price === 0 || masterclass.type === "free") {
    return true;
  }

  // Paid classes require enrollment
  return userId ? masterclass.joined_users?.includes(userId) ?? false : false;
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
  const isFree = masterclass.price === 0 || masterclass.type === "free";

  if (isUpcoming && isEnrolled) return "Registered";
  if (isUpcoming) return "Register for Free";
  if (isEnrolled) return "Watch Now";
  if (isFree) return "Enroll for Free";
  return `Enroll - ₹${masterclass.price}`;
}