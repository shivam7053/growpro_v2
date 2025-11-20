// types/masterclass.ts
// ✅ UPDATED WITH NEW TRANSACTION FIELDS

export interface MasterclassVideo {
  id: string;
  title: string;
  youtube_url: string;
  duration?: string;
  order: number;
  type: "free" | "paid";
  price: number;
  description?: string;
}

export interface Masterclass {
  id: string;
  title: string;
  speaker_name: string;
  speaker_designation: string;
  thumbnail_url?: string;
  description?: string;
  type: "free" | "paid" | "featured" | "upcoming";
  scheduled_date?: string;
  created_at: string;
  videos: MasterclassVideo[];
  joined_users: string[];
  starting_price: number;
  total_duration?: string;
}

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
  | "purchase"              // Regular masterclass purchase
  | "upcoming_registration" // Paid registration for upcoming
  | "video_purchase"        // Individual video purchase
  | "free_registration";    // Free upcoming registration

export interface Transaction {
  orderId: string;
  paymentId?: string;
  masterclassId: string;
  videoId?: string; // ✅ For individual video purchases
  masterclassTitle: string;
  videoTitle?: string; // ✅ For individual video purchases
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
  linkedin?: string;
  purchasedClasses: string[];
  purchasedVideos: string[]; // ✅ Individual video IDs
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