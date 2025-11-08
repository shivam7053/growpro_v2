// types/masterclass.ts
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