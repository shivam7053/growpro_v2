// components/PaymentModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { X, CreditCard, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { PaymentService } from "@/services/paymentService";
import {
  Masterclass,
  MasterclassVideo,
  TransactionType,
  PaymentDetails,
} from "@/types/masterclass";
import toast from "react-hot-toast";
import { loadRazorpay } from "@/utils/loadRazorpay";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterclass: Masterclass;
  video?: MasterclassVideo;
  user: any;
  onPaymentSuccess?: (paymentData?: any) => void;
  onPurchaseSuccess?: () => void; // Alternative callback name
  videoId?: string | null;
  purchaseType?: "video" | "upcoming_registration" | "masterclass";
  amount?: number;
}

export default function PaymentModal({
  isOpen,
  onClose,
  masterclass,
  video,
  user,
  onPaymentSuccess,
  onPurchaseSuccess,
  videoId: propVideoId,
  purchaseType: propPurchaseType,
  amount: propAmount,
}: PaymentModalProps) {
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"dummy" | "razorpay" | null>(null);
  const [error, setError] = useState("");
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const videoIdToUse = video?.id || propVideoId || null;
  const isVideoPurchase = !!videoIdToUse;
  const isUpcoming = masterclass.type === "upcoming";

  // Determine purchase amount
  const purchaseAmount = propAmount !== undefined
    ? propAmount
    : isVideoPurchase
      ? video?.price || 0
      : masterclass.starting_price || 0;

  // Determine transaction type
  const getTransactionType = (): TransactionType => {
    if (propPurchaseType === "upcoming_registration") return "upcoming_registration";
    if (propPurchaseType === "video") return "video_purchase";
    if (propPurchaseType === "masterclass") return "purchase";
    
    if (isUpcoming && !isVideoPurchase && purchaseAmount === 0) return "free_registration";
    if (isUpcoming && !isVideoPurchase && purchaseAmount > 0) return "upcoming_registration";
    if (isVideoPurchase) return "video_purchase";
    return "purchase";
  };

  const transactionType = getTransactionType();

  const purchaseTitle = isVideoPurchase
    ? `${masterclass.title} - ${video?.title || "Video"}`
    : masterclass.title;

  // Load Razorpay script
  useEffect(() => {
    if (isOpen && purchaseAmount > 0) {
      loadRazorpay().then((loaded) => setRazorpayLoaded(!!loaded));
    }
  }, [isOpen, purchaseAmount]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setProcessing(false);
      setError("");
      setPaymentMethod(purchaseAmount === 0 ? "dummy" : null);
    }
  }, [isOpen, purchaseAmount]);

  if (!isOpen) return null;

  // Unified callback handler
  const handleSuccessCallback = (paymentData: any) => {
    if (typeof onPaymentSuccess === "function") {
      onPaymentSuccess(paymentData);
    }
    if (typeof onPurchaseSuccess === "function") {
      onPurchaseSuccess();
    }
  };

  // MAIN PAYMENT HANDLER
  const handlePayment = async () => {
    if (!user?.uid) {
      toast.error("Please login to continue");
      return;
    }

    if (purchaseAmount > 0 && !paymentMethod) {
      setError("Please select a payment method");
      toast.error("Please select a payment method");
      return;
    }

    setProcessing(true);
    setError("");

    const paymentDetails: PaymentDetails = {
      amount: purchaseAmount,
      currency: "INR",
      masterclassId: masterclass.id,
      videoId: videoIdToUse || undefined,
      userId: user.uid,
      email: user.email || undefined,
      phone: user.phone || undefined,
      type: transactionType,

      // Required to match single global interface
      masterclassTitle: masterclass.title,
      videoTitle: video?.title || undefined,

    };


    /* -------------------------
     *    DUMMY PAYMENT
     * ------------------------- */
    if (paymentMethod === "dummy") {
      const dummyOrderId = `dummy_${Date.now()}`;
      const dummyPaymentId = `dummy_pay_${Date.now()}`;

      try {
        const verifyResponse = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: dummyOrderId,
            razorpay_payment_id: dummyPaymentId,
            razorpay_signature: "dummy_signature",
            masterclassId: masterclass.id,
            videoId: videoIdToUse,
            userId: user.uid,
            masterclassTitle: masterclass.title,
            videoTitle: video?.title || null,
            amount: purchaseAmount,
            method: "dummy",
            type: transactionType,
          }),
        });

        const verifyData = await verifyResponse.json();

        if (!verifyData.success) {
          throw new Error(verifyData.error || "Payment verification failed");
        }

        // Success messages based on type
        const successMessage = 
          transactionType === "free_registration"
            ? "Registered successfully! Check your email."
            : transactionType === "upcoming_registration"
              ? "Registration completed! Check your email for details."
              : transactionType === "video_purchase"
                ? "Video unlocked! Check your email for confirmation."
                : "Purchase successful! Check your email.";

        toast.success(successMessage);

        // Call success callbacks
        handleSuccessCallback({
          orderId: dummyOrderId,
          paymentId: dummyPaymentId,
          masterclassId: masterclass.id,
          videoId: videoIdToUse,
          amount: purchaseAmount,
          method: "dummy",
          type: transactionType,
          timestamp: new Date().toISOString(),
        });

        setTimeout(onClose, 500);
      } catch (err: any) {
        console.error("Dummy payment error:", err);
        setError(err.message || "Dummy payment failed");
        toast.error(err.message || "Payment failed");
      } finally {
        setProcessing(false);
      }
      return;
    }

    /* -------------------------
     *     RAZORPAY PAYMENT
     * ------------------------- */
    if (paymentMethod === "razorpay") {
      if (!razorpayLoaded) {
        setError("Failed to load Razorpay. Please refresh.");
        setProcessing(false);
        return;
      }

      try {
        await PaymentService.processRazorpayPayment(
          paymentDetails,
          purchaseTitle,

          // SUCCESS CALLBACK
          async (response) => {
            try {
              const verifyResponse = await fetch("/api/payment/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  masterclassId: masterclass.id,
                  videoId: videoIdToUse,
                  userId: user.uid,
                  masterclassTitle: masterclass.title,
                  videoTitle: video?.title || null,
                  amount: purchaseAmount,
                  method: "razorpay",
                  type: transactionType,
                }),
              });

              const verifyData = await verifyResponse.json();

              if (!verifyData.success) {
                throw new Error(verifyData.error || "Payment verification failed");
              }

              // Success messages
              const successMessage = 
                transactionType === "upcoming_registration"
                  ? "Registration successful! Check your email for details and reminders."
                  : transactionType === "video_purchase"
                    ? "Video unlocked! Check your email for confirmation."
                    : "Purchase successful! Check your email.";

              toast.success(successMessage);

              // Call success callbacks
              handleSuccessCallback({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                masterclassId: masterclass.id,
                videoId: videoIdToUse,
                amount: purchaseAmount,
                method: "razorpay",
                type: transactionType,
                timestamp: new Date().toISOString(),
              });

              setTimeout(onClose, 600);
            } catch (verifyErr: any) {
              console.error("Payment verification error:", verifyErr);
              setError(verifyErr.message || "Verification failed");
              toast.error("Payment verification failed. Please contact support.");
            } finally {
              setProcessing(false);
            }
          },

          // ERROR CALLBACK
          async (error) => {
            const msg = error?.error?.description || "Payment cancelled";
            setError(msg);
            toast.error(msg);
            setProcessing(false);
          }
        );
      } catch (err: any) {
        console.error("Razorpay payment error:", err);
        setError(err.message || "Payment failed");
        toast.error(err.message || "Payment failed");
        setProcessing(false);
      }
    }
  };

  const handleClose = () => {
    if (processing) {
      toast.error("Please wait for the payment to complete");
      return;
    }
    onClose();
  };

  const getHeaderText = () => {
    switch (transactionType) {
      case "free_registration":
        return "Free Registration";
      case "upcoming_registration":
        return "Register for Event";
      case "video_purchase":
        return "Purchase Video";
      default:
        return "Complete Purchase";
    }
  };

  const getPurchaseTypeLabel = () => {
    switch (transactionType) {
      case "free_registration":
        return "Free Registration";
      case "upcoming_registration":
        return "Event Registration";
      case "video_purchase":
        return "Individual Video";
      default:
        return "Full Masterclass";
    }
  };

  const getButtonText = () => {
    if (processing) return "Processing...";
    if (purchaseAmount === 0) return "Register Now";
    return `Pay ₹${purchaseAmount}`;
  };

  

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative">
          <button
            onClick={handleClose}
            disabled={processing}
            className="absolute top-4 right-4 hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-2xl font-bold mb-2">{getHeaderText()}</h2>
          <p className="text-blue-100 text-sm">
            {purchaseAmount === 0
              ? "Complete your free registration"
              : "Secure payment powered by Razorpay"}
          </p>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6">
          {/* PURCHASE INFO */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <span className="inline-block bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs font-semibold px-2 py-1 rounded mb-2">
              {getPurchaseTypeLabel()}
            </span>

            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
              {isVideoPurchase ? video?.title : masterclass.title}
            </h3>

            {video && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Part of: {masterclass.title}
              </p>
            )}

            {isUpcoming && masterclass.scheduled_date && (
              <p className="text-xs mt-2 text-blue-600 dark:text-blue-400 font-medium">
                📅 Scheduled:{" "}
                {new Date(masterclass.scheduled_date).toLocaleString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Total Amount</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {purchaseAmount === 0 ? "FREE" : `₹${purchaseAmount}`}
              </span>
            </div>
          </div>

          {/* INFO BOX - Email notification */}
          {purchaseAmount > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  You'll receive a confirmation email with purchase details
                  {transactionType === "upcoming_registration" && " and event reminders"}
                </p>
              </div>
            </div>
          )}

          {/* ERROR BOX */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 p-4 rounded-lg">
              <div className="flex gap-3">
                <AlertCircle className="text-red-600 dark:text-red-400 w-5 h-5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-red-700 dark:text-red-300 text-sm">
                    Payment Error
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
                </div>
                <button
                  onClick={() => setError("")}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                  aria-label="Dismiss error"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* PAYMENT METHODS */}
          {purchaseAmount > 0 && (
            <div>
              <label className="text-sm font-medium mb-3 block text-gray-700 dark:text-gray-300">
                Select Payment Method *
              </label>

              <div className="space-y-2">
                {/* Dummy Payment */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("dummy")}
                  disabled={processing}
                  className={`w-full p-4 rounded-lg border-2 flex items-center gap-3 transition ${
                    paymentMethod === "dummy"
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30"
                      : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                  } ${processing ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <CreditCard className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900 dark:text-white">Dummy Payment</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">For testing only</p>
                  </div>
                  {paymentMethod === "dummy" && (
                    <CheckCircle className="text-blue-600 w-5 h-5" />
                  )}
                </button>

                {/* Razorpay */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("razorpay")}
                  disabled={processing || !razorpayLoaded}
                  className={`w-full p-4 rounded-lg border-2 flex items-center gap-3 transition ${
                    paymentMethod === "razorpay"
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30"
                      : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                  } ${processing || !razorpayLoaded ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Shield className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900 dark:text-white">Razorpay</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {razorpayLoaded ? "UPI, Cards, NetBanking" : "Loading..."}
                    </p>
                  </div>
                  {paymentMethod === "razorpay" && (
                    <CheckCircle className="text-blue-600 w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={processing}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handlePayment}
              disabled={processing || (purchaseAmount > 0 && !paymentMethod)}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <div className="animate-spin w-5 h-5 border-b-2 border-white rounded-full"></div>
                  Processing...
                </>
              ) : (
                getButtonText()
              )}
            </button>
          </div>

          {/* Additional info for upcoming events */}
          {transactionType === "upcoming_registration" && purchaseAmount > 0 && (
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              💡 You'll receive reminder emails 24 hours and 2 hours before the event
            </p>
          )}
        </div>
      </div>
    </div>
  );
}