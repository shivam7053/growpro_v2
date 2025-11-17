// app/masterclasses/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContexts";
import toast from "react-hot-toast";
import { Masterclass, MasterclassVideo } from "@/types/masterclass";
import { formatMasterclassDate, getYouTubeVideoId } from "@/utils/masterclass";
import { addPurchasedClass, addTransactionRecord } from "@/utils/userUtils";
import PaymentModal from "@/components/PaymentModal";

export default function MasterclassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [masterclass, setMasterclass] = useState<Masterclass | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<MasterclassVideo | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [purchasingVideo, setPurchasingVideo] = useState<MasterclassVideo | null>(null);
  const [userPurchasedVideos, setUserPurchasedVideos] = useState<string[]>([]);

  const masterclassId = params.id as string;

  // Fetch user's purchased videos
  useEffect(() => {
    const fetchUserPurchasedVideos = async () => {
      if (!user?.uid) {
        setUserPurchasedVideos([]);
        return;
      }

      try {
        const userDocRef = doc(db, "user_profiles", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUserPurchasedVideos(userData.purchasedVideos || []);
        }
      } catch (error) {
        console.error("Error fetching user purchased videos:", error);
      }
    };

    fetchUserPurchasedVideos();
  }, [user?.uid]);

  // Fetch masterclass details
  useEffect(() => {
    const fetchMasterclass = async () => {
      if (!masterclassId) return;

      try {
        setLoading(true);
        const docRef = doc(db, "MasterClasses", masterclassId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          toast.error("Masterclass not found");
          router.push("/masterclasses");
          return;
        }

        const data = docSnap.data();
        const mc: Masterclass = {
          id: docSnap.id,
          title: data.title || "",
          speaker_name: data.speaker_name || "",
          speaker_designation: data.speaker_designation || "",
          thumbnail_url: data.thumbnail_url || "",
          description: data.description || "",
          type: data.type || "free",
          scheduled_date: data.scheduled_date || "",
          created_at: data.created_at
            ? new Date(data.created_at.seconds * 1000).toISOString()
            : new Date().toISOString(),
          videos: data.videos || [],
          joined_users: data.joined_users || [],
          starting_price: data.starting_price || 0,
          total_duration: data.total_duration || "",
        };

        setMasterclass(mc);

        // Auto-select first free video or first video
        if (mc.videos.length > 0) {
          const firstFree = mc.videos.find(v => v.type === "free");
          setSelectedVideo(firstFree || mc.videos[0]);
        }
      } catch (error) {
        console.error("Error fetching masterclass:", error);
        toast.error("Error loading masterclass");
      } finally {
        setLoading(false);
      }
    };

    fetchMasterclass();
  }, [masterclassId, router]);

  const userHasAccess = user?.uid && masterclass?.joined_users?.includes(user.uid);
  
  const userHasVideoAccess = (video: MasterclassVideo) => {
    if (!user?.uid) return false;
    if (userHasAccess) return true; // Full access to masterclass
    // Check if user purchased individual video from state
    return userPurchasedVideos.includes(video.id);
  };

  // Handle video enrollment
  const handleEnrollFree = async (video: MasterclassVideo) => {
    if (!user?.uid) return toast.error("Please login to enroll");
    if (userHasVideoAccess(video)) return toast("Already enrolled!", { icon: "ℹ️" });

    try {
      const classRef = doc(db, "MasterClasses", masterclassId);
      await updateDoc(classRef, {
        joined_users: arrayUnion(user.uid),
      });

      await addPurchasedClass(user.uid, masterclass!.title, user.email || undefined, user.displayName || undefined);

      await addTransactionRecord(user.uid, {
        orderId: "free_video_" + Date.now(),
        masterclassId: masterclassId,
        videoId: video.id,
        masterclassTitle: masterclass!.title,
        videoTitle: video.title,
        amount: 0,
        status: "success",
        method: "dummy",
        timestamp: new Date().toISOString(),
      });

      toast.success("Enrolled successfully!");
      // Refresh masterclass data
      const docRef = doc(db, "MasterClasses", masterclassId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMasterclass(prev => prev ? { ...prev, joined_users: data.joined_users || [] } : null);
      }
    } catch (err) {
      console.error("Enrollment error:", err);
      toast.error("Error processing enrollment");
    }
  };

  const handleEnrollPaid = (video: MasterclassVideo) => {
    if (!user?.uid) return toast.error("Please login to enroll");
    if (userHasVideoAccess(video)) return toast("Already enrolled!", { icon: "ℹ️" });
    setPurchasingVideo(video);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (paymentResponse?: any) => {
    if (!user?.uid || !purchasingVideo) return;

    try {
      const classRef = doc(db, "MasterClasses", masterclassId);
      await updateDoc(classRef, {
        joined_users: arrayUnion(user.uid),
      });

      // Update user's purchased videos list
      const userRef = doc(db, "user_profiles", user.uid);
      await updateDoc(userRef, {
        purchasedVideos: arrayUnion(purchasingVideo.id),
      });

      await addPurchasedClass(user.uid, masterclass!.title, user.email || undefined, user.displayName || undefined);

      await addTransactionRecord(user.uid, {
        orderId: paymentResponse?.orderId || "paid_video_" + Date.now(),
        paymentId: paymentResponse?.paymentId || "payment_" + Date.now(),
        masterclassId: masterclassId,
        videoId: purchasingVideo.id,
        masterclassTitle: masterclass!.title,
        videoTitle: purchasingVideo.title,
        amount: purchasingVideo.price,
        status: "success",
        method: "razorpay",
        timestamp: new Date().toISOString(),
      });

      toast.success("Purchase successful!");
      setShowPaymentModal(false);
      setPurchasingVideo(null);

      // Refresh data
      const docRef = doc(db, "MasterClasses", masterclassId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMasterclass(prev => prev ? { ...prev, joined_users: data.joined_users || [] } : null);
      }

      // Refresh user's purchased videos
      const userDocRef = doc(db, "user_profiles", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setUserPurchasedVideos(userData.purchasedVideos || []);
      }
    } catch (err) {
      console.error("Payment success handling error:", err);
      toast.error("Error updating enrollment");
    }
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

  if (!masterclass) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Masterclass not found</p>
          <Link href="/masterclasses" className="text-indigo-600 hover:underline">
            Back to Masterclasses
          </Link>
        </div>
      </div>
    );
  }

  const videoId = selectedVideo ? getYouTubeVideoId(selectedVideo.youtube_url) : null;
  const canWatchSelected = selectedVideo && (selectedVideo.type === "free" || userHasVideoAccess(selectedVideo));

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/masterclasses"
          className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white font-medium transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Masterclasses
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video Player Section */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              {/* Video Player */}
              <div className="relative aspect-video bg-gray-900">
                {selectedVideo && canWatchSelected && videoId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={selectedVideo.title}
                    className="w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Lock className="w-16 h-16 text-gray-500 mb-4" />
                    <p className="text-gray-400 text-lg">
                      {selectedVideo?.type === "paid" ? "Purchase to unlock" : "Select a video"}
                    </p>
                  </div>
                )}
              </div>

              {/* Video Info */}
              {selectedVideo && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-2">{selectedVideo.title}</h2>
                  {selectedVideo.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{selectedVideo.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    {selectedVideo.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {selectedVideo.duration}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      {selectedVideo.type === "free" ? (
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          FREE
                        </span>
                      ) : (
                        <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          <IndianRupee className="w-3 h-3" />
                          {selectedVideo.price}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Enroll Button */}
                  {selectedVideo && !canWatchSelected && (
                    <div className="mt-4">
                      {selectedVideo.type === "free" ? (
                        <button
                          onClick={() => handleEnrollFree(selectedVideo)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                        >
                          <Play className="w-5 h-5" />
                          Watch Free
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEnrollPaid(selectedVideo)}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                        >
                          <ShoppingCart className="w-5 h-5" />
                          Purchase for ₹{selectedVideo.price}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Masterclass Info */}
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
                    <p className="font-semibold">{formatMasterclassDate(masterclass.created_at)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Students Enrolled</p>
                    <p className="font-semibold">{masterclass.joined_users?.length || 0}</p>
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

          {/* Video List Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="text-xl font-bold mb-4">Course Content</h3>
              
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {masterclass.videos.map((video, index) => {
                  const hasAccess = video.type === "free" || userHasVideoAccess(video);
                  const isSelected = selectedVideo?.id === video.id;
                  
                  return (
                    <button
                      key={video.id}
                      onClick={() => setSelectedVideo(video)}
                      className={`w-full text-left p-4 rounded-lg transition ${
                        isSelected
                          ? "bg-indigo-100 dark:bg-indigo-900 border-2 border-indigo-500"
                          : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {hasAccess ? (
                            <Play className="w-5 h-5 text-green-600" />
                          ) : (
                            <Lock className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm mb-1 line-clamp-2">
                            {index + 1}. {video.title}
                          </p>
                          
                          <div className="flex items-center gap-2 text-xs">
                            {video.duration && (
                              <span className="text-gray-500">{video.duration}</span>
                            )}
                            {video.type === "free" ? (
                              <span className="bg-green-500 text-white px-2 py-0.5 rounded-full font-semibold">
                                FREE
                              </span>
                            ) : (
                              <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
                                <IndianRupee className="w-3 h-3" />
                                {video.price}
                              </span>
                            )}
                            {hasAccess && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {purchasingVideo && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setPurchasingVideo(null);
          }}
          masterclass={{
            ...masterclass,
            price: purchasingVideo.price,
            title: `${masterclass.title} - ${purchasingVideo.title}`,
          } as any}
          user={user}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}