// component/masterclassCard
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  User,
  Briefcase,
  Calendar,
  Users,
  IndianRupee,
  Tag,
  AlertCircle,
  CheckCircle,
  Clock,
  Video,
  ChevronRight,
} from "lucide-react";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { Masterclass } from "@/types/masterclass";
import { formatMasterclassDate } from "@/utils/masterclass";
import { addTransactionRecord } from "@/utils/userUtils";

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
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [processing, setProcessing] = useState(false);

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

  const userJoined = user?.uid && mc.joined_users?.includes(user.uid);
  const isUpcoming = mc.type === "upcoming";
  const freeVideosCount = mc.videos?.filter(v => v.type === "free").length || 0;
  const totalVideos = mc.videos?.length || 0;
  const isFreeUpcoming = isUpcoming && mc.starting_price === 0;

  // ---------------------------------------------------
  // UPCOMING REGISTRATION (FREE)
  // ---------------------------------------------------
  const handleFreeUpcomingRegistration = async () => {
    if (!user?.uid) return toast.error("Please login to register");
    if (userJoined) return toast("Already registered!", { icon: "ℹ️" });

    setProcessing(true);
    try {
      const classRef = doc(db, "MasterClasses", mc.id);
      await updateDoc(classRef, {
        joined_users: arrayUnion(user.uid),
      });

      await addTransactionRecord(user.uid, {
        orderId: "upcoming_register_" + Date.now(),
        masterclassId: mc.id,
        masterclassTitle: mc.title,
        amount: 0,
        status: "success",
        method: "dummy",
        timestamp: new Date().toISOString(),
      });

      // Send notification email
      await sendRegistrationEmail(user.email, mc);

      toast.success("Registered successfully! Check your email for confirmation.");
      onPurchaseComplete?.();
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("Error processing registration");
    } finally {
      setProcessing(false);
    }
  };

  // ---------------------------------------------------
  // UPCOMING REGISTRATION (PAID) - Initiate Payment
  // ---------------------------------------------------
  const handlePaidUpcomingRegistration = async () => {
    if (!user?.uid) return toast.error("Please login to register");
    if (userJoined) return toast("Already registered!", { icon: "ℹ️" });

    setProcessing(true);
    try {
      // Create order for payment
      const orderResponse = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: mc.starting_price,
          masterclassId: mc.id,
          userId: user.uid,
          type: "upcoming_registration",
        }),
      });

      const orderData = await orderResponse.json();
      
      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create order");
      }

      // Initialize Razorpay payment
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: "INR",
        name: "Masterclass Registration",
        description: mc.title,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // Verify payment
          const verifyResponse = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              masterclassId: mc.id,
              userId: user.uid,
              type: "upcoming_registration",
              amount: mc.starting_price,
              masterclassTitle: mc.title,
            }),
          });

          const verifyData = await verifyResponse.json();

          if (verifyData.success) {
            toast.success("Payment successful! You're registered. Check your email.");
            onPurchaseComplete?.();
          } else {
            toast.error("Payment verification failed");
          }
        },
        modal: {
          ondismiss: async function() {
            // Mark transaction as failed if user closes modal
            await fetch("/api/payment/mark-failed", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user.uid,
                orderId: orderData.orderId,
                failureReason: "Payment modal dismissed by user",
              }),
            });
            toast.error("Payment cancelled");
          },
        },
        prefill: {
          name: user.full_name || user.email,
          email: user.email,
          contact: (user as any).phone || "",
        },
        theme: {
          color: "#3B82F6",
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      
      razorpay.on('payment.failed', async function (response: any) {
        console.error("Payment failed:", response.error);
        
        // Mark transaction as failed with error details
        await fetch("/api/payment/mark-failed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.uid,
            orderId: orderData.orderId,
            failureReason: response.error.description,
            errorCode: response.error.code,
            errorDescription: response.error.reason,
          }),
        });
        
        toast.error(`Payment failed: ${response.error.description}`);
      });
      
      razorpay.open();
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Error initiating payment");
    } finally {
      setProcessing(false);
    }
  };

  // ---------------------------------------------------
  // SEND REGISTRATION EMAIL
  // ---------------------------------------------------
  const sendRegistrationEmail = async (email: string, masterclass: Masterclass) => {
    try {
      await fetch("/api/send-registration-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          masterclassTitle: masterclass.title,
          speakerName: masterclass.speaker_name,
          scheduledDate: masterclass.scheduled_date,
          masterclassId: masterclass.id,
        }),
      });
    } catch (err) {
      console.error("Email sending error:", err);
      // Don't throw error - registration already successful
    }
  };

  const handleViewDetails = () => router.push(`/masterclasses/${mc.id}`);

  const getTypeBadgeColor = () => {
    if (isUpcoming) return "bg-blue-500 text-white";
    if (mc.type === "featured") return "bg-yellow-500 text-black";
    return "bg-indigo-600 text-white";
  };

  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden flex flex-col h-full border border-gray-200 dark:border-gray-700 group"
      onClick={handleViewDetails}
    >
      {/* ---------------------------------------------------
          THUMBNAIL + BADGES
      --------------------------------------------------- */}
      <div className="relative aspect-video bg-gray-200 dark:bg-gray-800 overflow-hidden">
        {/* Thumbnail Image */}
        {!imageError && mc.thumbnail_url ? (
          <img
            src={mc.thumbnail_url}
            alt={mc.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-500 to-purple-600">
            <Play className="w-16 h-16 text-white opacity-60" />
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition">
            <div className="bg-white dark:bg-gray-900 rounded-full p-4">
              <ChevronRight className="w-8 h-8 text-gray-900 dark:text-white" />
            </div>
          </div>
        </div>

        {/* Left Badges */}
        <div className="absolute top-3 left-3 flex gap-2 z-30">
          {userJoined && (
            <div className="bg-green-600 text-white px-3 py-1 text-sm rounded-full font-medium shadow flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              {isUpcoming ? "Registered" : "Enrolled"}
            </div>
          )}

          {mc.type && (
            <div
              className={`px-3 py-1 text-sm rounded-full flex items-center gap-1 font-semibold shadow ${getTypeBadgeColor()}`}
            >
              <Tag className="w-4 h-4" /> {mc.type}
            </div>
          )}
        </div>

        {/* Price Badge */}
        <div className="absolute top-3 right-3 z-30">
          {isUpcoming ? (
            isFreeUpcoming ? (
              <div className="bg-green-600 text-white px-4 py-1 rounded-full font-semibold shadow inline-block">
                FREE REGISTRATION
              </div>
            ) : (
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full font-semibold shadow inline-block flex items-center gap-1">
                <IndianRupee className="w-4 h-4" />
                {mc.starting_price}
              </div>
            )
          ) : mc.starting_price === 0 ? (
            <div className="bg-green-600 text-white px-4 py-1 rounded-full font-semibold shadow inline-block">
              FREE
            </div>
          ) : (
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full font-semibold shadow inline-block flex items-center gap-1">
              <IndianRupee className="w-4 h-4" />
              {mc.starting_price}+
            </div>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------
          CARD CONTENT
      --------------------------------------------------- */}
      <div className="p-5 flex flex-col flex-1">
        <h3
          className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2"
          title={mc.title}
        >
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

          {isUpcoming && mc.scheduled_date ? (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
              <Calendar className="w-4 h-4" />
              {new Date(mc.scheduled_date).toLocaleDateString()}
            </div>
          ) : mc.created_at ? (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              {formatMasterclassDate(mc.created_at)}
            </div>
          ) : null}

          {mc.total_duration && (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4" /> {mc.total_duration}
            </div>
          )}

          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Users className="w-4 h-4" />
            {mc.joined_users?.length || 0} {isUpcoming ? "registered" : "enrolled"}
          </div>

          {totalVideos > 0 && (
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium">
              <Video className="w-4 h-4" />
              {totalVideos} video{totalVideos !== 1 ? "s" : ""}
              {freeVideosCount > 0 && ` (${freeVideosCount} free)`}
            </div>
          )}
        </div>

        {mc.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {mc.description}
          </p>
        )}

        {/* Action Button */}
        <div className="mt-auto">
          {isUpcoming ? (
            userJoined ? (
              <button
                disabled
                onClick={e => e.stopPropagation()}
                className="w-full inline-flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-3 rounded-lg font-semibold cursor-not-allowed opacity-80"
              >
                <CheckCircle className="w-5 h-5" /> Registered
              </button>
            ) : isFreeUpcoming ? (
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleFreeUpcomingRegistration();
                }}
                disabled={processing}
                className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold transition disabled:opacity-50"
              >
                <Calendar className="w-5 h-5" /> 
                {processing ? "Processing..." : "Register for Free"}
              </button>
            ) : (
              <button
                onClick={e => {
                  e.stopPropagation();
                  handlePaidUpcomingRegistration();
                }}
                disabled={processing}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-5 py-3 rounded-lg font-semibold transition disabled:opacity-50"
              >
                <IndianRupee className="w-5 h-5" />
                {processing ? "Processing..." : `Register for ₹${mc.starting_price}`}
              </button>
            )
          ) : (
            <button
              onClick={handleViewDetails}
              className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg font-semibold transition"
            >
              View Details <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}