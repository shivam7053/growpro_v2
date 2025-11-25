// //component masterclassCard.tsx

// "use client";

// import React, { useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Play,
//   User,
//   Briefcase,
//   Calendar,
//   Users,
//   IndianRupee,
//   Tag,
//   AlertCircle,
//   CheckCircle,
//   Clock,
//   Video,
//   ChevronRight,
// } from "lucide-react";
// import { doc, updateDoc, arrayUnion } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import toast from "react-hot-toast";
// import { Masterclass } from "@/types/masterclass";
// import { formatMasterclassDate } from "@/utils/masterclass";
// import { addTransactionRecord } from "@/utils/userUtils";
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
//   const router = useRouter();
//   const [imageError, setImageError] = useState(false);
//   const [processing, setProcessing] = useState(false);
//   const [openPaymentModal, setOpenPaymentModal] = useState(false);

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

//   const userJoined = user?.uid && mc.joined_users?.includes(user.uid);
//   const isUpcoming = mc.type === "upcoming";
//   const isFreeUpcoming = isUpcoming && mc.starting_price === 0;

//   // ---------------------------------------------------
//   // FREE UPCOMING REGISTRATION
//   // ---------------------------------------------------
//   const handleFreeUpcomingRegistration = async () => {
//     if (!user?.uid) return toast.error("Please login to register");
//     if (userJoined) return toast("Already registered!", { icon: "ℹ️" });

//     setProcessing(true);
//     try {
//       await updateDoc(doc(db, "MasterClasses", mc.id), {
//         joined_users: arrayUnion(user.uid),
//       });

//       await addTransactionRecord(user.uid, {
//         orderId: "upcoming_register_" + Date.now(),
//         masterclassId: mc.id,
//         masterclassTitle: mc.title,
//         amount: 0,
//         status: "success",
//         method: "free",
//         timestamp: new Date().toISOString(),
//       });

//       toast.success("Registered successfully!");
//       onPurchaseComplete?.();
//     } catch (err) {
//       console.error("Registration error:", err);
//       toast.error("Error processing registration");
//     } finally {
//       setProcessing(false);
//     }
//   };

//   // ---------------------------------------------------
//   // PAID UPCOMING → OPEN PAYMENT MODAL
//   // ---------------------------------------------------
//   const handlePaidUpcomingRegistration = () => {
//     if (!user?.uid) return toast.error("Please login to register");
//     if (userJoined) return toast("Already registered!", { icon: "ℹ️" });

//     setOpenPaymentModal(true);
//   };

//   const handleViewDetails = () => router.push(`/masterclasses/${mc.id}`);

//   const getTypeBadgeColor = () => {
//     if (isUpcoming) return "bg-blue-500 text-white";
//     if (mc.type === "featured") return "bg-yellow-500 text-black";
//     return "bg-indigo-600 text-white";
//   };

//   return (
//     <>
//       {/* PAYMENT MODAL */}
//       {openPaymentModal && (
//         <PaymentModal
//           isOpen={openPaymentModal}
//           onClose={() => setOpenPaymentModal(false)}
//           masterclass={mc}
//           user={user}
//           purchaseType="upcoming_registration"
//           amount={mc.starting_price}
//           onPurchaseSuccess={() => {
//             setOpenPaymentModal(false);
//             onPurchaseComplete?.();
//           }}
//         />
//       )}

//       {/* CARD */}
//       <div
//         className="bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden flex flex-col h-full border border-gray-200 dark:border-gray-700 group"
//         onClick={handleViewDetails}
//       >
//         {/* Thumbnail */}
//         <div className="relative aspect-video bg-gray-200 dark:bg-gray-800 overflow-hidden">
//           {!imageError && mc.thumbnail_url ? (
//             <img
//               src={mc.thumbnail_url}
//               alt={mc.title}
//               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
//               onError={() => setImageError(true)}
//             />
//           ) : (
//             <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-500 to-purple-600">
//               <Play className="w-16 h-16 text-white opacity-60" />
//             </div>
//           )}

//           {/* Hover Overlay */}
//           <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition flex items-center justify-center">
//             <div className="opacity-0 group-hover:opacity-100 transition">
//               <div className="bg-white dark:bg-gray-900 rounded-full p-4">
//                 <ChevronRight className="w-8 h-8 text-gray-900 dark:text-white" />
//               </div>
//             </div>
//           </div>

//           {/* Left Badges */}
//           <div className="absolute top-3 left-3 flex gap-2 z-30">
//             {userJoined && (
//               <div className="bg-green-600 text-white px-3 py-1 text-sm rounded-full font-medium shadow flex items-center gap-1">
//                 <CheckCircle className="w-4 h-4" />
//                 {isUpcoming ? "Registered" : "Enrolled"}
//               </div>
//             )}

//             {mc.type && (
//               <div
//                 className={`px-3 py-1 text-sm rounded-full flex items-center gap-1 font-semibold shadow ${getTypeBadgeColor()}`}
//               >
//                 <Tag className="w-4 h-4" /> {mc.type}
//               </div>
//             )}
//           </div>

//           {/* Price Badge */}
//           <div className="absolute top-3 right-3 z-30">
//             {isUpcoming ? (
//               isFreeUpcoming ? (
//                 <div className="bg-green-600 text-white px-4 py-1 rounded-full font-semibold shadow inline-block">
//                   FREE REGISTRATION
//                 </div>
//               ) : (
//                 <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full font-semibold shadow flex items-center gap-1">
//                   <IndianRupee className="w-4 h-4" />
//                   {mc.starting_price}
//                 </div>
//               )
//             ) : (
//               <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full font-semibold shadow flex items-center gap-1">
//                 <IndianRupee className="w-4 h-4" />
//                 {mc.starting_price}+
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Card Content */}
//         <div className="p-5 flex flex-col flex-1">
//           <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
//             {mc.title}
//           </h3>

//           <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300 mb-3">
//             <div className="flex items-center gap-2">
//               <User className="w-4 h-4" />
//               {mc.speaker_name}
//             </div>
//             <div className="flex items-center gap-2">
//               <Briefcase className="w-4 h-4" />
//               {mc.speaker_designation}
//             </div>

//             {isUpcoming && mc.scheduled_date ? (
//               <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
//                 <Calendar className="w-4 h-4" />
//                 {new Date(mc.scheduled_date).toLocaleDateString()}
//               </div>
//             ) : mc.created_at ? (
//               <div className="flex items-center gap-2 text-gray-500">
//                 <Calendar className="w-4 h-4" />
//                 {formatMasterclassDate(mc.created_at)}
//               </div>
//             ) : null}
//           </div>

//           {/* Action Button */}
//           <div className="mt-auto">
//             {isUpcoming ? (
//               userJoined ? (
//                 <button disabled className="w-full bg-green-600 text-white px-5 py-3 rounded-lg font-semibold opacity-80">
//                   <CheckCircle className="w-5 h-5 inline-block" /> Registered
//                 </button>
//               ) : isFreeUpcoming ? (
//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     handleFreeUpcomingRegistration();
//                   }}
//                   disabled={processing}
//                   className="w-full bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold"
//                 >
//                   {processing ? "Processing..." : "Register for Free"}
//                 </button>
//               ) : (
//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     handlePaidUpcomingRegistration();
//                   }}
//                   disabled={processing}
//                   className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-3 rounded-lg font-semibold"
//                 >
//                   Register for ₹{mc.starting_price}
//                 </button>
//               )
//             ) : (
//               <button
//                 onClick={handleViewDetails}
//                 className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg font-semibold"
//               >
//                 View Details <ChevronRight className="w-5 h-5 inline-block" />
//               </button>
//             )}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }


//component/masterclassCard
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  User,
  Briefcase,
  Calendar,
  IndianRupee,
  Tag,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Video,
  VideoIcon,
} from "lucide-react";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { Masterclass } from "@/types/masterclass";
import { formatMasterclassDate } from "@/utils/masterclass";
import { addTransactionRecord } from "@/utils/userUtils";
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
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);

  // ⭐ Default source = YouTube if missing
  const source = mc.masterclass_source || "youtube";

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
  const isFreeUpcoming = isUpcoming && mc.starting_price === 0;

  // ---------------------------------------------------
  // FREE UPCOMING REGISTRATION
  // ---------------------------------------------------
  const handleFreeUpcomingRegistration = async () => {
    if (!user?.uid) return toast.error("Please login to register");
    if (userJoined) return toast("Already registered!", { icon: "ℹ️" });

    setProcessing(true);
    try {
      await updateDoc(doc(db, "MasterClasses", mc.id), {
        joined_users: arrayUnion(user.uid),
      });

      await addTransactionRecord(user.uid, {
        orderId: "upcoming_register_" + Date.now(),
        masterclassId: mc.id,
        masterclassTitle: mc.title,
        amount: 0,
        status: "success",
        method: "free",
        timestamp: new Date().toISOString(),
      });

      toast.success("Registered successfully!");
      onPurchaseComplete?.();
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("Error processing registration");
    } finally {
      setProcessing(false);
    }
  };

  // ---------------------------------------------------
  // PAID UPCOMING → OPEN PAYMENT MODAL
  // ---------------------------------------------------
  const handlePaidUpcomingRegistration = () => {
    if (!user?.uid) return toast.error("Please login to register");
    if (userJoined) return toast("Already registered!", { icon: "ℹ️" });
    setOpenPaymentModal(true);
  };

  const handleViewDetails = () => router.push(`/masterclasses/${mc.id}`);

  const getTypeBadgeColor = () => {
    if (isUpcoming) return "bg-blue-500 text-white";
    if (mc.type === "featured") return "bg-yellow-500 text-black";
    return "bg-indigo-600 text-white";
  };

  return (
    <>
      {/* PAYMENT MODAL */}
      {openPaymentModal && (
        <PaymentModal
          isOpen={openPaymentModal}
          onClose={() => setOpenPaymentModal(false)}
          masterclass={mc}
          user={user}
          purchaseType="upcoming_registration"
          amount={mc.starting_price}
          onPurchaseSuccess={() => {
            setOpenPaymentModal(false);
            onPurchaseComplete?.();
          }}
        />
      )}

      {/* CARD */}
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden flex flex-col h-full border border-gray-200 dark:border-gray-700 group"
        onClick={handleViewDetails}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gray-200 dark:bg-gray-800 overflow-hidden">
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
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-30">
            {/* Joined Badge */}
            {userJoined && (
              <div className="bg-green-600 text-white px-3 py-1 text-sm rounded-full font-medium shadow flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {isUpcoming ? "Registered" : "Enrolled"}
              </div>
            )}

            {/* Type Badge */}
            {mc.type && (
              <div
                className={`px-3 py-1 text-sm rounded-full flex items-center gap-1 font-semibold shadow ${getTypeBadgeColor()}`}
              >
                <Tag className="w-4 h-4" /> {mc.type}
              </div>
            )}

            {/* ⭐ NEW: Source Badge */}
            <div
              className={`px-3 py-1 text-sm rounded-full flex items-center gap-1 font-semibold shadow ${
                source === "zoom"
                  ? "bg-purple-600 text-white"
                  : "bg-red-600 text-white"
              }`}
            >
              {source === "zoom" ? (
                <>
                  <Video className="w-4 h-4" /> Zoom Session
                </>
              ) : (
                <>
                  <VideoIcon className="w-4 h-4" /> YouTube Class
                </>
              )}
            </div>
          </div>

          {/* Price Badge */}
          <div className="absolute top-3 right-3 z-30">
            {isUpcoming ? (
              isFreeUpcoming ? (
                <div className="bg-green-600 text-white px-4 py-1 rounded-full font-semibold shadow inline-block">
                  FREE REGISTRATION
                </div>
              ) : (
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full font-semibold shadow flex items-center gap-1">
                  <IndianRupee className="w-4 h-4" />
                  {mc.starting_price}
                </div>
              )
            ) : (
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full font-semibold shadow flex items-center gap-1">
                <IndianRupee className="w-4 h-4" />
                {mc.starting_price}+
              </div>
            )}
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

            {isUpcoming && mc.scheduled_date ? (
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
                <Calendar className="w-4 h-4" />
                {new Date(mc.scheduled_date).toLocaleDateString()}
              </div>
            ) : mc.created_at ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Calendar className="w-4 h-4" />
                {formatMasterclassDate(mc.created_at)}
              </div>
            ) : null}
          </div>

          {/* Action Button */}
          <div className="mt-auto">
            {isUpcoming ? (
              userJoined ? (
                <button disabled className="w-full bg-green-600 text-white px-5 py-3 rounded-lg font-semibold opacity-80">
                  <CheckCircle className="w-5 h-5 inline-block" /> Registered
                </button>
              ) : isFreeUpcoming ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFreeUpcomingRegistration();
                  }}
                  disabled={processing}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold"
                >
                  {processing ? "Processing..." : "Register for Free"}
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePaidUpcomingRegistration();
                  }}
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-3 rounded-lg font-semibold"
                >
                  Register for ₹{mc.starting_price}
                </button>
              )
            ) : (
              <button
                onClick={handleViewDetails}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg font-semibold"
              >
                View Details <ChevronRight className="w-5 h-5 inline-block" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
