"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, MapPin, Save, Camera, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContexts";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import toast from "react-hot-toast";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

export default function ProfilePage() {
  const { user, userProfile, updateProfile, loading } = useAuth();

  const [formData, setFormData] = useState({
    full_name: "",
    countryCode: "+91",
    phone: "",
    location: "",
    bio: "",
    skills: [] as string[],
    experience_level: "entry",
    avatar_url: "",
  });

  const [newSkill, setNewSkill] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [purchasedClasses, setPurchasedClasses] = useState<string[]>([]);

  const countryCodes = [
    { code: "+91", name: "India" },
    { code: "+1", name: "USA" },
    { code: "+44", name: "UK" },
    { code: "+81", name: "Japan" },
    { code: "+61", name: "Australia" },
    { code: "+49", name: "Germany" },
    { code: "+33", name: "France" },
  ];

  useEffect(() => {
    if (userProfile) {
      setFormData({
        full_name: userProfile.full_name || "",
        countryCode: userProfile.countryCode || "+91",
        phone: userProfile.phone || "",
        location: userProfile.location || "",
        bio: userProfile.bio || "",
        skills: userProfile.skills || [],
        experience_level: userProfile.experience_level || "entry",
        avatar_url: userProfile.avatar_url || "",
      });
      setPurchasedClasses(userProfile.purchasedClasses || []);
    }
  }, [userProfile]);

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
    if (!formData.phone.match(/^[0-9]{10}$/)) {
      toast.error("Phone number must be exactly 10 digits");
      return false;
    }
    if (!formData.location.trim()) {
      toast.error("Please enter your location");
      return false;
    }
    if (formData.bio.trim().length < 20) {
      toast.error("Bio must be at least 20 characters long");
      return false;
    }
    if (formData.skills.length === 0) {
      toast.error("Please add at least one skill");
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

  const addSkill = () => {
    const skill = newSkill.trim();
    if (!skill) {
      toast.error("Enter a valid skill");
      return;
    }
    if (formData.skills.includes(skill)) {
      toast.error("Skill already added");
      return;
    }
    setFormData((prev) => ({ ...prev, skills: [...prev.skills, skill] }));
    setNewSkill("");
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading profile...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <Header />

      <div className="pt-28 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-8"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Edit Profile
            </h1>
            <p className="text-gray-600">
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
              <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                <div className="relative inline-block mb-4">
                  {formData.avatar_url ? (
                    <img
                      src={formData.avatar_url}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover mx-auto"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                      <User className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 bg-black text-white p-2 rounded-full hover:bg-gray-800 cursor-pointer"
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

                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {formData.full_name || "Your Name"}
                </h3>
                <p className="text-gray-600 mb-4 capitalize">
                  {formData.experience_level} Level
                </p>

                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center justify-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>{user?.email}</span>
                  </div>
                  {formData.phone && (
                    <div className="flex items-center justify-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>
                        {formData.countryCode} {formData.phone}
                      </span>
                    </div>
                  )}
                  {formData.location && (
                    <div className="flex items-center justify-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{formData.location}</span>
                    </div>
                  )}
                </div>

                {/* Purchased Classes */}
                <div className="mt-6 text-left">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Purchased Classes
                  </h4>
                  {purchasedClasses.length > 0 ? (
                    <ul className="space-y-1 text-gray-700">
                      {purchasedClasses.map((cls, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg"
                        >
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          {cls}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No classes purchased yet.</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ===== Right Edit Form ===== */}
            <motion.div
              className="lg:col-span-2"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
            >
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Full Name & Phone */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) =>
                          setFormData({ ...formData, full_name: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-black placeholder-gray-500"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={formData.countryCode}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              countryCode: e.target.value,
                            })
                          }
                          className="border border-gray-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-black text-black"
                        >
                          {countryCodes.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.name} ({c.code})
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          maxLength={10}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-black placeholder-gray-500"
                          placeholder="10-digit number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Location & Experience */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-black placeholder-gray-500"
                        placeholder="City, Country"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Experience Level
                      </label>
                      <select
                        value={formData.experience_level}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            experience_level: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-black"
                      >
                        <option value="entry">Entry</option>
                        <option value="mid">Mid</option>
                        <option value="senior">Senior</option>
                        <option value="executive">Executive</option>
                      </select>
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-black placeholder-gray-500"
                      placeholder="Tell us about yourself (min 20 chars)"
                    />
                  </div>

                  {/* Skills */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skills
                    </label>
                    <div className="flex items-center space-x-2 mb-4">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && (e.preventDefault(), addSkill())
                        }
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-black placeholder-gray-500"
                        placeholder="Add a skill (e.g. React, Marketing)"
                      />
                      <button
                        type="button"
                        onClick={addSkill}
                        className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Submit */}
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

      <Footer />
    </div>
  );
}
