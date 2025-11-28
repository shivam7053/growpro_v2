// app/masterclasses/[id]/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Lock,
  User,
  Briefcase,
  Calendar,
  Clock,
  Users,
  IndianRupee,
  CheckCircle,
  ShoppingCart,
  AlertCircle,
  Video,
} from "lucide-react";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContexts";
import toast from "react-hot-toast";
import { Masterclass, MasterclassContent } from "@/types/masterclass";
import { formatMasterclassDate, getYouTubeVideoId } from "@/utils/masterclass";
import { addTransactionRecord } from "@/utils/userUtils";
import ZoomPanel from "@/components/ZoomPanel";
import PaymentModal from "@/components/PaymentModal";

export default function MasterclassDetailPage() {
  const params = useParams();
  const { user } = useAuth();

  const [masterclass, setMasterclass] = useState<Masterclass | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<MasterclassContent | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [error, setError] = useState<string | null>(null); // ✅ NEW: State for handling errors
  const [processing, setProcessing] = useState(false);

  const masterclassId = params.id as string;

  // Fetch user's purchased videos

  // Fetch masterclass details
  useEffect(() => {
    const fetchMasterclass = async () => {
      if (!masterclassId) return;

      try {
        setLoading(true);
        const docRef = doc(db, "MasterClasses", masterclassId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError("Masterclass not found."); // ✅ NEW: Set error state
          // Consider redirecting here
          return;
        }

        const data = docSnap.data();

        // Build Masterclass object using the new structure
        const mc: Masterclass = {
          id: docSnap.id,
          title: data.title || "",
          speaker_name: data.speaker_name || "",
          speaker_designation: data.speaker_designation || "",
          thumbnail_url: data.thumbnail_url || "",
          description: data.description || "",
          price: data.price || 0,
          type: data.type || 'free',
          created_at: data.created_at
            ? new Date(data.created_at.seconds * 1000).toISOString()
            : new Date().toISOString(),
          content: (data.content || []).sort((a: MasterclassContent, b: MasterclassContent) => a.order - b.order),
          purchased_by_users: data.purchased_by_users || [],
          demo_video_url: data.demo_video_url || '', // ✅ Fetch the demo video URL
        };

        setMasterclass(mc);

        // Auto-select the first piece of content
        if (mc.content.length > 0) {
          setSelectedContent(mc.content[0]);
        }
      } catch (error) {
        console.error("Error fetching masterclass:", error);
        setError("Failed to load masterclass details."); // ✅ NEW: Set error state
      } finally {
        setLoading(false);
      }
    };

    toast.loading("Loading masterclass details...", { id: "loading-toast" });
    fetchMasterclass();
    toast.dismiss("loading-toast");
  }, [masterclassId]); // ✅ CORRECTED: Removed user?.uid dependency

  const userHasFullAccess = user?.uid && masterclass?.purchased_by_users?.includes(user.uid);

  const isMasterclassFree = masterclass?.type === 'free';

  // Refresh masterclass data after purchase
  const refreshMasterclassData = useCallback(async () => {
    if (!masterclassId) return;
    
    try {
      const docRef = doc(db, "MasterClasses", masterclassId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setMasterclass((prev) =>
          prev
            ? {
                ...prev,
                purchased_by_users: data.purchased_by_users || [],
              }
            : null
        );
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  }, [masterclassId]);

  // Handle enrollment for a FREE masterclass
  const handleFreeEnrollment = async () => {
    if (!user?.uid) return toast.error("Please login to enroll.");
    if (userHasFullAccess) return toast("You are already enrolled.", { icon: "ℹ️" });
    if (!masterclass) return;

    setProcessing(true);
    try {
      const masterclassRef = doc(db, "MasterClasses", masterclassId);
      await updateDoc(masterclassRef, {
        purchased_by_users: arrayUnion(user.uid),
      });

      await addTransactionRecord(user.uid, {
        orderId: "free_enroll_" + Date.now(),
        masterclassId: masterclassId,
        masterclassTitle: masterclass.title,
        amount: 0,
        status: "success",
        method: "free",
        type: "purchase",
        timestamp: new Date().toISOString(),
      });

      toast.success("Enrolled successfully!");
      await refreshMasterclassData();
    } catch (err) {
      console.error("Free enrollment error:", err);
      toast.error("Error processing enrollment.");
    } finally {
      setProcessing(false);
    }
  };

  // Handle enrollment for a PAID masterclass
  const handlePaidEnrollment = () => {
    if (!user?.uid) return toast.error("Please login to enroll.");
    if (userHasFullAccess) return toast("You are already enrolled.", { icon: "ℹ️" });

    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    toast.success("Purchase successful! Check your email for confirmation.");
    setShowPaymentModal(false);
    await refreshMasterclassData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading masterclass...</p>
        </div>
      </div>
    );
  }

  // ✅ NEW: Handle error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-4 font-semibold">{error}</p>
          <Link href="/masterclasses" className="text-indigo-600 hover:underline">
            Back to Masterclasses
          </Link>
        </div>
      </div>
    );
  }

  if (!masterclass) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        {/* This state is now handled by the loading and error states above */}
      </div>
    );
  }

  const isUpcomingContent = (content: MasterclassContent) =>
    content.source === 'zoom' && content.scheduled_date && new Date(content.scheduled_date) > new Date(); // This function is not used, can be removed if desired.

  const videoId = selectedContent?.source === "youtube" && selectedContent.youtube_url ? getYouTubeVideoId(selectedContent.youtube_url) : null;

  // Fixed return statement for app/masterclasses/[id]/page.tsx
// Replace the return statement in your component with this corrected version

return (
  <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/masterclasses" // ✅ Improved navigation
        className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white font-medium transition mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Masterclasses
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Player / Zoom panel */}
          {selectedContent?.source === "zoom" && (
            <ZoomPanel
              content={selectedContent}
              hasAccess={!!(userHasFullAccess || isMasterclassFree)}
              processing={processing}
            />
          )}
          {selectedContent?.source === "youtube" && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="relative aspect-video bg-gray-900">
                {(userHasFullAccess || isMasterclassFree) && videoId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={selectedContent.title}
                    className="w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Lock className="w-16 h-16 text-gray-500 mb-4" />
                    <p className="text-gray-400 text-lg">
                      {isMasterclassFree ? "Select a video" : "Purchase to unlock"}
                    </p>
                  </div>
                )}
              </div>

              {selectedContent && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-2">{selectedContent.title}</h2>
                  {selectedContent.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{selectedContent.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    {selectedContent.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {selectedContent.duration}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ✅ CORRECTED: Demo Video Section was missing from the final JSX */}
          {masterclass.demo_video_url && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-6">
               <div className="flex items-center gap-3 mb-4">
                <Video className="w-6 h-6 text-indigo-500" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Watch the Welcome Video
                </h2>
              </div>
              <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${getYouTubeVideoId(masterclass.demo_video_url)}`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}

          {/* Details block (title, instructor, about) */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-6">
            <h1 className="text-3xl font-bold mb-4">{masterclass.title}</h1>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Instructor</p>
                  <p className="font-semibold">{masterclass.speaker_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Designation</p>
                  <p className="font-semibold">{masterclass.speaker_designation}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Published</p>
                  <p className="font-semibold">
                    {formatMasterclassDate(masterclass.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Total Enrollments</p>
                  <p className="font-semibold">{masterclass.purchased_by_users?.length || 0}</p>
                </div>
              </div>
            </div>

            {masterclass.description && (
              <div>
                <h3 className="font-semibold text-lg mb-2">About this Masterclass</h3>
                <p className="text-gray-600 dark:text-gray-400">{masterclass.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: course content */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-8">
            <h3 className="text-xl font-bold mb-4">Course Content</h3>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {masterclass.content.map((contentItem, index) => {
                const hasAccess = userHasFullAccess || isMasterclassFree;
                const isSelected = selectedContent?.id === contentItem.id;
                const isUpcoming = isUpcomingContent(contentItem);

                return (
                  <button
                    key={contentItem.id}
                    onClick={() => hasAccess && setSelectedContent(contentItem)} // The hasAccess check is sufficient
                    disabled={!hasAccess && !isUpcoming} // Only disable if no access AND not an upcoming item they might want to see info for
                    className={`w-full text-left p-4 rounded-lg transition ${
                      isSelected
                        ? "bg-indigo-100 dark:bg-indigo-900 border-2 border-indigo-500"
                        : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                    } ${!hasAccess ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {isUpcoming ? (
                          <Calendar className="w-5 h-5 text-blue-500" />
                        ) : hasAccess ? (
                          <Play className="w-5 h-5 text-green-600" />
                        ) : (
                          <Lock className="w-5 h-5 text-gray-500" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm mb-1 line-clamp-2">
                          {index + 1}. {contentItem.title}
                        </p>

                        <div className="flex items-center gap-2 text-xs">
                          {contentItem.duration && (
                            <span className="text-gray-500">{contentItem.duration}</span>
                          )}
                          {hasAccess && <CheckCircle className="w-4 h-4 text-green-600" />}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ENROLL BUTTON */}
            {!userHasFullAccess && (
              <div className="mt-6 border-t pt-6">
                {isMasterclassFree ? (
                  <button
                    onClick={handleFreeEnrollment}
                    disabled={processing}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {processing ? "Processing..." : "Enroll for Free"}
                  </button>
                ) : (
                  <button
                    onClick={handlePaidEnrollment}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Enroll for ₹{masterclass.price}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* PAYMENT MODAL */}
    {showPaymentModal && masterclass && (
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
        }}
        masterclass={masterclass}
        user={user}
        purchaseType={"purchase"}
        amount={masterclass.price}
        onPurchaseSuccess={handlePaymentSuccess}
      />
    )}
  </div>
);
}