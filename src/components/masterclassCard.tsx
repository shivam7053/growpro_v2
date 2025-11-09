"use client";

import React, { useState } from "react";
import {
  Play,
  User,
  Briefcase,
  Calendar,
  Lock,
  Users,
  IndianRupee,
  Tag,
  AlertCircle,
} from "lucide-react";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { Masterclass } from "@/types/masterclass";
import { getYouTubeVideoId, formatMasterclassDate } from "@/utils/masterclass";
import { addPurchasedClass, addTransactionRecord } from "@/utils/userUtils";
import PaymentModal from "@/components/PaymentModal";

interface MasterclassCardProps {
  masterclass: Masterclass;
  user: any;
  onPurchaseComplete?: () => void;
}

export default function MasterclassCard({
  masterclass: mc,
  user,
  onPurchaseComplete,
}: MasterclassCardProps) {
  const [imageError, setImageError] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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

  const videoId = getYouTubeVideoId(mc.youtube_url);
  const userJoined = user?.uid && mc.joined_users?.includes(user.uid);
  const isFree = mc.price === 0;

  // ✅ FREE ENROLLMENT
  const handleEnrollFree = async () => {
    if (!user?.uid) return toast.error("Please login to enroll");
    if (userJoined) return toast("Already enrolled!", { icon: "ℹ️" });

    try {
      // 1️⃣ Add user to MasterClass
      const classRef = doc(db, "MasterClasses", mc.id);
      await updateDoc(classRef, {
        joined_users: arrayUnion(user.uid),
      });

      // 2️⃣ Add class to user's profile
      await addPurchasedClass(user.uid, mc.title, user.email, user.displayName);

      // 3️⃣ Add transaction record
      await addTransactionRecord(user.uid, {
        orderId: "free_enroll_" + Date.now(),
        masterclassId: mc.id,
        masterclassTitle: mc.title,
        amount: 0,
        status: "success",
        method: "dummy",
        timestamp: new Date().toISOString(),
      });

      toast.success("Enrolled successfully!");
      onPurchaseComplete?.();
    } catch (err) {
      console.error("Enrollment error:", err);
      toast.error("Error processing enrollment");
    }
  };

  // ✅ PAID ENROLLMENT
  const handleEnrollPaid = () => {
    if (!user?.uid) return toast.error("Please login to enroll");
    if (userJoined) return toast("Already enrolled!", { icon: "ℹ️" });
    setShowPaymentModal(true);
  };

  // ✅ PAYMENT SUCCESS CALLBACK
  const handlePaymentSuccess = async (paymentResponse?: any) => {
    if (!user?.uid) return;

    try {
      // 1️⃣ Add user to MasterClass
      const classRef = doc(db, "MasterClasses", mc.id);
      await updateDoc(classRef, {
        joined_users: arrayUnion(user.uid),
      });

      // 2️⃣ Add purchased class
      await addPurchasedClass(user.uid, mc.title, user.email, user.displayName);

      // 3️⃣ Record transaction
      await addTransactionRecord(user.uid, {
        orderId: paymentResponse?.orderId || "dummy_order_" + Date.now(),
        paymentId: paymentResponse?.paymentId || "dummy_payment_" + Date.now(),
        masterclassId: mc.id,
        masterclassTitle: mc.title,
        amount: mc.price,
        status: "success",
        method: "razorpay",
        timestamp: new Date().toISOString(),
      });

      toast.success("Enrollment successful!");
      setShowPaymentModal(false);
      onPurchaseComplete?.();
    } catch (err) {
      console.error("Payment success handling error:", err);
      toast.error("Error updating enrollment");
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden flex flex-col h-full border border-gray-200 dark:border-gray-700">
        {/* 🎬 Thumbnail / Video */}
        <div className="relative aspect-video bg-gray-200 dark:bg-gray-800 overflow-hidden">
          {userJoined || isFree ? (
            videoId ? (
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title={mc.title}
                className="w-full h-full"
                allowFullScreen
                loading="lazy"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <Play className="w-10 h-10 mb-1" />
                <p>Video not available</p>
              </div>
            )
          ) : (
            <>
              {!imageError ? (
                <img
                  src={
                    mc.thumbnail_url ||
                    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
                  }
                  alt={mc.title}
                  className="w-full h-full object-cover brightness-75"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-300 dark:bg-gray-700">
                  <Play className="w-12 h-12 text-gray-600 dark:text-gray-300 opacity-60" />
                </div>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
                <Lock className="w-10 h-10 text-white mb-2" />
                <p className="text-white font-semibold">Locked</p>
              </div>
            </>
          )}

          {/* 🏷️ Badges */}
          <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
            {userJoined && (
              <div className="bg-blue-600 text-white px-3 py-1 text-sm rounded-full font-medium shadow">
                Enrolled
              </div>
            )}
            {mc.type && (
              <div className="bg-indigo-600 text-white px-3 py-1 text-sm rounded-full flex items-center gap-1">
                <Tag className="w-4 h-4" /> {mc.type}
              </div>
            )}
          </div>

          {/* 💸 Price Badge */}
          <div className="absolute top-3 right-3">
            {isFree ? (
              <div className="bg-green-500 text-white px-4 py-1 rounded-full font-bold shadow">
                FREE
              </div>
            ) : (
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full font-semibold shadow flex items-center gap-1">
                <IndianRupee className="w-4 h-4" />
                {mc.price}
              </div>
            )}
          </div>
        </div>

        {/* 🧠 Content */}
        <div className="p-5 flex flex-col flex-1">
          <h3
            className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2"
            title={mc.title}
          >
            {mc.title}
          </h3>

          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300 mb-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" /> {mc.speaker_name}
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> {mc.speaker_designation}
            </div>
            {mc.created_at && (
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                {formatMasterclassDate(mc.created_at)}
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Users className="w-4 h-4" /> {mc.joined_users?.length || 0} enrolled
            </div>
          </div>

          {/* 🎯 Action Button */}
          <div className="mt-auto">
            {userJoined ? (
              mc.youtube_url ? (
                <a
                  href={mc.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-semibold"
                >
                  <Play className="w-5 h-5" /> Watch Now
                </a>
              ) : (
                <button
                  disabled
                  className="w-full bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-5 py-3 rounded-lg font-semibold cursor-not-allowed"
                >
                  Video Not Available
                </button>
              )
            ) : isFree ? (
              <button
                onClick={handleEnrollFree}
                className="w-full inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-semibold"
              >
                <Play className="w-5 h-5" /> Enroll Free
              </button>
            ) : (
              <button
                onClick={handleEnrollPaid}
                className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold"
              >
                <IndianRupee className="w-5 h-5" /> Enroll Now - ₹{mc.price}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 💳 Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        masterclass={mc}
        user={user}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
}
