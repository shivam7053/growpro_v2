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

interface MasterclassContentBase {
  id: string;
  title: string;
  description?: string;
  order: number;
  duration?: string;
}

export interface YoutubeContent extends MasterclassContentBase {
  source: "youtube";
  youtube_url?: string;
  scheduled_date?: string; // Optional: For premieres or live streams
  scheduled_time?: string; // Optional: For premieres or live streams
}

export interface ZoomContent extends MasterclassContentBase {
  source: "zoom";
  zoom_meeting_id?: string;
  zoom_passcode?: string;
  scheduled_date?: string; // Start time for the Zoom session
  zoom_link?: string; // The direct link to join the Zoom meeting
  zoom_end_time?: string;
}

/**
 * @description Represents a single piece of content within a Masterclass (YouTube video or Zoom session).
 */
export type MasterclassContent = YoutubeContent | ZoomContent;

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

// =====================================================
// NOTIFICATION SYSTEM TYPES
// =====================================================

// Enhanced notification types with all new features
export type AppNotificationType = 
  | 'new_masterclass'
  | 'discount'
  | 'general_update'
  | 'masterclass_reminder'      // NEW: Upcoming class reminder
  | 'enrollment_confirmation'   // NEW: Enrollment success
  | 'class_started'            // NEW: Live class notification
  | 'class_recording'          // NEW: Recording available
  | 'achievement'              // NEW: Milestone/certificate
  | 'payment_success'          // NEW: Payment confirmation
  | 'payment_failed'           // NEW: Payment issue
  | 'profile_update'           // NEW: Profile changes
  | 'new_feature'              // NEW: Platform updates
  | 'feedback_request'         // NEW: Post-class survey
  | 'certificate_ready'        // NEW: Certificate available
  | 'special_offer';           // NEW: Limited time offers

// Base notification interface with all common fields
export interface AppNotificationBase {
  id: string;
  type: AppNotificationType;
  title: string;
  message: string;
  createdAt: string; // ISO string
  status: 'draft' | 'sent';
  priority?: 'low' | 'medium' | 'high' | 'urgent'; // NEW: Priority levels (optional for backward compatibility)
  read?: boolean; // NEW: Read status (optional for backward compatibility)
  targetMasterclassId?: string; // To link to a specific masterclass
  ctaLink?: string; // A call-to-action link (e.g., /masterclasses/id)
  ctaText?: string; // Text for the CTA button (e.g., "View Now")
  icon?: string; // NEW: Icon identifier for rendering
  metadata?: Record<string, any>; // NEW: Additional data
  sourceId?: string; // ID of the original notification for fanned-out copies
  expiresAt?: string; // NEW: Auto-expire notifications
  dismissed?: boolean; // NEW: Dismissed status
}

// Specific notification interfaces for type safety
export interface MasterclassReminderNotification extends AppNotificationBase {
  type: 'masterclass_reminder';
  targetMasterclassId: string;
  metadata: {
    scheduledDate: string;
    scheduledTime: string;
    speakerName: string;
    timeUntilStart: string; // e.g., "30 minutes", "2 hours"
  };
}

export interface EnrollmentConfirmationNotification extends AppNotificationBase {
  type: 'enrollment_confirmation';
  targetMasterclassId: string;
  metadata: {
    enrollmentDate: string;
    price: number;
    nextSteps?: string[];
  };
}

export interface ClassStartedNotification extends AppNotificationBase {
  type: 'class_started';
  targetMasterclassId: string;
  priority: 'urgent';
  metadata: {
    liveUrl: string;
    speakerName: string;
  };
}

export interface ClassRecordingNotification extends AppNotificationBase {
  type: 'class_recording';
  targetMasterclassId: string;
  metadata: {
    recordingUrl: string;
    duration: string;
    availableUntil?: string;
  };
}

export interface AchievementNotification extends AppNotificationBase {
  type: 'achievement';
  metadata: {
    achievementType: 'completion' | 'milestone' | 'certificate' | 'streak';
    achievementName: string;
    badgeUrl?: string;
    description: string;
  };
}

export interface PaymentSuccessNotification extends AppNotificationBase {
  type: 'payment_success';
  metadata: {
    amount: number;
    transactionId: string;
    masterclassTitle?: string;
  };
}

export interface PaymentFailedNotification extends AppNotificationBase {
  type: 'payment_failed';
  metadata: {
    amount: number;
    transactionId: string;
    masterclassTitle?: string;
    failureReason?: string;
  };
}

export interface SpecialOfferNotification extends AppNotificationBase {
  type: 'special_offer';
  priority: 'high';
  expiresAt: string; // Required for offers
  metadata: {
    discountPercent?: number;
    originalPrice: number;
    offerPrice: number;
    validUntil: string;
    promoCode?: string;
  };
}

export interface FeedbackRequestNotification extends AppNotificationBase {
  type: 'feedback_request';
  targetMasterclassId: string;
  metadata: {
    attendedDate: string;
    surveyUrl: string;
    incentive?: string; // e.g., "Get 10% off your next course"
  };
}

export interface NewMasterclassNotification extends AppNotificationBase {
  type: 'new_masterclass';
  targetMasterclassId: string; // Required
}

export interface DiscountNotification extends AppNotificationBase {
  type: 'discount';
  targetMasterclassId: string; // Required
  metadata?: {
    discountPercent?: number;
  };
}

// Union type for all notification types
export type AppNotification = 
  | MasterclassReminderNotification
  | EnrollmentConfirmationNotification
  | ClassStartedNotification
  | ClassRecordingNotification
  | AchievementNotification
  | PaymentSuccessNotification
  | PaymentFailedNotification
  | SpecialOfferNotification
  | FeedbackRequestNotification
  | NewMasterclassNotification
  | DiscountNotification
  | AppNotificationBase; // Fallback for generic notifications

// Notification template configurations
export const NOTIFICATION_CONFIGS: Record<AppNotificationType, {
  icon: string;
  color: string;
  defaultPriority: 'low' | 'medium' | 'high' | 'urgent';
  autoExpire?: number; // Days until auto-expire
}> = {
  new_masterclass: {
    icon: 'Sparkles',
    color: 'blue',
    defaultPriority: 'medium',
  },
  discount: {
    icon: 'Tag',
    color: 'green',
    defaultPriority: 'high',
    autoExpire: 7,
  },
  general_update: {
    icon: 'Bell',
    color: 'gray',
    defaultPriority: 'low',
  },
  masterclass_reminder: {
    icon: 'Clock',
    color: 'orange',
    defaultPriority: 'high',
    autoExpire: 1,
  },
  enrollment_confirmation: {
    icon: 'CheckCircle',
    color: 'green',
    defaultPriority: 'medium',
  },
  class_started: {
    icon: 'Video',
    color: 'red',
    defaultPriority: 'urgent',
    autoExpire: 1,
  },
  class_recording: {
    icon: 'PlayCircle',
    color: 'purple',
    defaultPriority: 'medium',
  },
  achievement: {
    icon: 'Award',
    color: 'yellow',
    defaultPriority: 'medium',
  },
  payment_success: {
    icon: 'DollarSign',
    color: 'green',
    defaultPriority: 'medium',
  },
  payment_failed: {
    icon: 'AlertTriangle',
    color: 'red',
    defaultPriority: 'high',
  },
  profile_update: {
    icon: 'User',
    color: 'blue',
    defaultPriority: 'low',
  },
  new_feature: {
    icon: 'Zap',
    color: 'indigo',
    defaultPriority: 'medium',
  },
  feedback_request: {
    icon: 'MessageSquare',
    color: 'teal',
    defaultPriority: 'low',
    autoExpire: 7,
  },
  certificate_ready: {
    icon: 'FileText',
    color: 'purple',
    defaultPriority: 'medium',
  },
  special_offer: {
    icon: 'Gift',
    color: 'pink',
    defaultPriority: 'high',
    autoExpire: 3,
  },
};