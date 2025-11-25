// //app/masterclasses/[id]/route
// "use client";

// import React, { useState, useEffect } from "react";
// import { useParams, useRouter } from "next/navigation";
// import Link from "next/link";
// import {
//   ArrowLeft,
//   Play,
//   Lock,
//   User,
//   Briefcase,
//   Calendar,
//   Clock,
//   Users,
//   IndianRupee,
//   CheckCircle,
//   ShoppingCart,
//   AlertCircle,
// } from "lucide-react";
// import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { useAuth } from "@/context/AuthContexts";
// import toast from "react-hot-toast";
// import { Masterclass, MasterclassVideo } from "@/types/masterclass";
// import { formatMasterclassDate, getYouTubeVideoId } from "@/utils/masterclass";
// import { addTransactionRecord } from "@/utils/userUtils";
// import PaymentModal from "@/components/PaymentModal";

// export default function MasterclassDetailPage() {
//   const params = useParams();
//   const router = useRouter();
//   const { user } = useAuth();

//   const [masterclass, setMasterclass] = useState<Masterclass | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [selectedVideo, setSelectedVideo] = useState<MasterclassVideo | null>(null);
//   const [showPaymentModal, setShowPaymentModal] = useState(false);
//   const [purchasingVideo, setPurchasingVideo] = useState<MasterclassVideo | null>(null);
//   const [userPurchasedVideos, setUserPurchasedVideos] = useState<string[]>([]);
//   const [processing, setProcessing] = useState(false);
//   const [paymentModalType, setPaymentModalType] = useState<"video" | "upcoming">("video");

//   // Updated for Netlify - use SITE_URL or window.location.origin
//   const BASE_URL =
//     typeof window !== "undefined"
//       ? window.location.origin
//       : process.env.SITE_URL || process.env.URL || "";

//   const masterclassId = params.id as string;

//   // Fetch user's purchased videos
//   useEffect(() => {
//     const fetchUserPurchasedVideos = async () => {
//       if (!user?.uid) {
//         setUserPurchasedVideos([]);
//         return;
//       }

//       try {
//         const userDocRef = doc(db, "user_profiles", user.uid);
//         const userDocSnap = await getDoc(userDocRef);

//         if (userDocSnap.exists()) {
//           const userData = userDocSnap.data();
//           setUserPurchasedVideos(userData.purchasedVideos || []);
//         }
//       } catch (error) {
//         console.error("Error fetching user purchased videos:", error);
//       }
//     };

//     fetchUserPurchasedVideos();
//   }, [user?.uid]);

//   // Fetch masterclass details
//   useEffect(() => {
//     const fetchMasterclass = async () => {
//       if (!masterclassId) return;

//       try {
//         setLoading(true);
//         const docRef = doc(db, "MasterClasses", masterclassId);
//         const docSnap = await getDoc(docRef);

//         if (!docSnap.exists()) {
//           toast.error("Masterclass not found");
//           router.push("/masterclasses");
//           return;
//         }

//         const data = docSnap.data();

//         // Build Masterclass object while preserving new fields (masterclass_source, zoom_*)
//         const mc: Masterclass = {
//           id: docSnap.id,
//           title: data.title || "",
//           speaker_name: data.speaker_name || "",
//           speaker_designation: data.speaker_designation || "",
//           thumbnail_url: data.thumbnail_url || "",
//           description: data.description || "",
//           type: data.type || "free",
//           masterclass_source: data.masterclass_source || "youtube", // fallback to youtube if missing
//           zoom_link: data.zoom_link || undefined,
//           zoom_meeting_id: data.zoom_meeting_id || undefined,
//           zoom_passcode: data.zoom_passcode || undefined,
//           zoom_start_time: data.zoom_start_time || undefined,
//           zoom_end_time: data.zoom_end_time || undefined,
//           scheduled_date: data.scheduled_date || "",
//           created_at: data.created_at
//             ? new Date(data.created_at.seconds * 1000).toISOString()
//             : new Date().toISOString(),
//           videos: data.videos || [],
//           joined_users: data.joined_users || [],
//           starting_price: data.starting_price || 0,
//           total_duration: data.total_duration || "",
//         };

//         setMasterclass(mc);

//         // Auto-select first accessible video only for YouTube masterclasses
//         if ((mc.masterclass_source || "youtube") === "youtube" && mc.videos.length > 0) {
//           const userHasFullAccess = user?.uid && mc.joined_users?.includes(user.uid);

//           const firstAccessible = mc.videos.find(
//             (v) =>
//               v.type === "free" ||
//               userHasFullAccess ||
//               (user?.uid && userPurchasedVideos.includes(v.id))
//           );

//           setSelectedVideo(firstAccessible || mc.videos[0]);
//         } else {
//           // for zoom-based masterclass we don't auto-select a youtube video
//           setSelectedVideo(null);
//         }
//       } catch (error) {
//         console.error("Error fetching masterclass:", error);
//         toast.error("Error loading masterclass");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchMasterclass();
//   }, [masterclassId, router, user?.uid, userPurchasedVideos]);

//   const userHasAccess = user?.uid && masterclass?.joined_users?.includes(user.uid);
//   const isUpcoming = masterclass?.type === "upcoming";

//   const userHasVideoAccess = (video: MasterclassVideo) => {
//     if (!user?.uid) return video.type === "free";
//     if (userHasAccess) return true;
//     if (video.type === "free") return true;
//     return userPurchasedVideos.includes(video.id);
//   };

//   // Refresh masterclass data after purchase
//   const refreshMasterclassData = async () => {
//     if (!masterclassId) return;

//     try {
//       const docRef = doc(db, "MasterClasses", masterclassId);
//       const docSnap = await getDoc(docRef);

//       if (docSnap.exists()) {
//         const data = docSnap.data();
//         setMasterclass((prev) =>
//           prev
//             ? {
//                 ...prev,
//                 joined_users: data.joined_users || [],
//                 // also refresh zoom fields and source if changed
//                 masterclass_source: data.masterclass_source || prev.masterclass_source,
//                 zoom_link: data.zoom_link || prev.zoom_link,
//                 zoom_meeting_id: data.zoom_meeting_id || prev.zoom_meeting_id,
//                 zoom_passcode: data.zoom_passcode || prev.zoom_passcode,
//                 zoom_start_time: data.zoom_start_time || prev.zoom_start_time,
//                 zoom_end_time: data.zoom_end_time || prev.zoom_end_time,
//               }
//             : null
//         );
//       }

//       // Refresh user purchased videos
//       if (user?.uid) {
//         const userDocRef = doc(db, "user_profiles", user.uid);
//         const userDocSnap = await getDoc(userDocRef);
//         if (userDocSnap.exists()) {
//           const userData = userDocSnap.data();
//           setUserPurchasedVideos(userData.purchasedVideos || []);
//         }
//       }
//     } catch (error) {
//       console.error("Error refreshing data:", error);
//     }
//   };

//   // Handle free registration for upcoming
//   const handleFreeUpcomingRegistration = async () => {
//     if (!user?.uid) return toast.error("Please login to register");
//     if (userHasAccess) return toast("Already registered!", { icon: "ℹ️" });

//     setProcessing(true);
//     try {
//       const classRef = doc(db, "MasterClasses", masterclassId);
//       await updateDoc(classRef, {
//         joined_users: arrayUnion(user.uid),
//       });

//       await addTransactionRecord(user.uid, {
//         orderId: "free_upcoming_" + Date.now(),
//         masterclassId: masterclassId,
//         masterclassTitle: masterclass!.title,
//         amount: 0,
//         status: "success",
//         method: "free",
//         type: "free_registration",
//         timestamp: new Date().toISOString(),
//       });

//       // Send registration confirmation email - Updated endpoint
//       try {
//         await fetch(`/.netlify/functions/send-registration-email`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             email: user.email,
//             userName: user.displayName || user.email?.split("@")[0],
//             masterclassTitle: masterclass!.title,
//             speakerName: masterclass!.speaker_name,
//             scheduledDate: masterclass!.scheduled_date,
//             masterclassId: masterclassId,
//           }),
//         });
//         console.log("✅ Registration email sent");
//       } catch (emailError) {
//         console.error("❌ Email error:", emailError);
//         // Don't fail registration if email fails
//       }

//       toast.success("Registered successfully! Check your email.");
//       await refreshMasterclassData();
//     } catch (err) {
//       console.error("Registration error:", err);
//       toast.error("Error processing registration");
//     } finally {
//       setProcessing(false);
//     }
//   };

//   // Handle paid registration - opens payment modal
//   const handlePaidUpcomingRegistration = () => {
//     if (!user?.uid) return toast.error("Please login to register");
//     if (userHasAccess) return toast("Already registered!", { icon: "ℹ️" });

//     setPaymentModalType("upcoming");
//     setShowPaymentModal(true);
//   };

//   const handleEnrollFree = async (video: MasterclassVideo) => {
//     if (!user?.uid) return toast.error("Please login to enroll");
//     if (userHasVideoAccess(video)) return toast("Already enrolled!", { icon: "ℹ️" });

//     try {
//       const classRef = doc(db, "MasterClasses", masterclassId);
//       await updateDoc(classRef, {
//         joined_users: arrayUnion(user.uid),
//       });

//       await addTransactionRecord(user.uid, {
//         orderId: "free_video_" + Date.now(),
//         masterclassId: masterclassId,
//         videoId: video.id,
//         masterclassTitle: masterclass!.title,
//         videoTitle: video.title,
//         amount: 0,
//         status: "success",
//         method: "free",
//         type: "purchase",
//         timestamp: new Date().toISOString(),
//       });

//       // Send purchase confirmation email - Updated endpoint
//       try {
//         await fetch(`/.netlify/functions/send-purchase-confirmation`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             email: user.email,
//             userName: user.displayName || user.email?.split("@")[0],
//             masterclassTitle: masterclass!.title,
//             videoTitle: video.title,
//             amount: 0,
//             orderId: "free_video_" + Date.now(),
//             masterclassId: masterclassId,
//             videoId: video.id,
//             purchaseType: "video",
//           }),
//         });
//         console.log("✅ Purchase confirmation email sent");
//       } catch (emailError) {
//         console.error("❌ Email error:", emailError);
//       }

//       toast.success("Enrolled successfully! Check your email.");
//       await refreshMasterclassData();
//     } catch (err) {
//       console.error("Enrollment error:", err);
//       toast.error("Error processing enrollment");
//     }
//   };

//   const handleEnrollPaid = (video: MasterclassVideo) => {
//     if (!user?.uid) return toast.error("Please login to enroll");
//     if (userHasVideoAccess(video)) return toast("Already enrolled!", { icon: "ℹ️" });

//     setPurchasingVideo(video);
//     setPaymentModalType("video");
//     setShowPaymentModal(true);
//   };

//   const handlePaymentSuccess = async () => {
//     toast.success("Purchase successful! Check your email for confirmation.");
//     setShowPaymentModal(false);
//     setPurchasingVideo(null);
//     await refreshMasterclassData();
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
//           <p className="text-gray-600 dark:text-gray-400">Loading masterclass...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!masterclass) {
//     return (
//       <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
//         <div className="text-center">
//           <p className="text-gray-600 dark:text-gray-400 mb-4">Masterclass not found</p>
//           <Link href="/masterclasses" className="text-indigo-600 hover:underline">
//             Back to Masterclasses
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   const isUpcomingNotStarted =
//     isUpcoming && masterclass.scheduled_date && new Date(masterclass.scheduled_date) > new Date();

//   // Determine source with fallback to "youtube"
//   const source = masterclass.masterclass_source || "youtube";

//   // Only compute youtube video id when source is youtube and selectedVideo present
//   const videoId =
//     source === "youtube" && selectedVideo ? getYouTubeVideoId(selectedVideo.youtube_url) : null;

//   const canWatchSelected =
//     source === "youtube" &&
//     selectedVideo &&
//     (selectedVideo.type === "free" || userHasVideoAccess(selectedVideo));

//   // RENDER helpers for Zoom
//   const renderZoomPanel = () => {
//     const startTime = masterclass.zoom_start_time || masterclass.scheduled_date || undefined;
//     const hasZoomLink = !!masterclass.zoom_link;
//     const meetingId = masterclass.zoom_meeting_id;
//     const passcode = masterclass.zoom_passcode;

//     const isSessionStarted = startTime ? new Date(startTime) <= new Date() : true;

//     return (
//       <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
//         <div className="p-6">
//           <h2 className="text-2xl font-bold mb-2">Live Zoom Session</h2>
//           <p className="text-sm text-gray-500 mb-4">
//             {masterclass.description || "Join the live Zoom session at the scheduled time."}
//           </p>

//           <div className="grid gap-3">
//             {meetingId && (
//               <div className="text-sm">
//                 <span className="font-semibold">Meeting ID:</span> {meetingId}
//               </div>
//             )}
//             {passcode && (
//               <div className="text-sm">
//                 <span className="font-semibold">Passcode:</span> {passcode}
//               </div>
//             )}
//             {startTime && (
//               <div className="text-sm">
//                 <span className="font-semibold">Start:</span>{" "}
//                 {new Date(startTime).toLocaleString()}
//               </div>
//             )}
//           </div>

//           <div className="mt-6">
//             {userHasAccess ? (
//               isSessionStarted ? (
//                 hasZoomLink ? (
//                   <a
//                     href={masterclass.zoom_link}
//                     target="_blank"
//                     rel="noreferrer"
//                     className="inline-flex items-center justify-center w-full py-3 bg-black text-white rounded-lg font-semibold"
//                   >
//                     Join Zoom Session
//                   </a>
//                 ) : (
//                   <div className="text-sm text-yellow-600">Zoom link not available yet.</div>
//                 )
//               ) : (
//                 <div className="text-sm text-yellow-600">Session hasn't started yet.</div>
//               )
//             ) : (
//               // Not enrolled
//               <div>
//                 {masterclass.starting_price === 0 ? (
//                   <button
//                     onClick={handleFreeUpcomingRegistration}
//                     disabled={processing}
//                     className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold"
//                   >
//                     {processing ? "Processing..." : "Register (Free)"}
//                   </button>
//                 ) : (
//                   <button
//                     onClick={handlePaidUpcomingRegistration}
//                     disabled={processing}
//                     className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold"
//                   >
//                     {processing ? "Processing..." : `Buy Access ₹${masterclass.starting_price}`}
//                   </button>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <Link
//           href="/masterclasses"
//           className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white font-medium transition mb-6"
//         >
//           <ArrowLeft className="w-5 h-5" />
//           Back to Masterclasses
//         </Link>

//         {isUpcomingNotStarted && (
//           <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-6">
//             <div className="flex items-start gap-3">
//               <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
//               <div>
//                 <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Upcoming Event</h3>
//                 <p className="text-blue-800 dark:text-blue-200 text-sm mb-3">
//                   This masterclass is scheduled for{" "}
//                   <strong>{new Date(masterclass.scheduled_date!).toLocaleString()}</strong>
//                 </p>

//                 {!userHasAccess && (
//                   <div className="flex gap-3">
//                     {masterclass.starting_price === 0 ? (
//                       <button
//                         onClick={handleFreeUpcomingRegistration}
//                         disabled={processing}
//                         className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50"
//                       >
//                         {processing ? "Processing..." : "Register for Free"}
//                       </button>
//                     ) : (
//                       <button
//                         onClick={handlePaidUpcomingRegistration}
//                         disabled={processing}
//                         className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50 flex items-center gap-2"
//                       >
//                         <IndianRupee className="w-4 h-4" />
//                         {processing ? "Processing..." : `Register for ₹${masterclass.starting_price}`}
//                       </button>
//                     )}
//                   </div>
//                 )}

//                 {userHasAccess && (
//                   <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
//                     <CheckCircle className="w-5 h-5" />
//                     <span className="font-semibold">You're registered! We'll send you reminder emails.</span>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         )}

//         <div className="grid lg:grid-cols-3 gap-8">
//           <div className="lg:col-span-2">
//             {/* Player / Zoom panel */}
//             {source === "zoom" ? (
//               renderZoomPanel()
//             ) : (
//               <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
//                 <div className="relative aspect-video bg-gray-900">
//                   {isUpcomingNotStarted ? (
//                     <div className="flex flex-col items-center justify-center h-full p-8 text-center">
//                       <Calendar className="w-16 h-16 text-blue-500 mb-4" />
//                       <h3 className="text-xl font-bold text-white mb-2">Event Not Started Yet</h3>
//                       <p className="text-gray-400 mb-4">
//                         This masterclass will be available on{" "}
//                         {new Date(masterclass.scheduled_date!).toLocaleDateString()}
//                       </p>
//                       {!userHasAccess && <p className="text-gray-500 text-sm">Register now to get notified when it starts!</p>}
//                     </div>
//                   ) : selectedVideo && canWatchSelected && videoId ? (
//                     <iframe
//                       src={`https://www.youtube.com/embed/${videoId}`}
//                       title={selectedVideo.title}
//                       className="w-full h-full"
//                       allowFullScreen
//                     />
//                   ) : (
//                     <div className="flex flex-col items-center justify-center h-full">
//                       <Lock className="w-16 h-16 text-gray-500 mb-4" />
//                       <p className="text-gray-400 text-lg">
//                         {selectedVideo?.type === "paid" ? "Purchase to unlock" : "Select a video"}
//                       </p>
//                     </div>
//                   )}
//                 </div>

//                 {selectedVideo && !isUpcomingNotStarted && (
//                   <div className="p-6">
//                     <h2 className="text-2xl font-bold mb-2">{selectedVideo.title}</h2>
//                     {selectedVideo.description && (
//                       <p className="text-gray-600 dark:text-gray-400 mb-4">{selectedVideo.description}</p>
//                     )}

//                     <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
//                       {selectedVideo.duration && (
//                         <div className="flex items-center gap-1">
//                           <Clock className="w-4 h-4" />
//                           {selectedVideo.duration}
//                         </div>
//                       )}
//                       <div className="flex items-center gap-1">
//                         {selectedVideo.type === "free" ? (
//                           <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">FREE</span>
//                         ) : (
//                           <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
//                             <IndianRupee className="w-3 h-3" />
//                             {selectedVideo.price}
//                           </span>
//                         )}
//                       </div>
//                     </div>

//                     {selectedVideo && !canWatchSelected && (
//                       <div className="mt-4">
//                         {selectedVideo.type === "free" ? (
//                           <button
//                             onClick={() => handleEnrollFree(selectedVideo)}
//                             className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
//                           >
//                             <Play className="w-5 h-5" />
//                             Watch Free
//                           </button>
//                         ) : (
//                           <button
//                             onClick={() => handleEnrollPaid(selectedVideo)}
//                             className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
//                           >
//                             <ShoppingCart className="w-5 h-5" />
//                             Purchase for ₹{selectedVideo.price}
//                           </button>
//                         )}
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* Details block (title, instructor, about) */}
//             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-6">
//               <h1 className="text-3xl font-bold mb-4">{masterclass.title}</h1>

//               <div className="grid md:grid-cols-2 gap-4 mb-6">
//                 <div className="flex items-center gap-2">
//                   <User className="w-5 h-5 text-gray-500" />
//                   <div>
//                     <p className="text-sm text-gray-500">Instructor</p>
//                     <p className="font-semibold">{masterclass.speaker_name}</p>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <Briefcase className="w-5 h-5 text-gray-500" />
//                   <div>
//                     <p className="text-sm text-gray-500">Designation</p>
//                     <p className="font-semibold">{masterclass.speaker_designation}</p>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <Calendar className="w-5 h-5 text-gray-500" />
//                   <div>
//                     <p className="text-sm text-gray-500">{isUpcoming ? "Scheduled For" : "Published"}</p>
//                     <p className="font-semibold">
//                       {isUpcoming && masterclass.scheduled_date
//                         ? new Date(masterclass.scheduled_date).toLocaleDateString()
//                         : formatMasterclassDate(masterclass.created_at)}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <Users className="w-5 h-5 text-gray-500" />
//                   <div>
//                     <p className="text-sm text-gray-500">{isUpcoming ? "Registered" : "Students Enrolled"}</p>
//                     <p className="font-semibold">{masterclass.joined_users?.length || 0}</p>
//                   </div>
//                 </div>
//               </div>

//               {masterclass.description && (
//                 <div>
//                   <h3 className="font-semibold text-lg mb-2">About this Masterclass</h3>
//                   <p className="text-gray-600 dark:text-gray-400">{masterclass.description}</p>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Sidebar: course content */}
//           <div className="lg:col-span-1">
//             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-8">
//               <h3 className="text-xl font-bold mb-4">Course Content</h3>

//               {isUpcomingNotStarted && (
//                 <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
//                   Content will be available when the event starts
//                 </p>
//               )}

//               <div className="space-y-2 max-h-[600px] overflow-y-auto">
//                 {source === "zoom" ? (
//                   // Show Zoom session summary in the sidebar (still keep videos listed beneath if present)
//                   <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
//                     <p className="font-semibold mb-1">Live Zoom Session</p>
//                     {masterclass.zoom_start_time && (
//                       <div className="text-xs text-gray-500 mb-1">Starts: {new Date(masterclass.zoom_start_time).toLocaleString()}</div>
//                     )}
//                     {masterclass.zoom_meeting_id && (
//                       <div className="text-xs text-gray-500">Meeting ID: {masterclass.zoom_meeting_id}</div>
//                     )}
//                     {masterclass.zoom_passcode && (
//                       <div className="text-xs text-gray-500">Passcode: {masterclass.zoom_passcode}</div>
//                     )}
//                     <div className="mt-2">
//                       {userHasAccess ? (
//                         <a href={masterclass.zoom_link} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline">
//                           Join Zoom
//                         </a>
//                       ) : (
//                         <span className="text-sm text-gray-500">Register to get join link</span>
//                       )}
//                     </div>
//                   </div>
//                 ) : null}

//                 {/* For YouTube masterclasses show video list (for Zoom we still show videos below if present) */}
//                 {masterclass.videos.map((video, index) => {
//                   const hasAccess = video.type === "free" || userHasVideoAccess(video);
//                   const isSelected = selectedVideo?.id === video.id;

//                   // For zoom source, clicking videos should still select them (if they exist in videos array)
//                   return (
//                     <button
//                       key={video.id}
//                       onClick={() => !isUpcomingNotStarted && setSelectedVideo(video)}
//                       disabled={!!isUpcomingNotStarted}
//                       className={`w-full text-left p-4 rounded-lg transition ${
//                         isSelected
//                           ? "bg-indigo-100 dark:bg-indigo-900 border-2 border-indigo-500"
//                           : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
//                       } ${isUpcomingNotStarted ? "opacity-50 cursor-not-allowed" : ""}`}
//                     >
//                       <div className="flex items-start gap-3">
//                         <div className="flex-shrink-0 mt-1">
//                           {hasAccess ? <Play className="w-5 h-5 text-green-600" /> : <Lock className="w-5 h-5 text-gray-400" />}
//                         </div>

//                         <div className="flex-1 min-w-0">
//                           <p className="font-semibold text-sm mb-1 line-clamp-2">
//                             {index + 1}. {video.title}
//                           </p>

//                           <div className="flex items-center gap-2 text-xs">
//                             {video.duration && <span className="text-gray-500">{video.duration}</span>}
//                             {video.type === "free" ? (
//                               <span className="bg-green-500 text-white px-2 py-0.5 rounded-full font-semibold">FREE</span>
//                             ) : (
//                               <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
//                                 <IndianRupee className="w-3 h-3" />
//                                 {video.price}
//                               </span>
//                             )}
//                             {hasAccess && <CheckCircle className="w-4 h-4 text-green-600" />}
//                           </div>
//                         </div>
//                       </div>
//                     </button>
//                   );
//                 })}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* PAYMENT MODAL */}
//       {showPaymentModal && masterclass && (
//         <PaymentModal
//           isOpen={showPaymentModal}
//           onClose={() => {
//             setShowPaymentModal(false);
//             setPurchasingVideo(null);
//           }}
//           masterclass={masterclass}
//           video={paymentModalType === "video" ? purchasingVideo || undefined : undefined}
//           user={user}
//           purchaseType={paymentModalType === "upcoming" ? "upcoming_registration" : "video"}
//           amount={paymentModalType === "upcoming" ? masterclass.starting_price : purchasingVideo?.price}
//           onPurchaseSuccess={handlePaymentSuccess}
//         />
//       )}
//     </div>
//   );
// }


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
  const [paymentModalType, setPaymentModalType] = useState<"video" | "upcoming">("video");

  // Updated for Netlify - use SITE_URL or window.location.origin
  const BASE_URL =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.SITE_URL || process.env.URL || "";

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

        // Build Masterclass object while preserving new fields (masterclass_source, zoom_*)
        const mc: Masterclass = {
          id: docSnap.id,
          title: data.title || "",
          speaker_name: data.speaker_name || "",
          speaker_designation: data.speaker_designation || "",
          thumbnail_url: data.thumbnail_url || "",
          description: data.description || "",
          type: data.type || "free",
          masterclass_source: data.masterclass_source || "youtube", // fallback to youtube if missing
          zoom_link: data.zoom_link || undefined,
          zoom_meeting_id: data.zoom_meeting_id || undefined,
          zoom_passcode: data.zoom_passcode || undefined,
          zoom_start_time: data.zoom_start_time || undefined,
          zoom_end_time: data.zoom_end_time || undefined,
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

        // Auto-select first accessible video only for YouTube masterclasses
        if ((mc.masterclass_source || "youtube") === "youtube" && mc.videos.length > 0) {
          const userHasFullAccess = user?.uid && mc.joined_users?.includes(user.uid);

          const firstAccessible = mc.videos.find(
            (v) =>
              v.type === "free" ||
              userHasFullAccess ||
              (user?.uid && userPurchasedVideos.includes(v.id))
          );

          setSelectedVideo(firstAccessible || mc.videos[0]);
        } else {
          // for zoom-based masterclass we don't auto-select a youtube video
          setSelectedVideo(null);
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

  // Refresh masterclass data after purchase
  const refreshMasterclassData = async () => {
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
                joined_users: data.joined_users || [],
                // also refresh zoom fields and source if changed
                masterclass_source: data.masterclass_source || prev.masterclass_source,
                zoom_link: data.zoom_link || prev.zoom_link,
                zoom_meeting_id: data.zoom_meeting_id || prev.zoom_meeting_id,
                zoom_passcode: data.zoom_passcode || prev.zoom_passcode,
                zoom_start_time: data.zoom_start_time || prev.zoom_start_time,
                zoom_end_time: data.zoom_end_time || prev.zoom_end_time,
              }
            : null
        );
      }

      // Refresh user purchased videos
      if (user?.uid) {
        const userDocRef = doc(db, "user_profiles", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUserPurchasedVideos(userData.purchasedVideos || []);
        }
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
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
        method: "free",
        type: "free_registration",
        timestamp: new Date().toISOString(),
      });

      // Send registration confirmation email - Updated endpoint
      try {
        await fetch(`/.netlify/functions/send-registration-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            userName: user.displayName || user.email?.split("@")[0],
            masterclassTitle: masterclass!.title,
            speakerName: masterclass!.speaker_name,
            scheduledDate: masterclass!.scheduled_date,
            masterclassId: masterclassId,
          }),
        });
        console.log("✅ Registration email sent");
      } catch (emailError) {
        console.error("❌ Email error:", emailError);
        // Don't fail registration if email fails
      }

      toast.success("Registered successfully! Check your email.");
      await refreshMasterclassData();
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("Error processing registration");
    } finally {
      setProcessing(false);
    }
  };

  // Handle paid registration - opens payment modal
  const handlePaidUpcomingRegistration = () => {
    if (!user?.uid) return toast.error("Please login to register");
    if (userHasAccess) return toast("Already registered!", { icon: "ℹ️" });

    setPaymentModalType("upcoming");
    setShowPaymentModal(true);
  };

  const handleEnrollFree = async (video: MasterclassVideo) => {
    if (!user?.uid) return toast.error("Please login to enroll");
    if (userHasVideoAccess(video)) return toast("Already enrolled!", { icon: "ℹ️" });

    setProcessing(true);
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
        method: "free",
        type: "purchase",
        timestamp: new Date().toISOString(),
      });

      // Send purchase confirmation email - Updated endpoint
      try {
        await fetch(`/.netlify/functions/send-purchase-confirmation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            userName: user.displayName || user.email?.split("@")[0],
            masterclassTitle: masterclass!.title,
            videoTitle: video.title,
            amount: 0,
            orderId: "free_video_" + Date.now(),
            masterclassId: masterclassId,
            videoId: video.id,
            purchaseType: "video",
          }),
        });
        console.log("✅ Purchase confirmation email sent");
      } catch (emailError) {
        console.error("❌ Email error:", emailError);
      }

      toast.success("Enrolled successfully! Check your email.");
      await refreshMasterclassData();
    } catch (err) {
      console.error("Enrollment error:", err);
      toast.error("Error processing enrollment");
    } finally {
      setProcessing(false);
    }
  };

  const handleEnrollPaid = (video: MasterclassVideo) => {
    if (!user?.uid) return toast.error("Please login to enroll");
    if (userHasVideoAccess(video)) return toast("Already enrolled!", { icon: "ℹ️" });

    setPurchasingVideo(video);
    setPaymentModalType("video");
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    toast.success("Purchase successful! Check your email for confirmation.");
    setShowPaymentModal(false);
    setPurchasingVideo(null);
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

  const isUpcomingNotStarted =
    isUpcoming && masterclass.scheduled_date && new Date(masterclass.scheduled_date) > new Date();

  // Determine source with fallback to "youtube"
  const source = masterclass.masterclass_source || "youtube";

  // Only compute youtube video id when source is youtube and selectedVideo present
  const videoId =
    source === "youtube" && selectedVideo ? getYouTubeVideoId(selectedVideo.youtube_url) : null;

  const canWatchSelected =
    source === "youtube" &&
    selectedVideo &&
    (selectedVideo.type === "free" || userHasVideoAccess(selectedVideo));

  // RENDER helpers for Zoom
  const renderZoomPanel = () => {
    // Required zoom fields for a valid zoom session
    const requiredZoomPresent = !!(masterclass.zoom_link && masterclass.zoom_start_time);

    // If required Zoom fields are missing -> show error block (Option 2)
    if (!requiredZoomPresent) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-8 h-8 text-yellow-500" />
            <div>
              <h3 className="text-lg font-semibold">Zoom details unavailable</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                The organizer hasn't provided complete Zoom details for this session yet.
                Please check back later or contact the organizer for access information.
              </p>
              <div className="mt-4">
                <Link href="/masterclasses" className="text-indigo-600 hover:underline text-sm">
                  Back to masterclasses
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const startTime = masterclass.zoom_start_time || masterclass.scheduled_date || undefined;
    const hasZoomLink = !!masterclass.zoom_link;
    const meetingId = masterclass.zoom_meeting_id;
    const passcode = masterclass.zoom_passcode;

    const isSessionStarted = startTime ? new Date(startTime) <= new Date() : true;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-2">Live Zoom Session</h2>
          <p className="text-sm text-gray-500 mb-4">
            {masterclass.description || "Join the live Zoom session at the scheduled time."}
          </p>

          <div className="grid gap-3">
            {meetingId && (
              <div className="text-sm">
                <span className="font-semibold">Meeting ID:</span> {meetingId}
              </div>
            )}
            {passcode && (
              <div className="text-sm">
                <span className="font-semibold">Passcode:</span> {passcode}
              </div>
            )}
            {startTime && (
              <div className="text-sm">
                <span className="font-semibold">Start:</span>{" "}
                {new Date(startTime).toLocaleString()}
              </div>
            )}
          </div>

          <div className="mt-6">
            {userHasAccess ? (
              isSessionStarted ? (
                hasZoomLink ? (
                  <a
                    href={masterclass.zoom_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center w-full py-3 bg-black text-white rounded-lg font-semibold"
                  >
                    Join Zoom Session
                  </a>
                ) : (
                  <div className="text-sm text-yellow-600">Zoom link not available yet.</div>
                )
              ) : (
                <div className="text-sm text-yellow-600">Session hasn't started yet.</div>
              )
            ) : (
              // Not enrolled → show registration / purchase options (free or paid)
              <div>
                {masterclass.starting_price === 0 ? (
                  <button
                    onClick={handleFreeUpcomingRegistration}
                    disabled={processing}
                    className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold"
                  >
                    {processing ? "Processing..." : "Register (Free)"}
                  </button>
                ) : (
                  <button
                    onClick={handlePaidUpcomingRegistration}
                    disabled={processing}
                    className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold"
                  >
                    {processing ? "Processing..." : `Buy Access ₹${masterclass.starting_price}`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Upcoming Event</h3>
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
                    <span className="font-semibold">You're registered! We'll send you reminder emails.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Player / Zoom panel */}
            {source === "zoom" ? (
              renderZoomPanel()
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="relative aspect-video bg-gray-900">
                  {isUpcomingNotStarted ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                      <Calendar className="w-16 h-16 text-blue-500 mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">Event Not Started Yet</h3>
                      <p className="text-gray-400 mb-4">
                        This masterclass will be available on{" "}
                        {new Date(masterclass.scheduled_date!).toLocaleDateString()}
                      </p>
                      {!userHasAccess && <p className="text-gray-500 text-sm">Register now to get notified when it starts!</p>}
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
                          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">FREE</span>
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
                    <p className="text-sm text-gray-500">{isUpcoming ? "Scheduled For" : "Published"}</p>
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
                    <p className="text-sm text-gray-500">{isUpcoming ? "Registered" : "Students Enrolled"}</p>
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

          {/* Sidebar: course content */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="text-xl font-bold mb-4">Course Content</h3>

              {isUpcomingNotStarted && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  Content will be available when the event starts
                </p>
              )}

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {source === "zoom" ? (
                  // Show Zoom session summary in the sidebar (still keep videos listed beneath if present)
                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <p className="font-semibold mb-1">Live Zoom Session</p>
                    {masterclass.zoom_start_time && (
                      <div className="text-xs text-gray-500 mb-1">Starts: {new Date(masterclass.zoom_start_time).toLocaleString()}</div>
                    )}
                    {masterclass.zoom_meeting_id && (
                      <div className="text-xs text-gray-500">Meeting ID: {masterclass.zoom_meeting_id}</div>
                    )}
                    {masterclass.zoom_passcode && (
                      <div className="text-xs text-gray-500">Passcode: {masterclass.zoom_passcode}</div>
                    )}
                    <div className="mt-2">
                      {userHasAccess ? (
                        <a href={masterclass.zoom_link} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline">
                          Join Zoom
                        </a>
                      ) : (
                        <span className="text-sm text-gray-500">Register to get join link</span>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* For YouTube masterclasses show video list (for Zoom we still show videos below if present) */}
                {masterclass.videos.map((video, index) => {
                  const hasAccess = video.type === "free" || userHasVideoAccess(video);
                  const isSelected = selectedVideo?.id === video.id;

                  // For zoom source, clicking videos should still select them (if they exist in videos array)
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
                          {hasAccess ? <Play className="w-5 h-5 text-green-600" /> : <Lock className="w-5 h-5 text-gray-400" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm mb-1 line-clamp-2">
                            {index + 1}. {video.title}
                          </p>

                          <div className="flex items-center gap-2 text-xs">
                            {video.duration && <span className="text-gray-500">{video.duration}</span>}
                            {video.type === "free" ? (
                              <span className="bg-green-500 text-white px-2 py-0.5 rounded-full font-semibold">FREE</span>
                            ) : (
                              <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
                                <IndianRupee className="w-3 h-3" />
                                {video.price}
                              </span>
                            )}
                            {hasAccess && <CheckCircle className="w-4 h-4 text-green-600" />}
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

      {/* PAYMENT MODAL */}
      {showPaymentModal && masterclass && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setPurchasingVideo(null);
          }}
          masterclass={masterclass}
          video={paymentModalType === "video" ? purchasingVideo || undefined : undefined}
          user={user}
          purchaseType={paymentModalType === "upcoming" ? "upcoming_registration" : "video"}
          amount={paymentModalType === "upcoming" ? masterclass.starting_price : purchasingVideo?.price}
          onPurchaseSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

