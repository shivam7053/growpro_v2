"use client";
import React from "react";
import { UserProfile } from "@/types/auth";

interface UserFormProps {
  userData: UserProfile;
  onChange: (field: keyof UserProfile, value: string) => void;
  isSignup?: boolean;
}

export default function UserForm({
  userData,
  onChange,
  isSignup = true,
}: UserFormProps) {
  return (
    <div className="space-y-6">
      {/* Full Name */}
      <div>
        <input
          type="text"
          value={userData.full_name || ""}
          onChange={(e) => onChange("full_name", e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                     bg-white dark:bg-gray-800 
                     text-gray-900 dark:text-gray-100 
                     placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Full Name"
          required
        />
      </div>

      {/* Email */}
      <div>
        <input
          type="email"
          value={userData.email || ""}
          onChange={(e) => onChange("email", e.target.value)}
          className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg 
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                      bg-white dark:bg-gray-800 
                      text-gray-900 dark:text-gray-100 
                      placeholder-gray-500 dark:placeholder-gray-400 
                      ${!isSignup ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed" : ""}`}
          placeholder="Email"
          required
          disabled={!isSignup}
        />
      </div>

      {/* Phone */}
      <div>
        <input
          type="tel"
          value={userData.phone || ""}
          onChange={(e) => onChange("phone", e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                     bg-white dark:bg-gray-800 
                     text-gray-900 dark:text-gray-100 
                     placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Phone"
        />
      </div>

      {/* LinkedIn */}
      <div>
        <input
          type="url"
          value={userData.linkedin || ""}
          onChange={(e) => onChange("linkedin", e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                     bg-white dark:bg-gray-800 
                     text-gray-900 dark:text-gray-100 
                     placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="LinkedIn Profile (optional)"
        />
      </div>

      {/* Bio */}
      <div>
        <textarea
          value={userData.bio || ""}
          onChange={(e) => onChange("bio", e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                     bg-white dark:bg-gray-800 
                     text-gray-900 dark:text-gray-100 
                     placeholder-gray-500 dark:placeholder-gray-400 resize-none"
          placeholder="Write something about yourself..."
          rows={3}
        />
      </div>

      {/* Avatar */}
      <div>
        <input
          type="url"
          value={userData.avatar_url || ""}
          onChange={(e) => onChange("avatar_url", e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                     bg-white dark:bg-gray-800 
                     text-gray-900 dark:text-gray-100 
                     placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Profile Image URL (optional)"
        />
      </div>
    </div>
  );
}
