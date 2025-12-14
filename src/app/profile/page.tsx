// app/profile/page.tsx

"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { motion, Variants } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Camera,
  Save,
  Receipt,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "@/context/AuthContexts";
import toast from "react-hot-toast";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import UserForm from "@/components/UserForm";
import { UserProfile } from "@/types/masterclass"; // ✅ Single source of truth
import { useTheme } from "next-themes";
import Link from "next/link";

export default function ProfilePage() {
  const { user, userProfile, updateProfile, loading } = useAuth();
  const { theme } = useTheme();

  // ✅ useState now strongly typed with imported UserProfile
  const [formData, setFormData] = useState<UserProfile>({
    id: "",
    full_name: "",
    email: "",
    avatar_url: "",
    phone: "",
    bio: "",
    linkedin: "",
    created_at: "",
    transactions: [],
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        id: userProfile.id,
        full_name: userProfile.full_name || "",
        email: userProfile.email || "",
        avatar_url: userProfile.avatar_url || "",
        phone: userProfile.phone || "",
        bio: userProfile.bio || "",
        linkedin: userProfile.linkedin || "",
        created_at: userProfile.created_at || "",
        transactions: userProfile.transactions || [],
      });
    }
  }, [userProfile]);

  const handleFieldChange = (field: keyof UserProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${user.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setFormData((prev) => ({ ...prev, avatar_url: downloadURL }));
      toast.success("✅ Avatar uploaded successfully!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("❌ Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      toast.error("Please enter your full name");
      return false;
    }
    if (formData.bio && formData.bio.length < 20) {
      toast.error("Bio must be at least 20 characters");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      await updateProfile(formData);
      toast.success("🎉 Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("❌ Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // ✅ Type-safe Framer Motion variants
  const fadeInUp: Variants = {
    initial: { opacity: 0, y: 30 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading profile...
      </div>
    );

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === "dark"
          ? "bg-gray-900 text-gray-100"
          : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="pt-28 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ===== Header ===== */}
          <motion.div
            className="text-center mb-8"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
          >
            <h1 className="text-3xl font-bold mb-2">Edit Profile</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Update your information to personalize your experience.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* ===== Left Profile Card ===== */}
            <motion.div
              className="lg:col-span-1"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
            >
              <div
                className={`rounded-2xl shadow-lg p-6 text-center transition-colors duration-300 ${
                  theme === "dark" ? "bg-gray-800" : "bg-white"
                }`}
              >
                {/* Avatar Upload */}
                <div className="relative inline-block mb-4">
                  {formData.avatar_url ? (
                    <img
                      src={formData.avatar_url}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover mx-auto"
                    />
                  ) : (
                    <div
                      className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${
                        theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                      }`}
                    >
                      <User className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full hover:bg-gray-700 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Basic Info */}
                <h3 className="text-xl font-bold mb-1">
                  {formData.full_name || "Your Name"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4 capitalize">
                  {formData.linkedin ? "Professional" : "New User"}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>{formData.email}</span>
                  </div>
                  {formData.phone && (
                    <div className="flex items-center justify-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>{formData.phone}</span>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="mt-6 flex flex-col gap-3">
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Link
                      href="/purchases"
                      className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      View Purchased Classes
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Link
                      href="/transactions"
                      className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                      <Receipt className="w-4 h-4" />
                      View Transactions
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* ===== Right Form Section ===== */}
            <motion.div
              className="lg:col-span-2"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
            >
              <div
                className={`rounded-2xl shadow-lg p-8 transition-colors duration-300 ${
                  theme === "dark" ? "bg-gray-800" : "bg-white"
                }`}
              >
                <form onSubmit={handleSubmit} className="space-y-6">
                  <UserForm userData={formData} onChange={handleFieldChange} />
                  <button
                    type="submit"
                    disabled={saving || uploading}
                    className="w-full bg-black text-white py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <Save className="w-5 h-5" />
                    <span>
                      {uploading
                        ? "Uploading Avatar..."
                        : saving
                        ? "Saving..."
                        : "Save Profile"}
                    </span>
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}