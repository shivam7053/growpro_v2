// types/masterclass.ts

export type FilterType = "all" | "free" | "paid" | "featured" | "enrolled" | "upcoming";

export interface PaymentDetails {
  amount: number;
  currency: string;
  masterclassId: string;
  videoId?: string;
  userId: string;
  email?: string;
  phone?: string;

  // Required by PaymentService
  masterclassTitle: string;      // ⭐ Needed for email + DB + verify API
  videoTitle?: string;           // ⭐ Needed for video purchases

  type?: TransactionType;        // Existing
}


export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  orderId?: string;
  error?: string;
  type?: TransactionType; // ✅ NEW
}

// ✅ NEW: Transaction types
export type TransactionType = 
  | "purchase";              // Simplified to only one type

export interface Transaction {
  orderId: string;
  paymentId?: string;
  masterclassId: string;
  masterclassTitle: string;
  amount: number;
  status: "pending" | "success" | "failed";
  method: "razorpay" | "dummy" | "free";
  type?: TransactionType; // ✅ NEW: Transaction type
  failureReason?: string;
  errorCode?: string; // ✅ NEW: Razorpay error code
  timestamp: string;
  updatedAt?: string; // ✅ NEW: Last update timestamp
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  linkedin?: string; // This field was also missing from the diff, adding it back.
  transactions?: Transaction[];
  created_at: string;
  selectedCheckpoints?: {
    category: string;
    checkpoints: string[];
  }[];
}

export type UserDocument = UserProfile;

// ✅ NEW: Email notification types
export interface EmailNotification {
  type: "registration" | "reminder_24h" | "reminder_30min";
  email: string;
  masterclassId: string;
  masterclassTitle: string;
  speakerName: string;
  scheduledDate: string;
  userId: string;
}

// ✅ NEW: Payment error types
export interface PaymentError {
  code: string;
  description: string;
  reason?: string;
  source?: string;
  step?: string;
  metadata?: Record<string, any>;
}

// ✅ NEW: Upcoming masterclass status
export type UpcomingStatus = 
  | "scheduled"    // Event scheduled, accepting registrations
  | "starting"     // Starting within 30 minutes
  | "live"         // Currently live
  | "completed"    // Event finished
  | "cancelled";   // Event cancelled

// ✅ NEW: Registration details
export interface Registration {
  userId: string;
  userEmail: string;
  userName: string;
  registeredAt: string;
  paymentStatus: "free" | "paid";
  amount?: number;
  transactionId?: string;
  attended?: boolean; // Track if user attended
  rating?: number; // Post-event rating
  feedback?: string; // Post-event feedback
}


// ✅ NEW: Represents a single piece of content within a Masterclass (YouTube video or Zoom session)
export interface MasterclassContent {
  id: string;
  title: string;
  description?: string;
  order: number;
  duration?: string;
  source: "youtube" | "zoom";

  // YouTube-specific fields
  youtube_url?: string;

  // Zoom-specific fields
  zoom_meeting_id?: string;
  zoom_passcode?: string;
  scheduled_date?: string; // Start time for the Zoom session
  zoom_link?: string; // The direct link to join the Zoom meeting
  zoom_end_time?: string;
}

/**
 * @description Represents a collection of educational content (videos or live sessions).
 * A Masterclass is a container for MasterclassContent items.
 */
export interface Masterclass {
  id: string;
  title: string;
  description?: string;
  speaker_name: string;
  speaker_designation: string;
  thumbnail_url?: string;
  price: number;
  type: "free" | "paid";
  created_at: string;
  
  // An array of content items (videos, zoom sessions, etc.)
  content: MasterclassContent[];

  // List of user IDs who have purchased the entire masterclass (if bundled)
  purchased_by_users: string[];
  remindersSent?: Record<string, boolean>;
  demo_video_url?: string; // Optional URL for a welcome/demo video
}

// This is now an alias for MasterclassContent, can be removed if no longer used elsewhere.
export type MasterclassVideo = MasterclassContent;
