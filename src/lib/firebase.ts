// firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Firebase configuration — securely loaded via environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Initialize Firebase only once (important for Next.js hot reload)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export commonly used Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;

// ==============================
// 🔹 TYPES (migrated from Supabase.ts)
// ==============================

// Masterclass (formerly Workshop)
export interface Workshop {
  id: string;
  title: string;
  description: string;
  speaker_name: string;
  speaker_title: string;
  date: string; // can be parsed into Date when needed
  time: string;
  price: number;
  currency?: string;
  highlights: string[];
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

// Free masterclass (YouTube-based)
export interface FreeWorkshop {
  id: string;
  title: string;
  speaker_name: string;
  speaker_designation: string;
  youtube_url: string;
  created_at: string;
}

// User profile
export interface UserProfile {
  id: string;
  full_name?: string;
  phone?: string;
  location?: string;
  bio?: string;
  skills: string[];
  experience_level: string;
  role: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// Global job or internship opportunities
export interface Opportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  skills: string[];
  posted_date: string;
  created_at: string;
}

// Firebase user (auth)
export interface User {
  id: string;
  email: string;
  created_at: string;
}
