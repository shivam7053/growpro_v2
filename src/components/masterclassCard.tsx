"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  User,
  Briefcase,
  Calendar,
  IndianRupee,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Video,
} from "lucide-react";
import { Masterclass } from "@/types/masterclass";
import { formatMasterclassDate } from "@/utils/masterclass";

interface MasterclassCardProps {
  masterclass: Masterclass;
  user: any;
}

export default function MasterclassCard({
  masterclass: mc,
  user,
}: MasterclassCardProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  if (!mc?.id) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center h-full border border-gray-200 dark:border-gray-700">
        <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
        <p className="text-gray-600 dark:text-gray-300 text-center">
          Invalid masterclass data
        </p>
      </div>
    );
  }

  // --- New logic based on the `content` array ---
  const isEnrolled = user?.uid && mc.purchased_by_users?.includes(user.uid);
  const isFree = mc.type === 'free';
  const hasLiveSessions = mc.content.some((c) => c.source === "zoom");

  const handleViewDetails = () => router.push(`/masterclasses/${mc.id}`);

  return (
    <>
      {/* CARD */}
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full border border-gray-200 dark:border-gray-700 group cursor-pointer"
        onClick={handleViewDetails}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gray-200 dark:bg-gray-800 overflow-hidden">
          {!imageError && mc.thumbnail_url ? (
            <img
              src={mc.thumbnail_url}
              alt={mc.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-500 to-purple-600">
              <Play className="w-16 h-16 text-white opacity-60" />
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-white dark:bg-gray-900 rounded-full p-4">
                <ChevronRight className="w-8 h-8 text-gray-900 dark:text-white" />
              </div>
            </div>
          </div>

          {/* Left Badges */}
          <div className="absolute top-3 left-3 flex gap-2 z-10">
            {isEnrolled && (
              <div className="bg-green-600 text-white px-3 py-1 text-sm rounded-full font-medium shadow flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Enrolled
              </div>
            )}
            {hasLiveSessions && (
              <div className="bg-purple-600 text-white px-3 py-1 text-sm rounded-full font-medium shadow flex items-center gap-1">
                <Video className="w-4 h-4" /> Live
              </div>
            )}
            {/* ✅ NEW: Demo Video Badge */}
            {mc.demo_video_url && !isEnrolled && (
              <div className="bg-yellow-500 text-white px-3 py-1 text-sm rounded-full font-medium shadow flex items-center gap-1">
                <Play className="w-4 h-4" />
                Preview
              </div>
            )}
          </div>

          {/* Price Badge */}
          <div className="absolute top-3 right-3 z-10">
            <div className={`px-4 py-1 rounded-full font-semibold shadow flex items-center gap-1 ${isFree ? 'bg-green-600 text-white' : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'}`}>
              {isFree ? "FREE" : <><IndianRupee className="w-4 h-4" />{mc.price}</>}
            </div>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-5 flex flex-col flex-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
            {mc.title}
          </h3>

          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300 mb-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {mc.speaker_name}
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              {mc.speaker_designation}
            </div>
            {mc.created_at && (
              <div className="flex items-center gap-2 text-gray-500">
                <Calendar className="w-4 h-4" />
                {formatMasterclassDate(mc.created_at)}
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="mt-auto pt-4">
            <button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              View Details <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
