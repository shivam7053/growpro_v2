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
  type: "free" | "paid" | "featured" | "upcoming";
  description?: string;
  duration?: string;
  thumbnail_url?: string;
  scheduled_date?: string; // ISO timestamp for upcoming classes
}

export type FilterType = "all" | "free" | "paid" | "featured" | "enrolled" | "upcoming";

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
  paymentId?: string;
  masterclassId: string;
  masterclassTitle: string;
  amount: number;
  status: "pending" | "success" | "failed";
  method: "razorpay" | "dummy";
  failureReason?: string;
  timestamp: string;
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
  transactions?: Transaction[];
  created_at: string;
}

export type UserDocument = UserProfile;