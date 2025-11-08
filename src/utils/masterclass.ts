// utils/masterclass.ts
import { Timestamp } from "firebase/firestore";
import { Masterclass } from "@/types/masterclass";

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
    ["free", "paid", "featured"].includes(data.type)
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
    type: type as "free" | "paid" | "featured",
    description: String(data.description ?? ""),
    duration: String(data.duration ?? "N/A"),
    thumbnail_url: String(data.thumbnail_url ?? ""),
  };
};

/**
 * Filters masterclasses based on search query, type, and enrollment status.
 */
export const filterMasterclasses = (
  masterclasses: Masterclass[],
  searchQuery: string,
  filterType: string,
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
    case "enrolled":
      filtered = userId
        ? filtered.filter((mc) => mc.joined_users.includes(userId))
        : [];
      break;
  }

  return filtered;
};
