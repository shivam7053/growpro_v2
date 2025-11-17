// // types/masterclass.ts
// // ✅ SINGLE SOURCE OF TRUTH FOR ALL TYPES

// export interface Masterclass {
//   id: string;
//   title: string;
//   speaker_name: string;
//   speaker_designation: string;
//   youtube_url: string;
//   created_at: string;
//   price: number;
//   joined_users: string[];
//   type: "free" | "paid" | "featured" | "upcoming";
//   description?: string;
//   duration?: string;
//   thumbnail_url?: string;
//   scheduled_date?: string; // ISO timestamp for upcoming classes
// }

// export type FilterType = "all" | "free" | "paid" | "featured" | "enrolled" | "upcoming";

// export interface PaymentDetails {
//   amount: number;
//   currency: string;
//   masterclassId: string;
//   userId: string;
//   email?: string;
//   phone?: string;
// }

// export interface PaymentResponse {
//   success: boolean;
//   transactionId?: string;
//   orderId?: string;
//   error?: string;
// }

// export interface Transaction {
//   orderId: string;
//   paymentId?: string;
//   masterclassId: string;
//   masterclassTitle: string;
//   amount: number;
//   status: "pending" | "success" | "failed";
//   method: "razorpay" | "dummy";
//   failureReason?: string;
//   timestamp: string;
// }

// export interface UserProfile {
//   id: string;
//   email: string;
//   full_name: string;
//   phone?: string;
//   avatar_url?: string;
//   bio?: string;
//   linkedin?: string;
//   purchasedClasses: string[];
//   transactions?: Transaction[];
//   created_at: string;
//   selectedCheckpoints?: {
//     category: string;
//     checkpoints: string[];
//   }[];
// }


// export type UserDocument = UserProfile;

// types/masterclass.ts
// ✅ RESTRUCTURED FOR PARENT-CHILD VIDEO ARCHITECTURE

export interface MasterclassVideo {
  id: string;
  title: string;
  youtube_url: string;
  duration?: string;
  order: number; // For sorting videos
  type: "free" | "paid";
  price: number; // 0 for free videos
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
  scheduled_date?: string; // For upcoming classes
  created_at: string;
  
  // Videos associated with this masterclass
  videos: MasterclassVideo[];
  
  // Users who have access to this masterclass
  joined_users: string[];
  
  // Pricing info (can be min price of videos or bundle price)
  starting_price: number;
  total_duration?: string;
}

export type FilterType = "all" | "free" | "paid" | "featured" | "enrolled" | "upcoming";

export interface PaymentDetails {
  amount: number;
  currency: string;
  masterclassId: string;
  videoId?: string; // For individual video purchases
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
  videoId?: string; // For individual video purchases
  masterclassTitle: string;
  videoTitle?: string;
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
  purchasedClasses: string[]; // masterclass IDs
  purchasedVideos: string[]; // individual video IDs
  transactions?: Transaction[];
  created_at: string;
  selectedCheckpoints?: {
    category: string;
    checkpoints: string[];
  }[];
}

export type UserDocument = UserProfile;