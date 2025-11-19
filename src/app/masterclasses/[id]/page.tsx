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
  AlertCircle,
} from "lucide-react";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContexts";
import toast from "react-hot-toast";
import { Masterclass, MasterclassVideo } from "@/types/masterclass";
import { formatMasterclassDate, getYouTubeVideoId } from "@/utils/masterclass";
import { addTransactionRecord } from "@/utils/userUtils";
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
  const [processing, setProcessing] = useState(false);

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

        // Auto-select first accessible video
        if (mc.videos.length > 0) {
          const userHasFullAccess = user?.uid && mc.joined_users?.includes(user.uid);
          
          // Find first accessible video
          const firstAccessible = mc.videos.find(v => 
            v.type === "free" || 
            userHasFullAccess || 
            (user?.uid && userPurchasedVideos.includes(v.id))
          );
          
          setSelectedVideo(firstAccessible || mc.videos[0]);
        }
      } catch (error) {
        console.error("Error fetching masterclass:", error);
        toast.error("Error loading masterclass");
      } finally {
        setLoading(false);
      }
    };

    fetchMasterclass();
  }, [masterclassId, router, user?.uid, userPurchasedVideos]);

  const userHasAccess = user?.uid && masterclass?.joined_users?.includes(user.uid);
  const isUpcoming = masterclass?.type === "upcoming";
  
  const userHasVideoAccess = (video: MasterclassVideo) => {
    if (!user?.uid) return video.type === "free";
    if (userHasAccess) return true;
    if (video.type === "free") return true;
    return userPurchasedVideos.includes(video.id);
  };

  // Handle free registration for upcoming
  const handleFreeUpcomingRegistration = async () => {
    if (!user?.uid) return toast.error("Please login to register");
    if (userHasAccess) return toast("Already registered!", { icon: "ℹ️" });

    setProcessing(true);
    try {
      const classRef = doc(db, "MasterClasses", masterclassId);
      await updateDoc(classRef, {
        joined_users: arrayUnion(user.uid),
      });

      await addTransactionRecord(user.uid, {
        orderId: "free_upcoming_" + Date.now(),
        masterclassId: masterclassId,
        masterclassTitle: masterclass!.title,
        amount: 0,
        status: "success",
        method: "dummy",
        type: "free_registration",
        timestamp: new Date().toISOString(),
      });

      // Send registration email
      try {
        await fetch("/api/send-registration-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            masterclassTitle: masterclass!.title,
            speakerName: masterclass!.speaker_name,
            scheduledDate: masterclass!.scheduled_date,
            masterclassId: masterclassId,
          }),
        });
      } catch (emailError) {
        console.error("Email error:", emailError);
      }

      toast.success("Registered successfully! Check your email.");
      
      const docRef = doc(db, "MasterClasses", masterclassId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMasterclass(prev => prev ? { ...prev, joined_users: data.joined_users || [] } : null);
      }
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("Error processing registration");
    } finally {
      setProcessing(false);
    }
  };

  // Handle paid registration for upcoming
  const handlePaidUpcomingRegistration = async () => {
    if (!user?.uid) return toast.error("Please login to register");
    if (userHasAccess) return toast("Already registered!", { icon: "ℹ️" });

    setProcessing(true);
    try {
      const orderResponse = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: masterclass!.starting_price,
          masterclassId: masterclassId,
          userId: user.uid,
          type: "upcoming_registration",
        }),
      });

      const orderData = await orderResponse.json();
      
      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create order");
      }

      const razorpay = new (window as any).Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: "INR",
        name: "Masterclass Registration",
        description: masterclass!.title,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          const verifyResponse = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              masterclassId: masterclassId,
              userId: user.uid,
              type: "upcoming_registration",
              amount: masterclass!.starting_price,
              masterclassTitle: masterclass!.title,
            }),
          });

          const verifyData = await verifyResponse.json();

          if (verifyData.success) {
            toast.success("Registration successful! Check your email.");
            
            const docRef = doc(db, "MasterClasses", masterclassId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              setMasterclass(prev => prev ? { ...prev, joined_users: data.joined_users || [] } : null);
            }
          } else {
            toast.error("Payment verification failed");
          }
        },
        modal: {
          ondismiss: async function() {
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
          name: user.displayName || user.email,
          email: user.email,
          contact: (user as any).phone || user.phoneNumber || "",
        },
        theme: { color: "#3B82F6" },
      });

      razorpay.on('payment.failed', async function (response: any) {
        await fetch("/api/payment/mark-failed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.uid,
            orderId: orderData.orderId,
            failureReason: response.error.description,
            errorCode: response.error.code,
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

  const handleEnrollFree = async (video: MasterclassVideo) => {
    if (!user?.uid) return toast.error("Please login to enroll");
    if (userHasVideoAccess(video)) return toast("Already enrolled!", { icon: "ℹ️" });

    try {
      const classRef = doc(db, "MasterClasses", masterclassId);
      await updateDoc(classRef, {
        joined_users: arrayUnion(user.uid),
      });

      await addTransactionRecord(user.uid, {
        orderId: "free_video_" + Date.now(),
        masterclassId: masterclassId,
        videoId: video.id,
        masterclassTitle: masterclass!.title,
        videoTitle: video.title,
        amount: 0,
        status: "success",
        method: "dummy",
        type: "purchase",
        timestamp: new Date().toISOString(),
      });

      toast.success("Enrolled successfully!");
      
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
      const userRef = doc(db, "user_profiles", user.uid);
      await updateDoc(userRef, {
        purchasedVideos: arrayUnion(purchasingVideo.id),
      });

      toast.success("Purchase successful!");
      setShowPaymentModal(false);
      setPurchasingVideo(null);

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

  const isUpcomingNotStarted = isUpcoming && masterclass.scheduled_date && 
    new Date(masterclass.scheduled_date) > new Date();

  const videoId = selectedVideo ? getYouTubeVideoId(selectedVideo.youtube_url) : null;
  const canWatchSelected = selectedVideo && (selectedVideo.type === "free" || userHasVideoAccess(selectedVideo));

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/masterclasses"
          className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white font-medium transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Masterclasses
        </Link>

        {isUpcomingNotStarted && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Upcoming Event
                </h3>
                <p className="text-blue-800 dark:text-blue-200 text-sm mb-3">
                  This masterclass is scheduled for{" "}
                  <strong>{new Date(masterclass.scheduled_date!).toLocaleString()}</strong>
                </p>
                
                {!userHasAccess && (
                  <div className="flex gap-3">
                    {masterclass.starting_price === 0 ? (
                      <button
                        onClick={handleFreeUpcomingRegistration}
                        disabled={processing}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                      >
                        {processing ? "Processing..." : "Register for Free"}
                      </button>
                    ) : (
                      <button
                        onClick={handlePaidUpcomingRegistration}
                        disabled={processing}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50 flex items-center gap-2"
                      >
                        <IndianRupee className="w-4 h-4" />
                        {processing ? "Processing..." : `Register for ₹${masterclass.starting_price}`}
                      </button>
                    )}
                  </div>
                )}
                
                {userHasAccess && (
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">You're registered! We'll send you the join link.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="relative aspect-video bg-gray-900">
                {isUpcomingNotStarted ? (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <Calendar className="w-16 h-16 text-blue-500 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">
                      Event Not Started Yet
                    </h3>
                    <p className="text-gray-400 mb-4">
                      This masterclass will be available on{" "}
                      {new Date(masterclass.scheduled_date!).toLocaleDateString()}
                    </p>
                    {!userHasAccess && (
                      <p className="text-gray-500 text-sm">
                        Register now to get notified when it starts!
                      </p>
                    )}
                  </div>
                ) : selectedVideo && canWatchSelected && videoId ? (
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

              {selectedVideo && !isUpcomingNotStarted && (
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
                    <p className="text-sm text-gray-500">
                      {isUpcoming ? "Scheduled For" : "Published"}
                    </p>
                    <p className="font-semibold">
                      {isUpcoming && masterclass.scheduled_date
                        ? new Date(masterclass.scheduled_date).toLocaleDateString()
                        : formatMasterclassDate(masterclass.created_at)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">
                      {isUpcoming ? "Registered" : "Students Enrolled"}
                    </p>
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

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="text-xl font-bold mb-4">Course Content</h3>
              
              {isUpcomingNotStarted && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  Content will be available when the event starts
                </p>
              )}
              
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {masterclass.videos.map((video, index) => {
                  const hasAccess = video.type === "free" || userHasVideoAccess(video);
                  const isSelected = selectedVideo?.id === video.id;
                  
                  return (
                    <button
                      key={video.id}
                      onClick={() => !isUpcomingNotStarted && setSelectedVideo(video)}
                      disabled={!!isUpcomingNotStarted}
                      className={`w-full text-left p-4 rounded-lg transition ${
                        isSelected
                          ? "bg-indigo-100 dark:bg-indigo-900 border-2 border-indigo-500"
                          : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                      } ${isUpcomingNotStarted ? "opacity-50 cursor-not-allowed" : ""}`}
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
          videoId={purchasingVideo.id}
        />
      )}
    </div>
  );
}