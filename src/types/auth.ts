export interface UserProfile {
  id: string;                    // User UID from Firebase Auth
  email: string;                 // User email
  full_name: string;             // User's display name
  phone?: string;                // Phone number (optional)
  avatar_url?: string;           // Profile picture URL (optional)
  bio?: string;                  // User bio (optional)
  linkedin?: string;             // LinkedIn profile (optional)
  purchasedClasses: string[];    // Array of masterclass titles
  transactions?: Array<{         // Payment transaction history
    orderId: string;
    paymentId: string;
    masterclassId: string;
    amount: number;
    timestamp: string;
  }>;
  created_at: string;            // ISO timestamp
}
