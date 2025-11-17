// // components/masterclassCard
// "use client";

// import React, { useState } from "react";
// import {
//   Play,
//   User,
//   Briefcase,
//   Calendar,
//   Lock,
//   Users,
//   IndianRupee,
//   Tag,
//   AlertCircle,
//   CheckCircle,
//   Clock,
// } from "lucide-react";
// import { doc, updateDoc, arrayUnion } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import toast from "react-hot-toast";
// import { Masterclass } from "@/types/masterclass";
// import { getYouTubeVideoId, formatMasterclassDate } from "@/utils/masterclass";
// import { addPurchasedClass, addTransactionRecord } from "@/utils/userUtils";
// import PaymentModal from "@/components/PaymentModal";

// interface MasterclassCardProps {
//   masterclass: Masterclass;
//   user: any;
//   onPurchaseComplete?: () => void;
// }

// export default function MasterclassCard({
//   masterclass: mc,
//   user,
//   onPurchaseComplete,
// }: MasterclassCardProps) {
//   const [imageError, setImageError] = useState(false);
//   const [showPaymentModal, setShowPaymentModal] = useState(false);

//   if (!mc?.id) {
//     return (
//       <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center h-full border border-gray-200 dark:border-gray-700">
//         <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
//         <p className="text-gray-600 dark:text-gray-300 text-center">
//           Invalid masterclass data
//         </p>
//       </div>
//     );
//   }

//   const videoId = getYouTubeVideoId(mc.youtube_url);
//   const userJoined = user?.uid && mc.joined_users?.includes(user.uid);
//   const isFree = mc.price === 0 || mc.type === "free";
//   const isUpcoming = mc.type === "upcoming";

//   // ✅ UPCOMING REGISTRATION
//   const handleUpcomingRegistration = async () => {
//     if (!user?.uid) return toast.error("Please login to register");
//     if (userJoined) return toast("Already registered!", { icon: "ℹ️" });

//     try {
//       // 1️⃣ Add user to MasterClass
//       const classRef = doc(db, "MasterClasses", mc.id);
//       await updateDoc(classRef, {
//         joined_users: arrayUnion(user.uid),
//       });

//       // 2️⃣ Add registration record
//       await addTransactionRecord(user.uid, {
//         orderId: "upcoming_register_" + Date.now(),
//         masterclassId: mc.id,
//         masterclassTitle: mc.title,
//         amount: 0,
//         status: "success",
//         method: "dummy",
//         timestamp: new Date().toISOString(),
//       });

//       toast.success("Registered successfully! We'll notify you when it goes live.");
//       onPurchaseComplete?.();
//     } catch (err) {
//       console.error("Registration error:", err);
//       toast.error("Error processing registration");
//     }
//   };

//   // ✅ FREE ENROLLMENT
//   const handleEnrollFree = async () => {
//     if (!user?.uid) return toast.error("Please login to enroll");
//     if (userJoined) return toast("Already enrolled!", { icon: "ℹ️" });

//     try {
//       // 1️⃣ Add user to MasterClass
//       const classRef = doc(db, "MasterClasses", mc.id);
//       await updateDoc(classRef, {
//         joined_users: arrayUnion(user.uid),
//       });

//       // 2️⃣ Add class to user's profile
//       await addPurchasedClass(user.uid, mc.title, user.email, user.displayName);

//       // 3️⃣ Add transaction record
//       await addTransactionRecord(user.uid, {
//         orderId: "free_enroll_" + Date.now(),
//         masterclassId: mc.id,
//         masterclassTitle: mc.title,
//         amount: 0,
//         status: "success",
//         method: "dummy",
//         timestamp: new Date().toISOString(),
//       });

//       toast.success("Enrolled successfully!");
//       onPurchaseComplete?.();
//     } catch (err) {
//       console.error("Enrollment error:", err);
//       toast.error("Error processing enrollment");
//     }
//   };

//   // ✅ PAID ENROLLMENT
//   const handleEnrollPaid = () => {
//     if (!user?.uid) return toast.error("Please login to enroll");
//     if (userJoined) return toast("Already enrolled!", { icon: "ℹ️" });
//     setShowPaymentModal(true);
//   };

//   // ✅ PAYMENT SUCCESS CALLBACK
//   const handlePaymentSuccess = async (paymentResponse?: any) => {
//     if (!user?.uid) return;

//     try {
//       // 1️⃣ Add user to MasterClass
//       const classRef = doc(db, "MasterClasses", mc.id);
//       await updateDoc(classRef, {
//         joined_users: arrayUnion(user.uid),
//       });

//       // 2️⃣ Add purchased class
//       await addPurchasedClass(user.uid, mc.title, user.email, user.displayName);

//       // 3️⃣ Record transaction
//       await addTransactionRecord(user.uid, {
//         orderId: paymentResponse?.orderId || "dummy_order_" + Date.now(),
//         paymentId: paymentResponse?.paymentId || "dummy_payment_" + Date.now(),
//         masterclassId: mc.id,
//         masterclassTitle: mc.title,
//         amount: mc.price,
//         status: "success",
//         method: "razorpay",
//         timestamp: new Date().toISOString(),
//       });

//       toast.success("Enrollment successful!");
//       setShowPaymentModal(false);
//       onPurchaseComplete?.();
//     } catch (err) {
//       console.error("Payment success handling error:", err);
//       toast.error("Error updating enrollment");
//     }
//   };

//   // ✅ GET TYPE BADGE COLOR
//   const getTypeBadgeColor = () => {
//     if (isUpcoming) return "bg-blue-500 text-white";
//     if (mc.type === "featured") return "bg-yellow-500 text-black";
//     if (isFree) return "bg-green-500 text-white";
//     return "bg-indigo-600 text-white";
//   };

//   return (
//     <>
//       <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden flex flex-col h-full border border-gray-200 dark:border-gray-700">
//         {/* 🎬 Thumbnail / Video */}
//         <div className="relative aspect-video bg-gray-200 dark:bg-gray-800 overflow-hidden">
//           {userJoined && !isUpcoming ? (
//             videoId ? (
//               <iframe
//                 src={`https://www.youtube.com/embed/${videoId}`}
//                 title={mc.title}
//                 className="w-full h-full"
//                 allowFullScreen
//                 loading="lazy"
//               />
//             ) : (
//               <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
//                 <Play className="w-10 h-10 mb-1" />
//                 <p>Video not available</p>
//               </div>
//             )
//           ) : isFree && !isUpcoming ? (
//             videoId ? (
//               <iframe
//                 src={`https://www.youtube.com/embed/${videoId}`}
//                 title={mc.title}
//                 className="w-full h-full"
//                 allowFullScreen
//                 loading="lazy"
//               />
//             ) : (
//               <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
//                 <Play className="w-10 h-10 mb-1" />
//                 <p>Video not available</p>
//               </div>
//             )
//           ) : (
//             <>
//               {!imageError ? (
//                 <img
//                   src={
//                     mc.thumbnail_url ||
//                     (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : "")
//                   }
//                   alt={mc.title}
//                   className="w-full h-full object-cover brightness-75"
//                   onError={() => setImageError(true)}
//                 />
//               ) : (
//                 <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-500 to-purple-600">
//                   <Play className="w-16 h-16 text-white opacity-60" />
//                 </div>
//               )}
//               {!isUpcoming && (
//                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
//                   <Lock className="w-10 h-10 text-white mb-2" />
//                   <p className="text-white font-semibold">Locked</p>
//                 </div>
//               )}
//             </>
//           )}

//           {/* 🏷️ Badges */}
//           <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
//             {userJoined && (
//               <div className="bg-green-600 text-white px-3 py-1 text-sm rounded-full font-medium shadow flex items-center gap-1">
//                 <CheckCircle className="w-4 h-4" />
//                 {isUpcoming ? "Registered" : "Enrolled"}
//               </div>
//             )}
//             {mc.type && (
//               <div className={`px-3 py-1 text-sm rounded-full flex items-center gap-1 font-semibold shadow ${getTypeBadgeColor()}`}>
//                 <Tag className="w-4 h-4" /> {mc.type}
//               </div>
//             )}
//           </div>

//           {/* 💸 Price Badge */}
//           <div className="absolute top-3 right-3">
//             {isFree || isUpcoming ? (
//               <div className={`${isUpcoming ? "bg-blue-500" : "bg-green-500"} text-white px-4 py-1 rounded-full font-bold shadow`}>
//                 FREE
//               </div>
//             ) : (
//               <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full font-semibold shadow flex items-center gap-1">
//                 <IndianRupee className="w-4 h-4" />
//                 {mc.price}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* 🧠 Content */}
//         <div className="p-5 flex flex-col flex-1">
//           <h3
//             className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2"
//             title={mc.title}
//           >
//             {mc.title}
//           </h3>

//           <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300 mb-3">
//             <div className="flex items-center gap-2">
//               <User className="w-4 h-4" /> {mc.speaker_name}
//             </div>
//             <div className="flex items-center gap-2">
//               <Briefcase className="w-4 h-4" /> {mc.speaker_designation}
//             </div>
            
//             {/* Show scheduled date for upcoming, created date for others */}
//             {isUpcoming && mc.scheduled_date ? (
//               <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
//                 <Calendar className="w-4 h-4" />
//                 {new Date(mc.scheduled_date).toLocaleDateString()}
//               </div>
//             ) : mc.created_at ? (
//               <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
//                 <Calendar className="w-4 h-4" />
//                 {formatMasterclassDate(mc.created_at)}
//               </div>
//             ) : null}

//             {mc.duration && (
//               <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
//                 <Clock className="w-4 h-4" /> {mc.duration}
//               </div>
//             )}

//             <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
//               <Users className="w-4 h-4" /> {mc.joined_users?.length || 0} {isUpcoming ? "registered" : "enrolled"}
//             </div>
//           </div>

//           {/* Description */}
//           {mc.description && (
//             <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
//               {mc.description}
//             </p>
//           )}

//           {/* 🎯 Action Button */}
//           <div className="mt-auto">
//             {isUpcoming ? (
//               userJoined ? (
//                 <button
//                   disabled
//                   className="w-full inline-flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-3 rounded-lg font-semibold cursor-not-allowed opacity-80"
//                 >
//                   <CheckCircle className="w-5 h-5" /> Registered
//                 </button>
//               ) : (
//                 <button
//                   onClick={handleUpcomingRegistration}
//                   className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold transition"
//                 >
//                   <Calendar className="w-5 h-5" /> Register for Free
//                 </button>
//               )
//             ) : userJoined ? (
//               mc.youtube_url ? (
//                 <a
//                   href={mc.youtube_url}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="w-full inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-semibold transition"
//                 >
//                   <Play className="w-5 h-5" /> Watch Now
//                 </a>
//               ) : (
//                 <button
//                   disabled
//                   className="w-full bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-5 py-3 rounded-lg font-semibold cursor-not-allowed"
//                 >
//                   Video Not Available
//                 </button>
//               )
//             ) : isFree ? (
//               <button
//                 onClick={handleEnrollFree}
//                 className="w-full inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-semibold transition"
//               >
//                 <Play className="w-5 h-5" /> Enroll Free
//               </button>
//             ) : (
//               <button
//                 onClick={handleEnrollPaid}
//                 className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold transition"
//               >
//                 <IndianRupee className="w-5 h-5" /> Enroll Now - ₹{mc.price}
//               </button>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* 💳 Payment Modal */}
//       <PaymentModal
//         isOpen={showPaymentModal}
//         onClose={() => setShowPaymentModal(false)}
//         masterclass={mc}
//         user={user}
//         onPaymentSuccess={handlePaymentSuccess}
//       />
//     </>
//   );
// }


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

  // ---------------------------------------------------
  // UPCOMING REGISTRATION
  // ---------------------------------------------------
  const handleUpcomingRegistration = async () => {
    if (!user?.uid) return toast.error("Please login to register");
    if (userJoined) return toast("Already registered!", { icon: "ℹ️" });

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

      toast.success("Registered successfully!");
      onPurchaseComplete?.();
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("Error processing registration");
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
        {/*
          CORRECTION 1: Removed 'pr-16' from the thumbnail container.
          This was likely causing the thumbnail to be cut off or squished.
        */}

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
          {/*
            CORRECTION 2: Removed 'flex-wrap' from Left Badges container
            to keep them on a single line and avoid potential overlap with the right badge.
          */}

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

        {/* Right Badge (FREE REGISTRATION) */}
        <div className="absolute top-3 right-3 z-30">
          {/*
            CORRECTION 3: Changed z-index from 'z-[20]' to 'z-30'
            to ensure it's on the same layer as the Left Badges and avoid overlap issues.
          */}
          {isUpcoming ? (
            <div className="bg-blue-600 text-white px-4 py-1 rounded-full font-semibold shadow">
              FREE REGISTRATION
            </div>
          ) : mc.starting_price === 0 ? (
            <div className="bg-green-600 text-white px-4 py-1 rounded-full font-semibold shadow">
              FREE
            </div>
          ) : (
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full font-semibold shadow flex items-center gap-1">
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
            ) : (
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleUpcomingRegistration();
                }}
                className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold transition"
              >
                <Calendar className="w-5 h-5" /> Register for Free
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