// src/types/auth.ts
export interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string;
  email?: string; // optional, in case you use it later
}
