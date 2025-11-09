// types/masterclass.ts
// ✅ SINGLE SOURCE OF TRUTH FOR ALL TYPES

export interface Masterclass {
  id: string;
  title: string;
  speaker_name: string;
  speaker_designation: string;
  youtube_url: string;
  created_at: string;
  price: number;
  joined_users: string[];
  type: "free" | "paid" | "featured";
  description?: string;
  duration?: string;
  thumbnail_url?: string;
}

export type FilterType = "all" | "free" | "paid" | "featured" | "enrolled";

export interface PaymentDetails {
  amount: number;
  currency: string;
  masterclassId: string;
  userId: string;
  email?: string;
  phone?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  orderId?: string;
  error?: string;
}

export interface Transaction {
  orderId: string;
  paymentId?: string;             // Optional: only exists for successful payments
  masterclassId: string;
  masterclassTitle: string;
  amount: number;
  status: "pending" | "success" | "failed";
  method: "razorpay" | "dummy";
  failureReason?: string;         // Optional: reason for failure
  timestamp: string;              // ISO timestamp
}

export interface UserProfile {
  id: string;                     // User UID from Firebase Auth
  email: string;                  // User email
  full_name: string;              // User's display name
  phone?: string;                 // Phone number (optional)
  avatar_url?: string;            // Profile picture URL (optional)
  bio?: string;                   // User bio (optional)
  linkedin?: string;              // LinkedIn profile (optional)
  purchasedClasses: string[];     // Array of masterclass titles (successful purchases only)
  transactions?: Transaction[];   // All transaction history (success + failed)
  created_at: string;             // ISO timestamp
}

// ✅ Type alias for backward compatibility
export type UserDocument = UserProfile;