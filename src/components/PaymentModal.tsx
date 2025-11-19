// components/PaymentModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { X, CreditCard, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { PaymentService } from "@/services/paymentService";
import { Masterclass, MasterclassVideo, TransactionType } from "@/types/masterclass";
import toast from "react-hot-toast";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterclass: Masterclass;
  video?: MasterclassVideo; // ✅ Optional: for individual video purchase
  user: any;
  onPaymentSuccess: (paymentData?: any) => void;
  videoId?: string; // ✅ Alternative way to pass video ID
}

export default function PaymentModal({
  isOpen,
  onClose,
  masterclass,
  video, // ✅ Individual video being purchased
  user,
  onPaymentSuccess,
  videoId: propVideoId, // ✅ Support both ways of passing video ID
}: PaymentModalProps) {
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"dummy" | "razorpay">("dummy");
  const [error, setError] = useState<string>("");

  // ✅ Determine what's being purchased
  const videoIdToUse = video?.id || propVideoId;
  const isVideoPurchase = !!videoIdToUse;
  const isUpcomingRegistration = masterclass.type === "upcoming";
  
  // ✅ Get purchase details
  const purchaseTitle = isVideoPurchase 
    ? `${masterclass.title} - ${video?.title || 'Video'}`
    : masterclass.title;
  
  const purchaseAmount = isVideoPurchase 
    ? (video?.price || 0)
    : masterclass.starting_price;

  // ✅ Determine transaction type
  const getTransactionType = () => {
    if (isUpcomingRegistration && purchaseAmount === 0) return "free_registration";
    if (isUpcomingRegistration && purchaseAmount > 0) return "upcoming_registration";
    if (isVideoPurchase) return "video_purchase";
    return "purchase";
  };

  const transactionType = getTransactionType();

  useEffect(() => {
    if (isOpen) {
      setProcessing(false);
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePayment = async () => {
    if (!user?.uid) {
      toast.error("Please login to continue");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const paymentDetails: PaymentDetails = {
        amount: purchaseAmount,
        currency: "INR",
        masterclassId: masterclass.id,
        videoId: videoIdToUse, // ✅ Include video ID if purchasing individual video
        userId: user.uid,
        email: user.email,
        phone: user.phone,
        type: transactionType as TransactionType, // ✅ Add transaction type
      };

      // ✅ DUMMY PAYMENT: Handle completely with backend verification
      if (paymentMethod === "dummy") {
        const dummyOrderId = `dummy_order_${Date.now()}`;
        const dummyPaymentId = `dummy_pay_${Date.now()}`;
        
        try {
          const verified = await PaymentService.verifyPayment({
            razorpay_order_id: dummyOrderId,
            razorpay_payment_id: dummyPaymentId,
            razorpay_signature: "dummy_signature",
            masterclassId: masterclass.id,
            videoId: videoIdToUse, // ✅ Pass video ID for individual purchase
            userId: user.uid,
            masterclassTitle: masterclass.title,
            videoTitle: video?.title, // ✅ Pass video title
            amount: purchaseAmount,
            method: "dummy",
            type: transactionType, // ✅ Pass transaction type
          });
          
          if (verified) {
            const paymentData = {
              orderId: dummyOrderId,
              paymentId: dummyPaymentId,
              masterclassId: masterclass.id,
              videoId: videoIdToUse,
              amount: purchaseAmount,
              method: "dummy",
              type: transactionType,
              timestamp: new Date().toISOString(),
            };
            
            // ✅ Different success messages based on type
            if (isUpcomingRegistration) {
              toast.success("Registered successfully! Check your email.");
            } else if (isVideoPurchase) {
              toast.success("Video purchased successfully!");
            } else {
              toast.success("Payment successful!");
            }
            
            onPaymentSuccess(paymentData);
            setTimeout(onClose, 600);
          } else {
            setError("Payment verification failed");
            toast.error("Payment failed");
          }
        } catch (error: any) {
          console.error("❌ Dummy payment error:", error);
          setError(error.message || "Dummy payment failed");
          toast.error("Payment failed");
        }
        
        setProcessing(false);
        return;
      }

      // 🔵 RAZORPAY PAYMENT: Use full flow with backend
      let razorpayOrderId: string | null = null;

      await PaymentService.processRazorpayPayment(
        paymentDetails,
        purchaseTitle, // ✅ Use dynamic title
        async (response) => {
          try {
            const verified = await PaymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              masterclassId: masterclass.id,
              videoId: videoIdToUse, // ✅ Pass video ID
              userId: user.uid,
              masterclassTitle: masterclass.title,
              videoTitle: video?.title, // ✅ Pass video title
              amount: purchaseAmount,
              type: transactionType, // ✅ Pass transaction type
            });

            if (verified) {
              const paymentData = {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                masterclassId: masterclass.id,
                videoId: videoIdToUse,
                amount: purchaseAmount,
                method: "razorpay",
                type: transactionType,
                timestamp: new Date().toISOString(),
              };
              
              // ✅ Different success messages based on type
              if (isUpcomingRegistration) {
                toast.success("Registered successfully! Check your email.");
              } else if (isVideoPurchase) {
                toast.success("Video purchased successfully!");
              } else {
                toast.success("Payment successful!");
              }
              
              onPaymentSuccess(paymentData);
              setTimeout(onClose, 600);
            } else {
              setError("Payment verification failed");
              toast.error("Payment verification failed");
            }
          } catch (verifyError: any) {
            console.error("❌ Verification error:", verifyError);
            setError(verifyError.message || "Payment verification failed");
            toast.error("Payment verification failed");
          } finally {
            setProcessing(false);
          }
        },
        async (error, orderId) => {
          console.error("❌ Razorpay payment error:", error);
          const errorMessage = error?.error || error?.message || "Payment failed or cancelled";
          setError(errorMessage);
          toast.error(errorMessage);
          
          if (orderId) {
            try {
              await PaymentService.markTransactionAsFailed(
                user.uid,
                orderId,
                errorMessage
              );
              console.log("✅ Transaction marked as failed");
            } catch (markError) {
              console.error("❌ Failed to mark transaction as failed:", markError);
            }
          }
          
          setProcessing(false);
        },
        (orderId) => {
          razorpayOrderId = orderId;
        }
      );

      setTimeout(() => setProcessing(false), 8000);
    } catch (error: any) {
      console.error("❌ Payment error:", error);
      setError(error.message || "Payment failed. Please try again.");
      toast.error(error.message || "Payment failed. Please try again.");
      setProcessing(false);
    }
  };

  const handleClose = () => {
    if (processing) setProcessing(false);
    setError("");
    onClose();
  };

  // ✅ Get appropriate labels based on purchase type
  const getHeaderText = () => {
    if (isUpcomingRegistration) return "Complete Registration";
    if (isVideoPurchase) return "Purchase Video";
    return "Complete Your Purchase";
  };

  const getPurchaseTypeLabel = () => {
    if (isUpcomingRegistration && purchaseAmount === 0) return "Free Registration";
    if (isUpcomingRegistration) return "Paid Registration";
    if (isVideoPurchase) return "Individual Video";
    return "Full Masterclass";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative">
          <button
            onClick={handleClose}
            disabled={processing}
            className="absolute top-4 right-4 hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold mb-2">{getHeaderText()}</h2>
          <p className="text-blue-100 text-sm">
            {isUpcomingRegistration 
              ? "Secure your spot for this upcoming event"
              : "Secure payment powered by Razorpay"
            }
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Purchase Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="mb-2">
              <span className="inline-block bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs font-semibold px-2 py-1 rounded mb-2">
                {getPurchaseTypeLabel()}
              </span>
              <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                {isVideoPurchase ? video?.title : masterclass.title}
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {isVideoPurchase 
                ? `Part of: ${masterclass.title}`
                : `By ${masterclass.speaker_name}`
              }
            </p>
            {isVideoPurchase && video?.duration && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Duration: {video.duration}
              </p>
            )}
            {isUpcomingRegistration && masterclass.scheduled_date && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                📅 Scheduled: {new Date(masterclass.scheduled_date).toLocaleString()}
              </p>
            )}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">
                {purchaseAmount === 0 ? "Registration" : "Total Amount"}
              </span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {purchaseAmount === 0 ? "FREE" : `₹${purchaseAmount}`}
              </span>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900 dark:bg-opacity-20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                  Payment Error
                </p>
                <p className="text-xs text-red-700 dark:text-red-400 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError("")}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Payment Method - Only show if amount > 0 */}
          {purchaseAmount > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Select Payment Method
              </label>
              <div className="space-y-2">
                {["dummy", "razorpay"].map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method as "dummy" | "razorpay")}
                    disabled={processing}
                    className={`w-full p-4 rounded-lg border-2 transition flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${
                      paymentMethod === method
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {method === "dummy" ? (
                      <CreditCard className="w-5 h-5" />
                    ) : (
                      <Shield className="w-5 h-5" />
                    )}
                    <div className="text-left flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {method === "dummy" ? "Dummy Payment (Test Mode)" : "Razorpay (Live Mode)"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {method === "dummy"
                          ? "For testing purposes only"
                          : "UPI, Cards, Netbanking & more"}
                      </div>
                    </div>
                    {paymentMethod === method && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Security Info */}
          <div className="flex items-start gap-3 bg-green-50 dark:bg-green-900 dark:bg-opacity-20 p-4 rounded-lg">
            <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-800 dark:text-green-300">
              <p className="font-semibold mb-1">
                {purchaseAmount === 0 ? "Secure Registration" : "Secure Payment"}
              </p>
              <p className="text-xs">
                {purchaseAmount === 0 
                  ? "Your information is safe and you'll receive email confirmation."
                  : "Your payment information is encrypted and secure."
                }
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={processing}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={processing}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  {purchaseAmount === 0 
                    ? "Complete Registration" 
                    : isUpcomingRegistration 
                    ? `Register for ₹${purchaseAmount}`
                    : `Pay ₹${purchaseAmount}`
                  }
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}